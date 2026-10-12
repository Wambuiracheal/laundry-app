"use client";

import Link from "next/link";
import { useState } from "react";
import { AppShell, Badge, PageHeading, SoftCard, primaryButtonClass, secondaryButtonClass } from "@/components/mobile/primitives";
import { FormStatusMessage, formControlClass, formSelectClass } from "@/components/shared/form/FormField";
import { useNow } from "@/hooks/useNow";
import { useSession } from "@/hooks/useSession";
import { usePolledData } from "@/hooks/usePolledData";
import { alertRank, orderAlert, type OrderAlert } from "@/utils/orderAlerts";
import { DamageList, DeliveryInstructions } from "@/components/mobile/OrderDetails";
import { formatKES } from "@/utils/currency";
import { compressImage } from "@/utils/imageCompress";
import {
  ORDER_FLOW,
  ORDER_POLL_INTERVAL_MS,
  RIDER_ACTIVE_STATUSES,
  STATUS_LABELS,
  STATUS_TONES,
  assignRider,
  deleteDamage,
  fetchOrderQueue,
  fetchRiders,
  formatDateTime,
  deliveryFeeDetail,
  isOrderFullyMeasured,
  isOrderPriced,
  logDamage,
  measureOrder,
  orderRef,
  orderTotalLabel,
  paymentBadge,
  rateLabel,
  updateOrderStatus,
  type ApiOrder,
  type ApiOrderItem,
  type MeasurementInput,
  type OrderStatus,
  type DamageReport,
  type RiderSummary,
} from "@/utils/ordersApi";

const SHOP_ROLES = ["staff", "admin"];
const RIDER_POLL_INTERVAL_MS = 60_000;

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

function riderName(rider: { first_name: string; last_name?: string }) {
  return `${rider.first_name} ${rider.last_name ?? ""}`.trim();
}

/** Statuses in which damage can still be logged: the clothes are at the shop, before or during washing. */
const DAMAGE_LOG_STATUSES: OrderStatus[] = ["picked_up", "processing"];

