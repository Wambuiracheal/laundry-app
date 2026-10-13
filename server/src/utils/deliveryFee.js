// The pickup + delivery fee: the customer pays for two trips (shop -> customer to collect, and
// back again to deliver), each priced at one-way road km x the rider rate. Distances always come
// from the map (OSRM road routing between the shop and the customer's map location); nobody
// enters them by hand. Riders are paid exactly these trip amounts, so what the customer is
// charged is what the riders receive.
const { getSettings } = require('./settings');
const { tripDistance } = require('./distance');
const { geocodeAddress } = require('./geocode');
const { refreshPaymentState } = require('./paymentState');

const TRIPS_PER_ORDER = 2;
// Orders that still need their fee worked out (e.g. the shop location was set after they were placed).
const OPEN_STATUSES = ['pending_pickup', 'picked_up', 'processing', 'ready'];

const roundMoney = (value) => Math.round(value * 100) / 100;

/** One trip's pay, in whole shillings. */
const tripFee = (km, rate) => Math.round(Number(km) * Number(rate));

/** Order columns for a given one-way distance and rate. */
function deliveryFeeFields(km, source, rate) {
  return {
    delivery_distance_km: km,
    delivery_distance_source: source,
    delivery_rate_per_km: rate,
    delivery_fee: tripFee(km, rate) * TRIPS_PER_ORDER,
  };
}

/**
 * Quotes the fee for a customer location, or returns null when it can't be worked out yet
 * (no customer location, or the shop location isn't set).
 */
async function quoteDelivery(customer) {
  if (customer?.lat == null || customer?.lng == null) return null;
  const settings = await getSettings();
  if (!settings.shop) return null;

  const { km, source } = await tripDistance(settings.shop, customer);
  return deliveryFeeFields(km, source, settings.riderRatePerKm);
}

/** Order total = priced items + delivery fee; then the balance and payment status follow. */
async function recalculateOrderTotal(db, orderId) {
  const order = await db.order.findUnique({ where: { id: orderId }, include: { orderItems: { select: { price: true } } } });
  const items = order.orderItems.reduce((sum, item) => sum + Number(item.price ?? 0), 0);
  await db.order.update({ where: { id: orderId }, data: { total_amount: roundMoney(items + Number(order.delivery_fee ?? 0)) } });
  return refreshPaymentState(db, orderId);
}

/**
 * Works out the delivery fee for an order that doesn't have one yet, from the map: uses the
 * order's pinned location, or looks the typed address up on the map. Updates the total and any
 * rider trips already waiting on the distance. Returns true when the order has a fee afterwards.
 * Map lookups happen outside any transaction.
 */
async function ensureDeliveryFee(db, orderId) {
  const order = await db.order.findUnique({
    where: { id: orderId },
    select: { delivery_fee: true, pickup_lat: true, pickup_lng: true, pickup_address: true },
  });
  if (!order) return false;
  if (order.delivery_fee !== null) return true;

  let location = order.pickup_lat != null && order.pickup_lng != null ? { lat: order.pickup_lat, lng: order.pickup_lng } : null;
  if (!location) {
    location = await geocodeAddress(order.pickup_address);
    if (location) {
      await db.order.update({ where: { id: orderId }, data: { pickup_lat: location.lat, pickup_lng: location.lng } });
    }
  }

  const fields = await quoteDelivery(location);
  if (!fields) return false;

  await db.order.update({ where: { id: orderId }, data: fields });
  // Trips a rider already completed get their pay now that the distance is known.
  await db.riderEarning.updateMany({
    where: { order_id: orderId, status: 'needs_distance' },
    data: {
      distance_km: fields.delivery_distance_km,
      distance_source: fields.delivery_distance_source,
      rate_per_km: fields.delivery_rate_per_km,
      amount: tripFee(fields.delivery_distance_km, fields.delivery_rate_per_km),
      status: 'unpaid',
    },
  });
  await recalculateOrderTotal(db, orderId);
  return true;
}

/** Prices every open order still missing a fee (run when the shop location is set or changed). */
async function backfillDeliveryFees(db) {
  const orders = await db.order.findMany({ where: { delivery_fee: null, status: { in: OPEN_STATUSES } }, select: { id: true } });
  let priced = 0;
  for (const { id } of orders) {
    if (await ensureDeliveryFee(db, id)) priced += 1;
  }
  return { pending: orders.length, priced };
}

/** True once every item is weighed/counted and the delivery fee is known, i.e. the customer can pay. */
const isOrderPriced = (order) =>
  order.orderItems.length > 0 && order.orderItems.every((item) => item.price !== null) && order.delivery_fee !== null;

module.exports = { tripFee, quoteDelivery, recalculateOrderTotal, ensureDeliveryFee, backfillDeliveryFees, isOrderPriced };
