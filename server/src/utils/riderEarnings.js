const { PrismaClient } = require('@prisma/client');
const { tripFee } = require('./deliveryFee');

const prisma = new PrismaClient();

/**
 * Credits a rider for one completed trip of an order. The pickup and delivery trips are paid
 * separately because different riders may do them. Each trip pays the order's quoted trip fee,
 * i.e. the share of the delivery fee the customer is charged. If the order's distance isn't
 * known yet the trip waits ("needs_distance") until the shop enters it.
 * Safe to call more than once: each order/leg is only ever credited once.
 */
async function recordTripEarning({ orderId, riderId, leg }) {
  try {
    const existing = await prisma.riderEarning.findUnique({ where: { order_id_leg: { order_id: orderId, leg } } });
    if (existing) return existing;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { delivery_distance_km: true, delivery_distance_source: true, delivery_rate_per_km: true },
    });
    const known = order?.delivery_distance_km != null && order?.delivery_rate_per_km != null;

    return await prisma.riderEarning.create({
      data: {
        rider_id: riderId,
        order_id: orderId,
        leg,
        rate_per_km: order?.delivery_rate_per_km ?? 0,
        ...(known
          ? {
              status: 'unpaid',
              distance_km: order.delivery_distance_km,
              distance_source: order.delivery_distance_source,
              amount: tripFee(order.delivery_distance_km, order.delivery_rate_per_km),
            }
          : { status: 'needs_distance' }),
      },
    });
  } catch (error) {
    // A duplicate (P2002) means a concurrent call already credited this trip.
    if (error.code === 'P2002') return null;
    // Never fail the rider's status update over pay bookkeeping; it can be fixed by an admin.
    console.error('Failed to record rider earning:', error);
    return null;
  }
}

module.exports = { recordTripEarning };
