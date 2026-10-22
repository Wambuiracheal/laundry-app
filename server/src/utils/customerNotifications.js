// Keeps customers updated as their order moves: every event is stored as a Notification (shown
// in the app) and, when the customer has SMS turned on, texted to their phone.

const { PrismaClient } = require('@prisma/client');
const { sendSms } = require('./sms');

const prisma = new PrismaClient();

const BRAND = 'Panda Laundry';

/** Same short reference the app shows, e.g. PL-3F2A9C. */
function orderRef(order) {
  return `PL-${order.id.replace(/-/g, '').slice(0, 6).toUpperCase()}`;
}

function formatKES(amount) {
  return `KES ${new Intl.NumberFormat('en-KE', { maximumFractionDigits: 2 }).format(Number(amount ?? 0))}`;
}

/** e.g. "Tue 21 Oct, 10:00" in Kenyan time. */
function formatPickup(date) {
  if (!date) return 'the scheduled time';
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Nairobi',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

/** Link to the order page, when the site's public URL is known (first CLIENT_URL origin). */
function trackingLink(order) {
  const origin = (process.env.CLIENT_URL || '').split(',')[0].trim().replace(/\/$/, '');
  return origin ? ` Track: ${origin}/order-tracking?id=${order.id}` : '';
}

const MESSAGES = {
  order_placed: (order) => `Pickup booked for ${formatPickup(order.pickup_time)}. Order ${orderRef(order)}. We'll text you as it moves.`,
  rescheduled: (order) => `Order ${orderRef(order)}: pickup moved to ${formatPickup(order.pickup_time)}.`,
  picked_up: (order) => `We've collected order ${orderRef(order)}. We'll weigh it at the shop and text you the price.`,
  processing: (order) =>
    order.total_amount === null
      ? `Order ${orderRef(order)} is being cleaned. We'll text you the total once it's priced.`
      : `Order ${orderRef(order)} is weighed and being cleaned. Total: ${formatKES(order.total_amount)}.`,
  ready: (order) =>
    order.payment_status === 'paid'
      ? `Order ${orderRef(order)} is clean and packed. A rider will bring it to you soon.`
      : `Order ${orderRef(order)} is clean and packed. Pay ${formatKES(order.remaining_amount ?? order.total_amount)} in the app and we'll deliver it.`,
  out_for_delivery: (order) => `Order ${orderRef(order)} is on its way to you.`,
  delivered: (order) => `Order ${orderRef(order)} has been delivered. Thank you for choosing ${BRAND}!`,
  cancelled: (order) => `Order ${orderRef(order)} has been cancelled.`,
  payment_received: (order, { amount } = {}) =>
    Number(order.remaining_amount ?? 0) > 0
      ? `We received ${formatKES(amount)} for order ${orderRef(order)}. Balance: ${formatKES(order.remaining_amount)}.`
      : `We received ${formatKES(amount)} for order ${orderRef(order)}. It's fully paid.`,
};

// Events where the app link is worth the extra SMS length.
const LINKED_EVENTS = new Set(['order_placed', 'processing', 'ready']);

/** The text for an event, or null for events customers aren't told about. */
function buildMessage(event, order, extra) {
  const build = MESSAGES[event];
  if (!build) return null;
  return `${BRAND}: ${build(order, extra)}${LINKED_EVENTS.has(event) ? trackingLink(order) : ''}`;
}

/**
 * Records and sends an update for an order. Best effort: errors are logged, never thrown, so
 * a notification problem can't fail the request that changed the order.
 */
async function notifyCustomer(orderId, event, extra) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: { select: { id: true, phone: true, sms_opt_in: true } } },
    });
    if (!order?.user) return null;

    const message = buildMessage(event, order, extra);
    if (!message) return null;

    const sms = order.user.sms_opt_in ? await sendSms(order.user.phone, message) : { status: 'skipped', error: 'Customer turned SMS off' };

    return await prisma.notification.create({
      data: {
        user_id: order.user.id,
        order_id: order.id,
        event,
        message,
        sms_status: sms.status,
        sms_error: sms.error ?? null,
      },
    });
  } catch (error) {
    console.warn(`Customer notification (${event}) failed:`, error.message);
    return null;
  }
}

/** Status changes that customers hear about; other statuses map to nothing. */
const STATUS_EVENTS = new Set(['picked_up', 'processing', 'ready', 'out_for_delivery', 'delivered', 'cancelled']);

/** Notifies the customer of a new status, if it's one they're told about. */
function notifyStatusChange(orderId, status) {
  return STATUS_EVENTS.has(status) ? notifyCustomer(orderId, status) : Promise.resolve(null);
}

module.exports = { buildMessage, notifyCustomer, notifyStatusChange, orderRef };
