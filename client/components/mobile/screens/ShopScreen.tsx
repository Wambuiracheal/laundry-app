"use client";

import { useState } from "react";
import { AppShell, Badge, PageHeading, SoftCard, primaryButtonClass, secondaryButtonClass } from "@/components/mobile/primitives";
import { FormStatusMessage, formControlClass } from "@/components/shared/form/FormField";
import { useSession } from "@/hooks/useSession";
import { usePolledData } from "@/hooks/usePolledData";
import { formatKES } from "@/utils/currency";
import {
  ORDER_FLOW,
  ORDER_POLL_INTERVAL_MS,
  STATUS_LABELS,
  STATUS_TONES,
  fetchOrderQueue,
  formatDateTime,
  isOrderFullyMeasured,
  measureOrder,
  orderRef,
  orderTotalLabel,
  rateLabel,
  updateOrderStatus,
  type ApiOrder,
  type ApiOrderItem,
  type MeasurementInput,
  type OrderStatus,
} from "@/utils/ordersApi";

const SHOP_ROLES = ["staff", "admin"];

const nextStepLabels: Partial<Record<OrderStatus, string>> = {
  picked_up: "Mark picked up",
  processing: "Start cleaning",
  ready: "Mark ready",
  out_for_delivery: "Send out for delivery",
  delivered: "Mark delivered",
};

/** The stored measurement for an item as an input string ("" when not measured yet). */
function storedValue(item: ApiOrderItem) {
  if (item.price === null) return "";
  return item.service.price_type === "per_kg" ? String(Number(item.weight_kg ?? 0)) : String(item.quantity);
}

