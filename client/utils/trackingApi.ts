import { authRequest } from "@/utils/apiClient";
import type { OrderStatus } from "@/utils/ordersApi";

export type LatLng = { lat: number; lng: number };

export type RiderPosition = LatLng & {
  accuracy_m: number | null;
  heading: number | null;
  updated_at: string;
  /** Not updated for over 5 minutes; shown as "last seen" instead of live. */
  stale: boolean;
};

export type Route = {
  /** [lat, lng] points to draw. */
  coordinates: [number, number][];
  distance_m: number;
  duration_s: number;
  steps?: { instruction: string; distance_m: number }[];
};

export type OrderTracking = {
  home: LatLng | null;
  shop: LatLng | null;
  /** True while a rider is on the way to collect or deliver. */
  active: boolean;
  phase?: "pickup" | "delivery";
  rider?: { first_name: string; location: RiderPosition | null };
  route?: Route | null;
};

export type JobRoute = {
  destination: LatLng & { kind: "customer" | "shop"; address: string };
  route: Route | null;
};

export type LiveOverview = {
  shop: (LatLng & { address: string }) | null;
  riders: {
    id: string;
    name: string;
    phone: string;
    location: RiderPosition;
    jobs: { order_id: string; ref: string; status: OrderStatus }[];
  }[];
  orders: (LatLng & {
    id: string;
    ref: string;
    status: OrderStatus;
    payment_status: string;
    address: string;
    customer: string;
    assigned_rider_id: string | null;
  })[];
};

export function shareLocation(position: { lat: number; lng: number; accuracy_m?: number | null; heading?: number | null }) {
  return authRequest<void>("/api/tracking/me/location", { method: "PUT", body: position });
}

export function stopSharingLocation() {
  return authRequest<void>("/api/tracking/me/location", { method: "DELETE" });
}

export function fetchJobRoute(orderId: string, from: LatLng | null) {
  const query = from ? `?lat=${from.lat}&lng=${from.lng}` : "";
  return authRequest<JobRoute>(`/api/tracking/jobs/${orderId}/route${query}`);
}

export function fetchOrderTracking(orderId: string) {
  return authRequest<OrderTracking>(`/api/tracking/orders/${orderId}`);
}

export function fetchLiveOverview() {
  return authRequest<LiveOverview>("/api/tracking/live");
}

/** "12 min" / "1 h 5 min" */
export function formatDuration(seconds: number) {
  const minutes = Math.max(1, Math.round(seconds / 60));
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
}

/** "850 m" / "3.4 km" */
export function formatDistance(meters: number) {
  return meters < 1000 ? `${Math.round(meters / 10) * 10} m` : `${(meters / 1000).toFixed(1)} km`;
}

/** Straight-line distance in metres, for deciding when a rider has moved enough to matter. */
export function metersBetween(a: LatLng, b: LatLng) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6_371_000 * Math.asin(Math.sqrt(h));
}