/** Intake check: log stains, tears and other pre-existing damage with an optional photo. */
function DamageSection({ order, onSaved }: { order: ApiOrder; onSaved: (order: ApiOrder) => void }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [itemId, setItemId] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  // Bumped after a save to reset the file input, which can't be cleared through state.
  const [fileInputKey, setFileInputKey] = useState(0);

  const canLog = DAMAGE_LOG_STATUSES.includes(order.status);
  const hasDamages = (order.damages ?? []).length > 0;
  if (!canLog && !hasDamages) return null;

  async function save() {
    if (!note.trim()) {
      setMessage("Describe the damage before saving.");
      return;
    }
    try {
      setBusy(true);
      setMessage(null);
      const upload = photo ? await compressImage(photo) : null;
      const updated = await logDamage(order.id, { note: note.trim(), orderItemId: itemId || null, photo: upload });
      onSaved(updated);
      setNote("");
      setItemId("");
      setPhoto(null);
      setFileInputKey((key) => key + 1);
      setOpen(false);
      setMessage("Damage logged. The customer can see it on their order.");
    } catch (error) {
      setMessage(`Save failed: ${error instanceof Error ? error.message : "please try again."}`);
    } finally {
      setBusy(false);
    }
  }

  async function remove(damage: DamageReport) {
    try {
      setBusy(true);
      setMessage(null);
      onSaved(await deleteDamage(order.id, damage.id));
    } catch (error) {
      setMessage(`Remove failed: ${error instanceof Error ? error.message : "please try again."}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Condition at intake</p>
        {canLog && !open ? (
          <button type="button" onClick={() => setOpen(true)} className="text-xs font-semibold text-blue-700 hover:text-blue-800">
            + Log damage
          </button>
        ) : null}
      </div>

      <DamageList order={order} busy={busy} onDelete={canLog ? remove : undefined} />
      {canLog && !hasDamages && !open ? <p className="text-xs text-slate-500">Check for stains and tears before washing.</p> : null}

      {open ? (
        <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <select
            className={`${formSelectClass} py-1.5`}
            aria-label="Affected item"
            value={itemId}
            onChange={(event) => setItemId(event.target.value)}
          >
            <option value="">Whole order</option>
            {order.orderItems.map((item) => (
              <option key={item.id} value={item.id}>
                {item.service.name}
              </option>
            ))}
          </select>
          <textarea
            className={`${formControlClass} min-h-16`}
            aria-label="Damage description"
            placeholder="e.g. Red wine stain on white shirt collar; small tear on left sleeve"
            maxLength={1000}
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
          <label className="block text-xs font-medium text-slate-600">
            Photo (optional)
            <input
              key={fileInputKey}
              type="file"
              accept="image/*"
              capture="environment"
              className="mt-1 block w-full text-xs file:mr-3 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-slate-700"
              onChange={(event) => setPhoto(event.target.files?.[0] ?? null)}
            />
          </label>
          <div className="flex gap-2">
            <button className={`${primaryButtonClass} py-2`} type="button" onClick={save} disabled={busy}>
              {busy ? "Saving…" : "Save"}
            </button>
            <button className={`${secondaryButtonClass} py-2`} type="button" onClick={() => setOpen(false)} disabled={busy}>
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {message ? <FormStatusMessage message={message} /> : null}
    </div>
  );
}

/** Pickup + delivery fee line. The distance always comes from the map; nobody enters it. */
function DeliveryFeeRow({ order }: { order: ApiOrder }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 py-3">
      <div className="min-w-0">
        <p className="text-sm font-medium">Pickup & delivery</p>
        <p className="text-xs text-slate-500">
          {deliveryFeeDetail(order) ?? "Worked out from the map once the shop location is set (Riders page)."}
          {order.delivery_distance_source === "straight_line" ? " (straight line: road routing was unavailable)" : ""}
        </p>
      </div>
      {order.delivery_fee === null ? (
        <Badge text="Distance pending" tone="amber" />
      ) : (
        <span className="w-24 text-right text-sm font-semibold tabular-nums">{formatKES(Number(order.delivery_fee))}</span>
      )}
    </div>
  );
}

type OrderCardProps = {
  order: ApiOrder;
  alert: OrderAlert | null;
  riders: RiderSummary[] | null;
  onSaved: (order: ApiOrder) => void;
};

function OrderCard({ order, alert, riders, onSaved }: OrderCardProps) {
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
  const payment = paymentBadge(order);

  const nextStatus = ORDER_FLOW[ORDER_FLOW.indexOf(order.status) + 1];
  // The customer needs a final price (items + delivery fee) before the order is ready.
  const blockedByPricing = !isOrderPriced(order) && ["ready", "out_for_delivery", "delivered"].includes(nextStatus);
  // Clothes only leave the shop once the customer has paid in full.
  const blockedByPayment = ["out_for_delivery", "delivered"].includes(nextStatus) && order.payment_status !== "paid";

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

  async function assign(riderId: string | null) {
    try {
      setBusy(true);
      setMessage(null);
      const updated = await assignRider(order.id, riderId);
      onSaved(updated);
      setMessage(riderId ? `Assigned to ${updated.assignedRider ? riderName(updated.assignedRider) : "rider"}.` : "Job returned to the open pool.");
    } catch (error) {
      setMessage(`Assignment failed: ${error instanceof Error ? error.message : "please try again."}`);
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
    <SoftCard className={`lg:p-5 ${alert?.level === "overdue" ? "border-rose-300 ring-2 ring-rose-100" : ""}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Order {orderRef(order)}</h2>
          {order.user ? (
            <p className="text-xs text-slate-500">
              {`${order.user.first_name} ${order.user.last_name ?? ""}`.trim()} · {order.user.phone}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {alert ? <Badge text={alert.label} tone={alert.level === "overdue" ? "red" : "amber"} /> : null}
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

      <div className="mt-3">
        <DeliveryInstructions order={order} />
      </div>

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

      <DeliveryFeeRow order={order} />

      <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-sm">
        <span className="flex items-center gap-2 font-semibold">
          Saved total
          {payment ? <Badge text={payment.text} tone={payment.tone} /> : null}
        </span>
        <span className="font-semibold tabular-nums text-blue-700">{orderTotalLabel(order)}</span>
      </div>

      <DamageSection order={order} onSaved={onSaved} />

      {RIDER_ACTIVE_STATUSES.includes(order.status) ? (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
          <label htmlFor={`rider-${order.id}`} className="text-xs font-medium text-slate-500">
            {order.status === "pending_pickup" ? "Pickup rider" : "Delivery rider"}
          </label>
          <select
            id={`rider-${order.id}`}
            className={`${formSelectClass} min-w-0 flex-1 py-1.5`}
            value={order.assigned_rider_id ?? ""}
            disabled={busy || !riders}
            onChange={(event) => assign(event.target.value || null)}
          >
            {/* An order out for delivery can be handed to another rider but not left without one. */}
            {order.status !== "out_for_delivery" ? <option value="">Open to all riders</option> : null}
            {order.assignedRider && !riders?.some((rider) => rider.id === order.assignedRider?.id) ? (
              <option value={order.assignedRider.id}>{riderName(order.assignedRider)}</option>
            ) : null}
            {(riders ?? []).map((rider) => (
              <option key={rider.id} value={rider.id}>
                {riderName(rider)} · {rider.active_jobs} active
              </option>
            ))}
          </select>
          {order.assignedRider ? (
            <a href={`tel:${order.assignedRider.phone}`} className="text-xs font-semibold text-blue-700 hover:text-blue-800">
              Call rider
            </a>
          ) : null}
        </div>
      ) : null}

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
            disabled={busy || blockedByPricing || blockedByPayment || dirty}
            title={
              blockedByPricing
                ? needsPricing
                  ? "Weigh or count every item first"
                  : "Waiting for the delivery distance (set the shop location)"
                : blockedByPayment
                  ? "Waiting for the customer to pay"
                  : dirty
                    ? "Save measurements first"
                    : undefined
            }
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

type QueueTab = { key: string; label: string; match: (order: ApiOrder, alert: OrderAlert | null) => boolean };

const QUEUE_TABS: QueueTab[] = [
  { key: "all", label: "All", match: () => true },
  { key: "attention", label: "Needs attention", match: (_order, alert) => alert !== null },
  { key: "pickup", label: "Awaiting pickup", match: (order) => order.status === "pending_pickup" },
  { key: "shop", label: "At shop", match: (order) => order.status === "picked_up" || order.status === "processing" },
  { key: "ready", label: "Ready", match: (order) => order.status === "ready" },
  { key: "delivery", label: "Out for delivery", match: (order) => order.status === "out_for_delivery" },
];

export function ShopScreen() {
  const session = useSession();
  const { data: orders, error, loading, setData } = usePolledData(fetchOrderQueue, ORDER_POLL_INTERVAL_MS);
  const { data: riders } = usePolledData(fetchRiders, RIDER_POLL_INTERVAL_MS);
  const now = useNow();
  const [tab, setTab] = useState("all");
  const nav = session?.role === "admin" ? "admin" : "shop";

  if (session && !SHOP_ROLES.includes(session.role ?? "")) {
    return (
      <AppShell active="shop" nav={nav} homeHref="/shop" title="Shop">
        <FormStatusMessage message="Access required: the shop console is for staff and admin accounts. Log in again if your role changed." />
      </AppShell>
    );
  }

  const replaceOrder = (updated: ApiOrder) =>
    setData((prev) => (prev ?? []).map((order) => (order.id === updated.id ? { ...order, ...updated } : order)));

  const withAlerts = (orders ?? []).map((order) => ({ order, alert: orderAlert(order, now) }));
  // Most urgent first, then orders still waiting on the scale; the API returns oldest first.
  withAlerts.sort(
    (a, b) =>
      alertRank(a.alert) - alertRank(b.alert) || Number(isOrderFullyMeasured(a.order)) - Number(isOrderFullyMeasured(b.order)),
  );
  const activeTab = QUEUE_TABS.find((candidate) => candidate.key === tab) ?? QUEUE_TABS[0];
  const visible = withAlerts.filter(({ order, alert }) => activeTab.match(order, alert));
  const overdueCount = withAlerts.filter(({ alert }) => alert?.level === "overdue").length;
  const awaiting = withAlerts.filter(({ order }) => !isOrderFullyMeasured(order)).length;

  return (
    <AppShell active="shop" nav={nav} homeHref="/shop" title="Shop">
      <PageHeading
        title="Shop console"
        subtitle={
          orders
            ? `${orders.length} active order${orders.length === 1 ? "" : "s"} · ${awaiting} waiting to be weighed. Saved weights show up for the customer right away.`
            : "Weigh incoming laundry, dispatch riders and update order status."
        }
        action={
          <Link href="/shop/map" className={secondaryButtonClass}>
            Live map
          </Link>
        }
      />

      {error && !orders ? <FormStatusMessage message={`Failed to load orders: ${error}`} /> : null}
      {loading ? <p className="text-sm text-slate-500">Loading orders…</p> : null}

      {overdueCount > 0 && tab !== "attention" ? (
        <button
          type="button"
          onClick={() => setTab("attention")}
          className="mb-4 flex w-full items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-left text-sm font-semibold text-rose-800 transition hover:bg-rose-100"
        >
          {overdueCount} order{overdueCount === 1 ? " is" : "s are"} running late
          <span className="text-xs font-medium">Show them →</span>
        </button>
      ) : null}

      {orders ? (
        <div className="-mx-4 mb-4 overflow-x-auto px-4 md:mx-0 md:px-0">
          <div className="flex w-max gap-2" role="group" aria-label="Filter orders by status">
            {QUEUE_TABS.map((candidate) => {
              const count = withAlerts.filter(({ order, alert }) => candidate.match(order, alert)).length;
              const selected = candidate.key === activeTab.key;
              return (
                <button
                  key={candidate.key}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setTab(candidate.key)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    selected ? "border-blue-700 bg-blue-700 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                  }`}
                >
                  {candidate.label}
                  <span className={`rounded-full px-1.5 tabular-nums ${selected ? "bg-white/20" : "bg-slate-100 text-slate-600"}`}>{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {orders && visible.length === 0 ? (
        <SoftCard className="text-center text-sm text-slate-500">
          {orders.length === 0 ? "No active orders right now." : "Nothing in this list right now."}
        </SoftCard>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {visible.map(({ order, alert }) => (
          <OrderCard key={order.id} order={order} alert={alert} riders={riders} onSaved={replaceOrder} />
        ))}
      </div>
    </AppShell>
  );
}
