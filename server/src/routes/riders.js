const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { requireAuth, requireRole } = require('../middlewares/auth');
const { ROLES } = require('../utils/roles');

const router = express.Router();
const prisma = new PrismaClient();

// A trip is paid out of the delivery fee the customer pays, so it only becomes payable to the
// rider once its order is paid. Until then it is "held".
const PAYABLE = { status: 'unpaid', order: { payment_status: 'paid' } };

const earningSelect = {
  id: true,
  order_id: true,
  leg: true,
  distance_km: true,
  distance_source: true,
  rate_per_km: true,
  amount: true,
  status: true,
  paid_at: true,
  created_at: true,
  order: { select: { pickup_address: true, payment_status: true } },
};

const sum = (earnings) => Math.round(earnings.reduce((total, earning) => total + Number(earning.amount ?? 0), 0));
const isPayable = (earning) => earning.status === 'unpaid' && earning.order.payment_status === 'paid';
const isHeld = (earning) => earning.status === 'unpaid' && earning.order.payment_status !== 'paid';

// rider: their trips and pay, newest first, with totals for today, this week, payable and held
router.get('/me/earnings', requireAuth, requireRole(ROLES.RIDER), async (req, res) => {
  try {
    const earnings = await prisma.riderEarning.findMany({
      where: { rider_id: req.user.userId },
      select: earningSelect,
      orderBy: { created_at: 'desc' },
      take: 200,
    });

    // Day and week boundaries in Kenyan time (UTC+3, no daylight saving).
    const nairobiNow = new Date(Date.now() + 3 * 60 * 60 * 1000);
    const startOfToday = Date.UTC(nairobiNow.getUTCFullYear(), nairobiNow.getUTCMonth(), nairobiNow.getUTCDate()) - 3 * 60 * 60 * 1000;
    const daysSinceMonday = (nairobiNow.getUTCDay() + 6) % 7;
    const startOfWeek = startOfToday - daysSinceMonday * 24 * 60 * 60 * 1000;
    const since = (start) => earnings.filter((earning) => earning.created_at.getTime() >= start);

    res.json({
      totals: {
        today: sum(since(startOfToday)),
        week: sum(since(startOfWeek)),
        unpaid: sum(earnings.filter(isPayable)),
        held: sum(earnings.filter(isHeld)),
        tripsToday: since(startOfToday).length,
        awaitingDistance: earnings.filter((earning) => earning.status === 'needs_distance').length,
      },
      earnings,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch earnings', details: error.message });
  }
});

// admin: reconciliation. Delivery fees collected from customers vs what riders have been paid
// and are owed, plus each rider's open trips.
router.get('/payouts', requireAuth, requireRole(ROLES.ADMIN), async (req, res) => {
  try {
    const [riders, open, collected, paidOut] = await Promise.all([
      prisma.user.findMany({
        where: { role: ROLES.RIDER },
        select: { id: true, first_name: true, last_name: true, phone: true },
        orderBy: { first_name: 'asc' },
      }),
      prisma.riderEarning.findMany({
        where: { status: { in: ['unpaid', 'needs_distance'] } },
        select: { ...earningSelect, rider_id: true },
        orderBy: { created_at: 'asc' },
      }),
      prisma.order.aggregate({ where: { payment_status: 'paid' }, _sum: { delivery_fee: true } }),
      prisma.riderEarning.aggregate({ where: { status: 'paid' }, _sum: { amount: true } }),
    ]);

    res.json({
      summary: {
        fees_collected: Math.round(Number(collected._sum.delivery_fee ?? 0)),
        paid_to_riders: Math.round(Number(paidOut._sum.amount ?? 0)),
        owed_to_riders: sum(open.filter(isPayable)),
        held: sum(open.filter(isHeld)),
      },
      riders: riders.map((rider) => {
        const mine = open.filter((earning) => earning.rider_id === rider.id);
        const payable = mine.filter(isPayable);
        return {
          ...rider,
          unpaid_total: sum(payable),
          unpaid_trips: payable.length,
          held_total: sum(mine.filter(isHeld)),
          earnings: mine,
        };
      }),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch payouts', details: error.message });
  }
});

// admin: record that a rider has been paid everything currently payable to them
router.post('/:riderId/payout', requireAuth, requireRole(ROLES.ADMIN), async (req, res) => {
  try {
    const payable = await prisma.riderEarning.findMany({
      where: { rider_id: req.params.riderId, ...PAYABLE },
      select: { id: true, amount: true },
    });
    if (payable.length === 0) {
      return res.status(400).json({ error: 'Nothing payable for this rider yet' });
    }

    // Only settle the rows we totalled, so trips completed meanwhile stay open.
    await prisma.riderEarning.updateMany({
      where: { id: { in: payable.map((earning) => earning.id) }, status: 'unpaid' },
      data: { status: 'paid', paid_at: new Date() },
    });
    res.json({ paid_trips: payable.length, paid_total: sum(payable) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to record payout', details: error.message });
  }
});

module.exports = router;
