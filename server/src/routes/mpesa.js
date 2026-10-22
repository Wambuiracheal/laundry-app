const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { requireAuth, requireRole } = require('../middlewares/auth');
const { ROLES, SHOP_ROLES } = require('../utils/roles');
const { publishEvent } = require('../utils/redis');
const { refreshPaymentState } = require('../utils/paymentState');
const { notifyCustomer } = require('../utils/customerNotifications');
const { isOrderPriced } = require('../utils/deliveryFee');
const { MpesaError, isMpesaConfigured, normalizePhone, stkPush, queryStkStatus, parseCallback } = require('../utils/mpesa');

const router = express.Router();
const prisma = new PrismaClient();

// Don't ask Daraja about the same payment more than once per this interval (it rate-limits queries).
const QUERY_INTERVAL_MS = 5000;
// A prompt still unanswered after this long is treated as failed (Daraja itself gives up at ~1 min).
const PENDING_TIMEOUT_MS = 5 * 60 * 1000;
// Reuse an open prompt instead of sending a second one if the customer taps Pay again.
const DUPLICATE_WINDOW_MS = 2 * 60 * 1000;

const paymentSelect = {
  id: true,
  order_id: true,
  amount: true,
  payment_method: true,
  status: true,
  phone: true,
  mpesa_receipt: true,
  result_code: true,
  result_desc: true,
  created_at: true,
  updated_at: true,
  order: { select: { id: true, user_id: true, total_amount: true, remaining_amount: true, payment_status: true } },
};

const orderReference = (orderId) => `PL${orderId.replace(/-/g, '').slice(0, 6).toUpperCase()}`;

// Best effort: a missing Redis connection must not fail the request.
const notifyPaymentUpdated = (payment) =>
  publishEvent('laundry-events', { type: 'payment.updated', paymentId: payment.id, orderId: payment.order_id, status: payment.status }).catch(
    () => undefined,
  );

/**
 * Records the final outcome of a pending payment exactly once (callback and polling can race),
 * and on success books the transaction and updates the order balance.
 */
async function applyResult(paymentId, { state, code, desc, receipt = null }) {
  if (state === 'pending') return;

  const paid = await prisma.$transaction(async (tx) => {
    const { count } = await tx.payment.updateMany({
      where: { id: paymentId, status: 'pending' },
      data: { status: state, result_code: code, result_desc: desc?.slice(0, 191) ?? null, mpesa_receipt: receipt },
    });
    if (count === 0 || state !== 'success') return null;

    const payment = await tx.payment.findUnique({ where: { id: paymentId } });
    await tx.transaction.create({
      data: { payment_id: payment.id, mpesa_ref_no: receipt, amount: payment.amount, type: 'credit' },
    });
    await refreshPaymentState(tx, payment.order_id);
    return payment;
  });

  // After the commit, so the text quotes the updated balance.
  if (paid) void notifyCustomer(paid.order_id, 'payment_received', { amount: paid.amount });
}

/** For a pending payment, asks Daraja how it ended (throttled), then returns the fresh row. */
async function syncPendingPayment(payment) {
  if (payment.status !== 'pending' || !payment.checkout_request_id) return payment;

  const now = Date.now();
  if (payment.last_queried_at && now - payment.last_queried_at.getTime() < QUERY_INTERVAL_MS) return payment;
  await prisma.payment.update({ where: { id: payment.id }, data: { last_queried_at: new Date(now) } });

  try {
    const result = await queryStkStatus(payment.checkout_request_id);
    if (result.state === 'pending' && now - payment.created_at.getTime() > PENDING_TIMEOUT_MS) {
      await applyResult(payment.id, { state: 'failed', code: 'timeout', desc: 'No confirmation from M-Pesa in time' });
    } else {
      await applyResult(payment.id, result);
    }
  } catch (error) {
    // Leave it pending; the next check will try again.
    console.warn('M-Pesa status query failed:', error.message);
  }
  return prisma.payment.findUnique({ where: { id: payment.id }, select: { ...paymentSelect, checkout_request_id: true, last_queried_at: true } });
}

const present = ({ checkout_request_id, last_queried_at, order, ...payment }) => ({
  ...payment,
  order: order ? { id: order.id, total_amount: order.total_amount, remaining_amount: order.remaining_amount, payment_status: order.payment_status } : undefined,
});

