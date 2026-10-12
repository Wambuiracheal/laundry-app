import { authRequest } from "@/utils/apiClient";
import { formatKES } from "@/utils/currency";

// Prisma serialises Decimal columns as strings.
type DecimalString = string;

export type ApiService = {
  id: string;
  name: string;
  description: string | null;
  price_type: "per_kg" | "per_item" | "fixed" | null;
  base_price: DecimalString | null;
};

export type ApiOrderItem = {
  id: string;
  service_id: string;
  service: ApiService;
  quantity: number;
  weight_kg: DecimalString | null;
  /** null until the shop has weighed/counted this item. */
  price: DecimalString | null;
};

export type OrderStatus =
  | "pending_pickup"
  | "picked_up"
  | "processing"
  | "ready"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export type ApiOrder = {
  id: string;
  pickup_address: string;
  pickup_time: string | null;
  notes: string | null;
  status: OrderStatus;
  total_amount: DecimalString | null;
  remaining_amount: DecimalString | null;
  payment_status: string;
  created_at: string;
  updated_at: string;
  orderItems: ApiOrderItem[];
  statusHistory: { id: string; status: OrderStatus; timestamp: string }[];
  user?: { first_name: string; last_name: string; phone: string; email: string };
};

export type MeasurementInput = { id: string; weight_kg?: number; quantity?: number };

/** Lifecycle order used by the progress timelines; `cancelled` sits outside it. */
export const ORDER_FLOW: OrderStatus[] = ["pending_pickup", "picked_up", "processing", "ready", "out_for_delivery", "delivered"];

export const STATUS_LABELS: Record<OrderStatus, string> = {
  pending_pickup: "Awaiting pickup",
  picked_up: "At the shop",
  processing: "Processing",
  ready: "Ready",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const STATUS_TONES: Record<OrderStatus, "green" | "blue" | "gray" | "amber"> = {
  pending_pickup: "amber",
  picked_up: "blue",
  processing: "green",
  ready: "green",
  out_for_delivery: "blue",
  delivered: "gray",
  cancelled: "gray",
};

/** How often customer screens re-fetch so shop updates (weights, prices, status) show up. */
export const ORDER_POLL_INTERVAL_MS = 15_000;

export function fetchServices() {
  return authRequest<ApiService[]>("/api/services");
}

export function requestOrder(payload: { service_ids: string[]; pickup_address: string; pickup_time: string; notes: string }) {
  return authRequest<ApiOrder>("/api/orders/request", { method: "POST", body: payload });
}

export function fetchMyOrders() {
  return authRequest<ApiOrder[]>("/api/orders/mine");
}

export function fetchOrderQueue() {
  return authRequest<ApiOrder[]>("/api/orders/queue");
}

export function measureOrder(orderId: string, items: MeasurementInput[]) {
  return authRequest<ApiOrder>(`/api/orders/${orderId}/measure`, { method: "PATCH", body: { items } });
}

export function updateOrderStatus(orderId: string, status: OrderStatus) {
  return authRequest<ApiOrder>(`/api/orders/${orderId}/status`, { method: "PATCH", body: { status } });
}

/** Short, human-friendly reference, e.g. "#PL-3F9A2C". */
export function orderRef(order: Pick<ApiOrder, "id">) {
  return `#PL-${order.id.replace(/-/g, "").slice(0, 6).toUpperCase()}`;
}

export function isMeasured(item: ApiOrderItem) {
  return item.price !== null;
}

export function isOrderFullyMeasured(order: ApiOrder) {
  return order.orderItems.length > 0 && order.orderItems.every(isMeasured);
}

export function rateLabel(service: ApiService) {
  const rate = formatKES(Number(service.base_price ?? 0));
  if (service.price_type === "per_kg") return `${rate} / kg`;
  if (service.price_type === "per_item") return `${rate} / item`;
  return rate;
}

/** e.g. "4.2 kg", "3 items", or null when not measured yet. */
export function measurementLabel(item: ApiOrderItem) {
  if (!isMeasured(item)) return null;
  if (item.service.price_type === "per_kg") return `${Number(item.weight_kg ?? 0)} kg`;
  if (item.service.price_type === "fixed") return "Flat rate";
  return `${item.quantity} item${item.quantity === 1 ? "" : "s"}`;
}

/** Total label for lists: the confirmed total once everything is weighed, otherwise a pending note. */
export function orderTotalLabel(order: ApiOrder) {
  return isOrderFullyMeasured(order) ? formatKES(Number(order.total_amount ?? 0)) : "Awaiting weighing";
}

export function serviceSummary(order: ApiOrder) {
  return order.orderItems.map((item) => item.service.name).join(", ");
}

export function formatDateTime(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-KE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
