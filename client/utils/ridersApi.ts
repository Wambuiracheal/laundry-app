import { authRequest } from "@/utils/apiClient";

export type EarningStatus = "needs_distance" | "unpaid" | "paid";

/** One paid trip: the pickup or the delivery of an order. Decimals arrive as strings. */
export type RiderEarning = {
  id: string;
  order_id: string;
  leg: "pickup" | "delivery";
  distance_km: string | null;
  distance_source: "road" | "straight_line" | null;
  rate_per_km: string;
  amount: string | null;
  status: EarningStatus;
  paid_at: string | null;
  created_at: string;
  order: { pickup_address: string; payment_status: string };
};

export type RiderEarningsSummary = {
  /** unpaid = payable now (customer has paid); held = waiting for the customer to pay. */
  totals: { today: number; week: number; unpaid: number; held: number; tripsToday: number; awaitingDistance: number };
  earnings: RiderEarning[];
};

export type RiderPayout = {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  /** Payable now: trips whose orders the customer has paid. */
  unpaid_total: number;
  unpaid_trips: number;
  /** Trips waiting for the customer to pay their order. */
  held_total: number;
  /** Unpaid trips plus trips still waiting for a distance. */
  earnings: RiderEarning[];
};

/** Reconciliation: delivery fees collected from customers vs rider pay. */
export type PayoutsOverview = {
  summary: { fees_collected: number; paid_to_riders: number; owed_to_riders: number; held: number };
  riders: RiderPayout[];
};

export type AppSettings = {
  riderRatePerKm: number;
  shop: { address: string; lat: number; lng: number } | null;
};

export function fetchMyEarnings() {
  return authRequest<RiderEarningsSummary>("/api/riders/me/earnings");
}

export function fetchPayouts() {
  return authRequest<PayoutsOverview>("/api/riders/payouts");
}

export function payOutRider(riderId: string) {
  return authRequest<{ paid_trips: number; paid_total: number }>(`/api/riders/${riderId}/payout`, { method: "POST" });
}

export function fetchSettings() {
  return authRequest<AppSettings>("/api/settings");
}

export function saveSettings(changes: { rider_rate_per_km?: number; shop?: { address: string; lat: number; lng: number } }) {
  return authRequest<AppSettings>("/api/settings", { method: "PATCH", body: changes });
}

export const DISTANCE_SOURCE_LABELS: Record<NonNullable<RiderEarning["distance_source"]>, string> = {
  road: "road distance",
  straight_line: "straight line (routing was unavailable)",
};