// customer: send an M-Pesa PIN prompt for the order's outstanding balance
router.post('/stk', requireAuth, requireRole(ROLES.CUSTOMER), async (req, res) => {
  try {
    if (!isMpesaConfigured()) {
      return res.status(503).json({ error: 'M-Pesa payments are not set up yet' });
    }

    const phone = normalizePhone(req.body.phone);
    if (!phone) {
      return res.status(400).json({ error: 'Enter a Safaricom number like 0712 345 678' });
    }

    const order = await prisma.order.findUnique({ where: { id: req.body.order_id ?? '' }, include: { orderItems: true } });
    if (!order || order.user_id !== req.user.userId) {
      return res.status(404).json({ error: 'Order not found' });
    }
    if (order.status === 'cancelled') {
      return res.status(400).json({ error: 'This order was cancelled' });
    }
    if (!isOrderPriced(order)) {
      return res.status(400).json({ error: 'Your final price is not ready yet. You can pay once your clothes are weighed and the delivery fee is set.' });
    }

    const remaining = Number(order.remaining_amount ?? order.total_amount ?? 0);
    if (remaining <= 0) {
      return res.status(400).json({ error: 'This order is already paid' });
    }

    const open = await prisma.payment.findFirst({
      where: { order_id: order.id, status: 'pending', created_at: { gt: new Date(Date.now() - DUPLICATE_WINDOW_MS) } },
      select: { ...paymentSelect, checkout_request_id: true, last_queried_at: true },
    });
    if (open) {
      return res.json(present(open));
    }

    // M-Pesa only takes whole shillings, so round any cents up.
    const amount = Math.ceil(remaining);
    const payment = await prisma.payment.create({
      data: { order_id: order.id, amount, payment_method: 'mpesa', status: 'pending', phone },
    });

    try {
      const { checkoutRequestId, merchantRequestId } = await stkPush({
        phone,
        amount,
        accountReference: orderReference(order.id),
        description: 'Laundry order',
      });
      await prisma.payment.update({
        where: { id: payment.id },
        data: { checkout_request_id: checkoutRequestId, merchant_request_id: merchantRequestId },
      });
    } catch (error) {
      const desc = error instanceof MpesaError ? error.message : 'Could not reach M-Pesa';
      await prisma.payment.update({ where: { id: payment.id }, data: { status: 'failed', result_code: 'request_failed', result_desc: desc.slice(0, 191) } });
      return res.status(502).json({ error: `M-Pesa did not accept the request: ${desc}` });
    }

    const created = await prisma.payment.findUnique({ where: { id: payment.id }, select: paymentSelect });
    notifyPaymentUpdated(created);
    res.status(201).json(present(created));
  } catch (error) {
    res.status(500).json({ error: 'Failed to start M-Pesa payment', details: error.message });
  }
});

// Daraja posts the final result here when MPESA_CALLBACK_BASE_URL is a public HTTPS URL.
// The secret path segment stops anyone else from posting fake results.
router.post('/callback/:secret', async (req, res) => {
  // Always acknowledge so Daraja doesn't retry; problems are logged instead.
  const acknowledge = () => res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  try {
    if (!process.env.MPESA_CALLBACK_SECRET || req.params.secret !== process.env.MPESA_CALLBACK_SECRET) {
      return res.status(404).end();
    }

    const result = parseCallback(req.body);
    if (!result) return acknowledge();

    const payment = await prisma.payment.findUnique({ where: { checkout_request_id: result.checkoutRequestId } });
    if (!payment) {
      console.warn('M-Pesa callback for unknown checkout request', result.checkoutRequestId);
      return acknowledge();
    }

    if (result.code === '0' && payment.status === 'success' && result.receipt && !payment.mpesa_receipt) {
      // Polling may have confirmed it first; the callback is the only source of the receipt number.
      await prisma.payment.update({ where: { id: payment.id }, data: { mpesa_receipt: result.receipt } });
      await prisma.transaction.updateMany({ where: { payment_id: payment.id }, data: { mpesa_ref_no: result.receipt } });
    } else {
      await applyResult(payment.id, { state: result.code === '0' ? 'success' : 'failed', code: result.code, desc: result.desc, receipt: result.receipt });
    }

    notifyPaymentUpdated(payment);
    return acknowledge();
  } catch (error) {
    console.error('M-Pesa callback failed:', error);
    return acknowledge();
  }
});

// admin: payment log, newest first. ?status=failed|pending|success filters it.
router.get('/', requireAuth, requireRole(ROLES.ADMIN), async (req, res) => {
  try {
    const status = ['pending', 'success', 'failed'].includes(req.query.status) ? req.query.status : undefined;
    const payments = await prisma.payment.findMany({
      where: { payment_method: 'mpesa', ...(status ? { status } : {}) },
      select: {
        ...paymentSelect,
        order: {
          select: {
            id: true,
            user_id: true,
            total_amount: true,
            remaining_amount: true,
            payment_status: true,
            user: { select: { first_name: true, last_name: true } },
          },
        },
      },
      orderBy: { created_at: 'desc' },
      take: 200,
    });
    res.json(
      payments.map(({ order, ...payment }) => ({
        ...payment,
        order: { ...present({ order }).order, customer: `${order.user.first_name} ${order.user.last_name}`.trim() },
      })),
    );
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch payments', details: error.message });
  }
});

// customer (own orders) or shop: current state of a payment; checks Daraja while it's pending
router.get('/:paymentId', requireAuth, async (req, res) => {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: req.params.paymentId },
      select: { ...paymentSelect, checkout_request_id: true, last_queried_at: true },
    });
    const isShop = SHOP_ROLES.includes(req.user.role);
    if (!payment || (!isShop && payment.order.user_id !== req.user.userId)) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    const synced = await syncPendingPayment(payment);
    if (synced.status !== payment.status) notifyPaymentUpdated(synced);
    res.json(present(synced));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch payment', details: error.message });
  }
});

module.exports = router;
