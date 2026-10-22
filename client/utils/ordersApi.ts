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
  pickup_lat: number | null;
  pickup_lng: number | null;
  pickup_time: string | null;
  assigned_rider_id: string | null;
  notes: string | null;
  /** House/apartment/gate number. */
  house_details: string | null;
  /** Directions for the rider: landmarks, what to tell the guard. */
  delivery_instructions: string | null;
  /** One-way shop <-> customer distance; the fee covers two trips (pickup and delivery). */
  delivery_distance_km: DecimalString | null;
  delivery_distance_source: "road" | "straight_line" | null;
  delivery_rate_per_km: DecimalString | null;
  /** Pickup + delivery fee, included in total_amount; null until the distance is known. */
  delivery_fee: DecimalString | null;
  status: OrderStatus;
  total_amount: DecimalString | null;
  remaining_amount: DecimalString | null;
  payment_status: string;
  created_at: string;
  updated_at: string;
  orderItems: ApiOrderItem[];
  /** Not included in rider job payloads. */
  statusHistory?: { id: string; status: OrderStatus; timestamp: string }[];
  /** Damage logged at intake (customer and shop views; not in rider payloads). */
  damages?: DamageReport[];
  /** Riders only get the first name for open jobs; full contact details once they accept. */
  user?: { first_name: string; last_name?: string; phone?: string; email?: string };
  /** Shop queue only: the rider currently holding the job. */
  assignedRider?: { id: string; first_name: string; last_name: string; phone: string } | null;
};

export type RiderSummary = { id: string; first_name: string; last_name: string; phone: string; active_jobs: number };

/** Order statuses where a rider can hold the job. */
export const RIDER_ACTIVE_STATUSES: OrderStatus[] = ["pending_pickup", "ready", "out_for_delivery"];

export type RiderJobs = { mine: ApiOrder[]; available: ApiOrder[] };

/** Pre-existing damage found when the clothes reached the shop. */
export type DamageReport = {
  id: string;
  order_item_id: string | null;
  note: string;
  /** Short-lived signed link to the photo, or null when there is none. */
  photo_url: string | null;
  created_at: string;
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

export function requestOrder(payload: {
  service_ids: string[];
  pickup_address: string;
  pickup_lat: number | null;
  pickup_lng: number | null;
  pickup_time: string;
  notes: string;
  house_details: string;
  delivery_instructions: string;
}) {
  return authRequest<ApiOrder>("/api/orders/request", { method: "POST", body: payload });
}

export function fetchMyOrders() {
  return authRequest<ApiOrder[]>("/api/orders/mine");
}

/** Customers can change or cancel a pickup until the rider has collected the clothes. */
export function canChangePickup(order: Pick<ApiOrder, "status">) {
  return order.status === "pending_pickup";
}

export function rescheduleOrder(orderId: string, pickupTime: string) {
  return authRequest<ApiOrder>(`/api/orders/${orderId}/reschedule`, { method: "PATCH", body: { pickup_time: pickupTime } });
}

export function cancelOrder(orderId: string, payload: { reason: string; details: string }) {
  return authRequest<ApiOrder>(`/api/orders/${orderId}/cancel`, { method: "PATCH", body: payload });
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

export function fetchRiders() {
  return authRequest<RiderSummary[]>("/api/orders/riders");
}

/** Assign a rider, or pass null to return the job to the open pool. */
export function assignRider(orderId: string, riderId: string | null) {
  return authRequest<ApiOrder>(`/api/orders/${orderId}/assign`, { method: "PATCH", body: { rider_id: riderId } });
}

/** Log damage found at intake; the photo is optional. */
/** Pickup + delivery price for a pinned address. Null when the shop location isn't set yet. */
export type DeliveryQuote = {
  delivery_distance_km: number;
  delivery_distance_source: "road" | "straight_line";
  delivery_rate_per_km: number;
  delivery_fee: number;
};

export function fetchDeliveryQuote(lat: number, lng: number) {
  return authRequest<DeliveryQuote | null>(`/api/orders/delivery-quote?lat=${lat}&lng=${lng}`);
}

export function logDamage(orderId: string, damage: { note: string; orderItemId: string | null; photo: File | null }) {
  const form = new FormData();
  form.set("note", damage.note);
  if (damage.orderItemId) form.set("order_item_id", damage.orderItemId);
  if (damage.photo) form.set("photo", damage.photo);
  return authRequest<ApiOrder>(`/api/orders/${orderId}/damages`, { method: "POST", body: form });
}

export function deleteDamage(orderId: string, damageId: string) {
  return authRequest<ApiOrder>(`/api/orders/${orderId}/damages/${damageId}`, { method: "DELETE" });
}

export function updateService(serviceId: string, changes: Partial<Pick<ApiService, "base_price" | "price_type" | "description">>) {
  return authRequest<ApiService>(`/api/services/${serviceId}`, { method: "PATCH", body: changes });
}

export function fetchRiderJobs() {
  return authRequest<RiderJobs>("/api/orders/rider/jobs");
}

export function claimJob(orderId: string) {
  return authRequest<ApiOrder>(`/api/orders/${orderId}/claim`, { method: "POST" });
}

export function updateJobStatus(orderId: string, status: OrderStatus) {
  return authRequest<ApiOrder>(`/api/orders/${orderId}/rider-status`, { method: "PATCH", body: { status } });
}

/** wa.me link for a Kenyan number in +254…, 254… or 07… form. */
export function whatsappUrl(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits.startsWith("0") ? `254${digits.slice(1)}` : digits}`;
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

/** Final price known: every item weighed/counted and the delivery fee set. The customer can pay. */
export function isOrderPriced(order: ApiOrder) {
  return isOrderFullyMeasured(order) && order.delivery_fee !== null;
}

/** e.g. "6.5 km each way · 2 trips × KES 650", or null while the distance is unknown. */
export function deliveryFeeDetail(order: Pick<ApiOrder, "delivery_distance_km" | "delivery_rate_per_km">) {
  if (order.delivery_distance_km === null || order.delivery_rate_per_km === null) return null;
  const km = Number(order.delivery_distance_km);
  return `${km} km each way · 2 trips × ${formatKES(Math.round(km * Number(order.delivery_rate_per_km)))}`;
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

/** Payment state for an order once it has a final price, e.g. "Paid" or "KES 340 due". */
export function paymentBadge(order: ApiOrder): { text: string; tone: "green" | "amber" } | null {
  if (!isOrderPriced(order)) return null;
  if (order.payment_status === "paid") return { text: "Paid", tone: "green" };
  if (order.payment_status === "partial") {
    return { text: `${formatKES(Number(order.remaining_amount ?? 0))} due`, tone: "amber" };
  }
  return { text: "Unpaid", tone: "amber" };
}

/** Total label for lists: the final total once priced, otherwise what it is waiting on. */
export function orderTotalLabel(order: ApiOrder) {
  if (isOrderPriced(order)) return formatKES(Number(order.total_amount ?? 0));
  return isOrderFullyMeasured(order) ? "Delivery fee pending" : "Awaiting weighing";
}

export function serviceSummary(order: ApiOrder) {
  return order.orderItems.map((item) => item.service.name).join(", ");
}

export function formatDateTime(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-KE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
