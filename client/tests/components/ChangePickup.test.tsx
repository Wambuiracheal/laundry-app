import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CancelOrderScreen } from "@/components/mobile/screens/CancelOrderScreen";
import { RescheduleScreen } from "@/components/mobile/screens/RescheduleScreen";
import type { ApiOrder } from "@/utils/ordersApi";
import { saveSession } from "@/utils/session";

const push = vi.fn();
let searchParams = new URLSearchParams();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
  useSearchParams: () => searchParams,
}));

const tomorrow10 = new Date();
tomorrow10.setDate(tomorrow10.getDate() + 1);
tomorrow10.setHours(10, 0, 0, 0);

function order(overrides: Partial<ApiOrder>): ApiOrder {
  return {
    id: "3f2a9c11-0000-0000-0000-000000000000",
    pickup_address: "Yaya Centre, Kilimani",
    pickup_lat: -1.29,
    pickup_lng: 36.78,
    pickup_time: tomorrow10.toISOString(),
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
    payment_status: "pending",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    orderItems: [{ id: "i1", service_id: "s1", service: { id: "s1", name: "Wash & Fold", description: null, price_type: "per_kg", base_price: "150" }, quantity: 0, weight_kg: null, price: null }],
    statusHistory: [],
    ...overrides,
  };
}

/** Stubs the API: GET /mine returns `orders`; PATCH calls are recorded and echo the order back. */
function stubApi(orders: ApiOrder[], patchResponse?: Response) {
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    if (init?.method === "PATCH") return patchResponse ?? new Response(JSON.stringify(orders[0]), { status: 200 });
    if (url.endsWith("/api/orders/mine")) return new Response(JSON.stringify(orders), { status: 200 });
    return new Response(JSON.stringify({ notifications: [], unread: 0 }), { status: 200 });
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

const patchCalls = (fetchMock: ReturnType<typeof stubApi>) => fetchMock.mock.calls.filter(([, init]) => init?.method === "PATCH");

beforeEach(() => {
  push.mockClear();
  searchParams = new URLSearchParams();
  saveSession({ email: "jane@example.com", role: "customer" });
});

describe("Cancel order", () => {
  it("cancels the requested pending order and returns to it", async () => {
    const pending = order({});
    searchParams = new URLSearchParams({ id: pending.id });
    const fetchMock = stubApi([pending]);
    const user = userEvent.setup();
    render(<CancelOrderScreen />);

    await screen.findByText(/#PL-3F2A9C/);
    await user.click(screen.getByRole("button", { name: "Cancel order" }));
    expect(screen.getByText("Select a reason.")).toBeInTheDocument();
    expect(screen.getByText("You must confirm this action.")).toBeInTheDocument();
    expect(patchCalls(fetchMock)).toHaveLength(0);

    await user.selectOptions(screen.getByLabelText("Reason"), "Schedule conflict");
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "Cancel order" }));

    await waitFor(() => expect(push).toHaveBeenCalledWith(`/order-tracking?id=${pending.id}`));
    const [[url, init]] = patchCalls(fetchMock);
    expect(url).toMatch(new RegExp(`/api/orders/${pending.id}/cancel$`));
    expect(JSON.parse(String(init?.body))).toEqual({ reason: "Schedule conflict", details: "" });
  });

  it("points to support once the clothes have been collected", async () => {
    const collected = order({ status: "picked_up" });
    searchParams = new URLSearchParams({ id: collected.id });
    stubApi([collected]);
    render(<CancelOrderScreen />);

    expect(await screen.findByText(/has already been collected/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Contact support" })).toHaveAttribute("href", "/support");
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });

  it("shows the server's reason in red when cancelling fails", async () => {
    stubApi([order({})], new Response(JSON.stringify({ error: "Orders can only be cancelled before they are picked up." }), { status: 400 }));
    const user = userEvent.setup();
    render(<CancelOrderScreen />);

    await user.selectOptions(await screen.findByLabelText("Reason"), "Other");
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "Cancel order" }));

    const message = await screen.findByText("Orders can only be cancelled before they are picked up.");
    expect(message).toHaveClass("text-rose-700");
    expect(push).not.toHaveBeenCalled();
  });
});

describe("Reschedule pickup", () => {
  it("starts from the booked slot and saves a new one", async () => {
    const pending = order({});
    const fetchMock = stubApi([pending]);
    const user = userEvent.setup();
    render(<RescheduleScreen />);

    // No ?id=: falls back to the next pending pickup.
    const window = await screen.findByLabelText("Pickup window");
    expect(window).toHaveValue("10:00");
    // Saving the same slot again is pointless.
    expect(screen.getByRole("button", { name: "Save new pickup time" })).toBeDisabled();

    await user.selectOptions(window, "14:00");
    await user.click(screen.getByRole("button", { name: "Save new pickup time" }));

    await waitFor(() => expect(push).toHaveBeenCalledWith(`/order-tracking?id=${pending.id}`));
    const [[url, init]] = patchCalls(fetchMock);
    expect(url).toMatch(/\/reschedule$/);
    const expected = new Date(tomorrow10);
    expected.setHours(14);
    expect(JSON.parse(String(init?.body))).toEqual({ pickup_time: expected.toISOString() });
  });

  it("says so when there is nothing to reschedule", async () => {
    stubApi([order({ status: "delivered" })]);
    render(<RescheduleScreen />);
    expect(await screen.findByText("You have no pickups waiting to be collected.")).toBeInTheDocument();
  });
});
