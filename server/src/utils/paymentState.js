const roundMoney = (value) => Math.round(value * 100) / 100;

/**
 * Recomputes an order's remaining balance and payment status from its total, deposit and
 * successful payments. Pass the Prisma client or a transaction client.
 */
async function refreshPaymentState(db, orderId) {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { payments: { where: { status: 'success' }, select: { amount: true } } },
  });
  if (!order) return null;

  const total = Number(order.total_amount ?? 0);
  const paid = Number(order.deposit_amount ?? 0) + order.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
  const remaining = roundMoney(Math.max(total - paid, 0));
  const paymentStatus = total > 0 && remaining === 0 ? 'paid' : paid > 0 ? 'partial' : 'pending';

  return db.order.update({
    where: { id: orderId },
    data: { remaining_amount: remaining, payment_status: paymentStatus },
  });
}

module.exports = { refreshPaymentState };
