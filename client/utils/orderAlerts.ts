import type { ApiOrder, OrderStatus } from "@/utils/ordersApi";

const MINUTE = 60_000;

/** Thresholds for flagging orders that need attention. */
export const ALERT_THRESHOLDS = {
  /** Pickup counts as "due soon" this long before its scheduled time. */
  pickupDueSoonMs: 60 * MINUTE,
  /** Clothes at the shop not weighed after this long. */
  unweighedMs: 2 * 60 * MINUTE,
  /** A ready order nobody has accepted for delivery after this long. */
  readyWithoutRiderMs: 60 * MINUTE,
  /** A delivery still on the road after this long. */
  slowDeliveryMs: 2 * 60 * MINUTE,
};

export type OrderAlert = { level: "overdue" | "soon"; label: string };

export function formatDuration(ms: number) {
  const minutes = Math.max(1, Math.round(ms / MINUTE));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return minutes % 60 ? `${hours}h ${minutes % 60}m` : `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

/** When the order entered its current status (falls back to its last update). */
function enteredStatusAt(order: ApiOrder, status: OrderStatus) {
  const entry = order.statusHistory?.findLast((history) => history.status === status);
  return Date.parse(entry?.timestamp ?? order.updated_at);
}

/** The most pressing delay on an order, or null when it is on track. */
export function orderAlert(order: ApiOrder, now: number): OrderAlert | null {
  switch (order.status) {
    case "pending_pickup": {
      if (!order.pickup_time) return null;
      const untilPickup = Date.parse(order.pickup_time) - now;
      if (untilPickup < 0) return { level: "overdue", label: `Pickup overdue by ${formatDuration(-untilPickup)}` };
      if (untilPickup <= ALERT_THRESHOLDS.pickupDueSoonMs) return { level: "soon", label: `Pickup due in ${formatDuration(untilPickup)}` };
      return null;
    }
    case "picked_up": {
      const waiting = now - enteredStatusAt(order, "picked_up");
      return waiting > ALERT_THRESHOLDS.unweighedMs ? { level: "overdue", label: `At shop ${formatDuration(waiting)}, not weighed` } : null;
    }
    case "ready": {
      if (order.assigned_rider_id) return null;
      const waiting = now - enteredStatusAt(order, "ready");
      return waiting > ALERT_THRESHOLDS.readyWithoutRiderMs ? { level: "overdue", label: `Ready ${formatDuration(waiting)}, no rider` } : null;
    }
    case "out_for_delivery": {
      const onRoad = now - enteredStatusAt(order, "out_for_delivery");
      return onRoad > ALERT_THRESHOLDS.slowDeliveryMs ? { level: "overdue", label: `Out for delivery ${formatDuration(onRoad)}` } : null;
    }
    default:
      return null;
  }
}

/** Sort key: overdue first, then due soon, then everything else. */
export function alertRank(alert: OrderAlert | null) {
  return alert?.level === "overdue" ? 0 : alert?.level === "soon" ? 1 : 2;
}
