import { describe, expect, it } from "vitest";
import { alertRank, formatDuration, orderAlert } from "@/utils/orderAlerts";
import type { ApiOrder } from "@/utils/ordersApi";
import { formatKES } from "@/utils/currency";

const MINUTE = 60_000;
const NOW = Date.parse("2026-10-21T12:00:00Z");
const ago = (minutes: number) => new Date(NOW - minutes * MINUTE).toISOString();

function order(overrides: Partial<ApiOrder>): ApiOrder {
  return {
    id: "o1",
    pickup_address: "Kilimani",
    pickup_lat: null,
    pickup_lng: null,
    pickup_time: null,
    assigned_rider_id: null,
    notes: null,
    house_details: null,
    delivery_instructions: null,
    delivery_distance_km: null,
    delivery_distance_source: null,
    delivery_rate_per_km: null,
    delivery_fee: null,
    status: "pending_pickup",
    total_amount: null,
    remaining_amount: null,
    payment_status: "unpaid",
    created_at: ago(300),
    updated_at: ago(300),
    orderItems: [],
    ...overrides,
  };
}

describe("formatDuration", () => {
  it("formats minutes, hours and days", () => {
    expect(formatDuration(10 * 1000)).toBe("1 min");
    expect(formatDuration(45 * MINUTE)).toBe("45 min");
    expect(formatDuration(120 * MINUTE)).toBe("2h");
    expect(formatDuration(135 * MINUTE)).toBe("2h 15m");
    expect(formatDuration(50 * 60 * MINUTE)).toBe("2d");
  });
});

describe("orderAlert", () => {
  it("flags overdue and upcoming pickups", () => {
    expect(orderAlert(order({ pickup_time: ago(30) }), NOW)).toEqual({ level: "overdue", label: "Pickup overdue by 30 min" });
    expect(orderAlert(order({ pickup_time: ago(-20) }), NOW)).toEqual({ level: "soon", label: "Pickup due in 20 min" });
    expect(orderAlert(order({ pickup_time: ago(-90) }), NOW)).toBeNull();
    expect(orderAlert(order({ pickup_time: null }), NOW)).toBeNull();
  });

  it("uses the latest status-history entry for time in status", () => {
    const pickedUp = order({
      status: "picked_up",
      updated_at: ago(5),
      statusHistory: [
        { id: "h1", status: "picked_up", timestamp: ago(400) },
        { id: "h2", status: "picked_up", timestamp: ago(150) },
      ],
    });
    expect(orderAlert(pickedUp, NOW)?.label).toBe("At shop 2h 30m, not weighed");
  });

  it("falls back to updated_at without history", () => {
    expect(orderAlert(order({ status: "picked_up", updated_at: ago(60) }), NOW)).toBeNull();
  });

  it("chases payment before a rider for stale ready orders", () => {
    const ready = { status: "ready" as const, updated_at: ago(90) };
    expect(orderAlert(order({ ...ready, payment_status: "unpaid" }), NOW)?.label).toBe("Ready 1h 30m, not paid");
    expect(orderAlert(order({ ...ready, payment_status: "paid" }), NOW)?.label).toBe("Ready 1h 30m, no rider");
    expect(orderAlert(order({ ...ready, payment_status: "paid", assigned_rider_id: "r1" }), NOW)).toBeNull();
  });

  it("flags slow deliveries and ignores other statuses", () => {
    expect(orderAlert(order({ status: "out_for_delivery", updated_at: ago(180) }), NOW)?.level).toBe("overdue");
    expect(orderAlert(order({ status: "processing", updated_at: ago(1000) }), NOW)).toBeNull();
  });

  it("ranks overdue before soon before none", () => {
    expect(alertRank({ level: "overdue", label: "" })).toBe(0);
    expect(alertRank({ level: "soon", label: "" })).toBe(1);
    expect(alertRank(null)).toBe(2);
  });
});

describe("formatKES", () => {
  it("formats shillings with grouping", () => {
    expect(formatKES(1500)).toBe("KES 1,500");
    expect(formatKES(99.5)).toBe("KES 99.5");
  });
});