function OrderCard({ order, onSaved }: { order: ApiOrder; onSaved: (order: ApiOrder) => void }) {
  // Drafts are kept apart from the polled order so a background refresh never wipes what staff are typing.
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const measurable = order.orderItems.filter((item) => item.service.price_type !== "fixed");
  const valueFor = (item: ApiOrderItem) => drafts[item.id] ?? storedValue(item);
  const previewPrice = (item: ApiOrderItem) => {
    if (item.service.price_type === "fixed") return Number(item.service.base_price ?? 0);
    const value = valueFor(item);
    return value === "" ? null : Number(item.service.base_price ?? 0) * Number(value);
  };
  const dirty = Object.keys(drafts).length > 0;
  const needsPricing = !isOrderFullyMeasured(order);

  const nextStatus = ORDER_FLOW[ORDER_FLOW.indexOf(order.status) + 1];
  const blockedByPricing = needsPricing && ["ready", "out_for_delivery", "delivered"].includes(nextStatus);

  async function saveMeasurements() {
    const items: MeasurementInput[] = [];
    for (const item of order.orderItems) {
      if (item.service.price_type === "fixed") {
        items.push({ id: item.id });
        continue;
      }
      const raw = valueFor(item).trim();
      if (raw === "") continue;
      const value = Number(raw);
      if (!Number.isFinite(value) || value < 0) {
        setMessage(`Invalid value for ${item.service.name}.`);
        return;
      }
      items.push(item.service.price_type === "per_kg" ? { id: item.id, weight_kg: value } : { id: item.id, quantity: value });
    }

    if (items.length === 0) {
      setMessage("Enter at least one weight or count.");
      return;
    }

    try {
      setBusy(true);
      setMessage(null);
      const updated = await measureOrder(order.id, items);
      setDrafts({});
      onSaved(updated);
      setMessage(isOrderFullyMeasured(updated) ? "Saved. The customer can now see the final price." : "Saved. Some items still need measuring.");
    } catch (error) {
      setMessage(`Save failed: ${error instanceof Error ? error.message : "please try again."}`);
    } finally {
      setBusy(false);
    }
  }

  async function advance() {
    if (!nextStatus) return;
    try {
      setBusy(true);
      setMessage(null);
      onSaved(await updateOrderStatus(order.id, nextStatus));
    } catch (error) {
      setMessage(`Status update failed: ${error instanceof Error ? error.message : "please try again."}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <SoftCard className="lg:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Order {orderRef(order)}</h2>
          {order.user ? (
            <p className="text-xs text-slate-500">
              {`${order.user.first_name} ${order.user.last_name}`.trim()} · {order.user.phone}
            </p>
          ) : null}
        </div>
        <div className="flex gap-1.5">
          {needsPricing ? <Badge text="Needs weighing" tone="amber" /> : null}
          <Badge text={STATUS_LABELS[order.status]} tone={STATUS_TONES[order.status]} />
        </div>
      </div>

      <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
        <div>
          <dt className="text-slate-500">Pickup</dt>
          <dd className="text-sm font-medium">{order.pickup_address}</dd>
          <dd className="text-slate-500">{formatDateTime(order.pickup_time)}</dd>
        </div>
        {order.notes ? (
          <div>
            <dt className="text-slate-500">Customer notes</dt>
            <dd className="whitespace-pre-line text-sm">{order.notes}</dd>
          </div>
        ) : null}
      </dl>

      <ul className="mt-3 divide-y divide-slate-100 border-t border-slate-100">
        {order.orderItems.map((item) => {
          const price = previewPrice(item);
          const unit = item.service.price_type === "per_kg" ? "kg" : "items";
          return (
            <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="text-sm font-medium">{item.service.name}</p>
                <p className="text-xs text-slate-500">{rateLabel(item.service)}</p>
              </div>
              <div className="flex items-center gap-3">
                {item.service.price_type === "fixed" ? (
                  <span className="text-xs text-slate-500">Flat rate</span>
                ) : (
                  <label className="flex items-center gap-2 text-xs text-slate-500">
                    <input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step={item.service.price_type === "per_kg" ? 0.1 : 1}
                      className={`${formControlClass} w-24 py-1.5 text-right`}
                      placeholder="0"
                      aria-label={`${item.service.name} ${unit}`}
                      value={valueFor(item)}
                      onChange={(event) => setDrafts((prev) => ({ ...prev, [item.id]: event.target.value }))}
                    />
                    {unit}
                  </label>
                )}
                <span className="w-24 text-right text-sm font-semibold tabular-nums">{price === null ? "—" : formatKES(price)}</span>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-sm">
        <span className="font-semibold">Saved total</span>
        <span className="font-semibold tabular-nums text-blue-700">{orderTotalLabel(order)}</span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {measurable.length > 0 || needsPricing ? (
          <button className={primaryButtonClass} type="button" onClick={saveMeasurements} disabled={busy || (!dirty && !needsPricing)}>
            Save measurements
          </button>
        ) : null}
        {nextStatus ? (
          <button
            className={secondaryButtonClass}
            type="button"
            onClick={advance}
            disabled={busy || blockedByPricing || dirty}
            title={blockedByPricing ? "Weigh or count every item first" : dirty ? "Save measurements first" : undefined}
          >
            {nextStepLabels[nextStatus]}
          </button>
        ) : null}
      </div>
      {message ? (
        <div className="mt-3">
          <FormStatusMessage message={message} />
        </div>
      ) : null}
    </SoftCard>
  );
}

export function ShopScreen() {
  const session = useSession();
  const { data: orders, error, loading, setData } = usePolledData(fetchOrderQueue, ORDER_POLL_INTERVAL_MS);

  if (session && !SHOP_ROLES.includes(session.role ?? "")) {
    return (
      <AppShell active="orders" title="Shop">
        <FormStatusMessage message="Access required: the shop console is for staff and admin accounts. Log in again if your role changed." />
      </AppShell>
    );
  }

  const replaceOrder = (updated: ApiOrder) =>
    setData((prev) => (prev ?? []).map((order) => (order.id === updated.id ? { ...order, ...updated } : order)));

  // Orders still waiting on the scale first, then oldest first.
  const sorted = [...(orders ?? [])].sort((a, b) => Number(isOrderFullyMeasured(a)) - Number(isOrderFullyMeasured(b)));
  const awaiting = sorted.filter((order) => !isOrderFullyMeasured(order)).length;

  return (
    <AppShell active="orders" title="Shop">
      <PageHeading
        title="Shop console"
        subtitle={
          orders
            ? `${orders.length} active order${orders.length === 1 ? "" : "s"} · ${awaiting} waiting to be weighed. Saved weights show up for the customer right away.`
            : "Weigh incoming laundry and update order status."
        }
      />

      {error && !orders ? <FormStatusMessage message={`Failed to load orders: ${error}`} /> : null}
      {loading ? <p className="text-sm text-slate-500">Loading orders…</p> : null}
      {orders && orders.length === 0 ? <SoftCard className="text-center text-sm text-slate-500">No active orders right now.</SoftCard> : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {sorted.map((order) => (
          <OrderCard key={order.id} order={order} onSaved={replaceOrder} />
        ))}
      </div>
    </AppShell>
  );
}
