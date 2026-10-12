"use client";

import { useRef, useState } from "react";
import { RiderMapCard } from "@/components/maps/RiderMapCard";
import { DeliveryInstructions } from "@/components/mobile/OrderDetails";
import { FirstName } from "@/components/mobile/SessionUser";
import { AppShell, Badge, PageHeading, SectionHeader, SoftCard, primaryButtonClass, secondaryButtonClass } from "@/components/mobile/primitives";
import { FormStatusMessage } from "@/components/shared/form/FormField";
import { useNow } from "@/hooks/useNow";
import { usePolledData } from "@/hooks/usePolledData";
import { formatKES } from "@/utils/currency";
import { alertRank, orderAlert } from "@/utils/orderAlerts";
import { fetchMyEarnings, type EarningStatus } from "@/utils/ridersApi";
import {
  ORDER_POLL_INTERVAL_MS,
  STATUS_LABELS,
  STATUS_TONES,
  claimJob,
  fetchRiderJobs,
  formatDateTime,
  orderRef,
  orderTotalLabel,
  paymentBadge,
  serviceSummary,
  updateJobStatus,
  whatsappUrl,
  type ApiOrder,
  type OrderStatus,
} from "@/utils/ordersApi";

/** The rider's next step for a job they hold, keyed by the order's current status. */
const nextStep: Partial<Record<OrderStatus, { status: OrderStatus; label: string }>> = {
  pending_pickup: { status: "picked_up", label: "Picked up, taking to shop" },
  ready: { status: "out_for_delivery", label: "Start delivery" },
  out_for_delivery: { status: "delivered", label: "Mark delivered" },
};

function isPickup(order: ApiOrder) {
  return order.status === "pending_pickup";
}

function directionsUrl(order: ApiOrder) {
  const destination =
    order.pickup_lat !== null && order.pickup_lng !== null ? `${order.pickup_lat},${order.pickup_lng}` : order.pickup_address;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
}

type JobCardProps = {
  order: ApiOrder;
  mine: boolean;
  busy: boolean;
  now: number;
  onAction: (order: ApiOrder) => void;
  /** Mine only: show turn-by-turn directions on the live map. */
  onShowRoute?: (order: ApiOrder) => void;
};

function JobCard({ order, mine, busy, now, onAction, onShowRoute }: JobCardProps) {
  const step = nextStep[order.status];
  const alert = orderAlert(order, now);
  const payment = paymentBadge(order);
  // Clothes are only released from the shop once the order is paid in full.
  const awaitingPayment = order.status === "ready" && order.payment_status !== "paid";
  const customer = order.user ? `${order.user.first_name} ${order.user.last_name ?? ""}`.trim() : "Customer";

  return (
    <SoftCard className={`lg:p-5 ${alert?.level === "overdue" ? "border-rose-300 ring-2 ring-rose-100" : ""}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{isPickup(order) ? "Pickup" : "Delivery"}</p>
          <h3 className="text-base font-semibold">Order {orderRef(order)}</h3>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {alert ? <Badge text={alert.label} tone={alert.level === "overdue" ? "red" : "amber"} /> : null}
          <Badge text={STATUS_LABELS[order.status]} tone={STATUS_TONES[order.status]} />
        </div>
      </div>

      <dl className="mt-3 space-y-2 text-sm">
        <div>
          <dt className="text-xs text-slate-500">{isPickup(order) ? "Collect from" : "Deliver to"}</dt>
          <dd className="font-medium">{order.pickup_address}</dd>
        </div>
        <DeliveryInstructions order={order} />
        {isPickup(order) ? (
          <div>
            <dt className="text-xs text-slate-500">Pickup time</dt>
            <dd>{formatDateTime(order.pickup_time)}</dd>
          </div>
        ) : null}
        <div>
          <dt className="text-xs text-slate-500">Items</dt>
          <dd>{serviceSummary(order)}</dd>
        </div>
        {!isPickup(order) ? (
          <div>
            <dt className="text-xs text-slate-500">Order total</dt>
            <dd className="flex items-center gap-2 font-semibold">
              {orderTotalLabel(order)}
              {payment ? <Badge text={payment.text} tone={payment.tone} /> : null}
            </dd>
          </div>
        ) : null}
        {order.notes ? (
          <div>
            <dt className="text-xs text-slate-500">Customer notes</dt>
            <dd className="whitespace-pre-line">{order.notes}</dd>
          </div>
        ) : null}
        {/* Contact details are shared once the rider has accepted the job. */}
        {mine && order.user?.phone ? (
          <div>
            <dt className="text-xs text-slate-500">Customer</dt>
            <dd>
              {customer} · {order.user.phone}
            </dd>
          </div>
        ) : null}
      </dl>

      <div className="mt-4 flex flex-wrap gap-2">
        {mine ? (
          <>
            {step ? (
              <button className={primaryButtonClass} type="button" disabled={busy || awaitingPayment} onClick={() => onAction(order)}>
                {step.label}
              </button>
            ) : null}
            {awaitingPayment ? <p className="w-full text-xs text-amber-700">Waiting for the customer to pay. Collect from the shop once it shows Paid.</p> : null}
            {order.user?.phone ? (
              <>
                <a href={`tel:${order.user.phone}`} className={secondaryButtonClass}>
                  Call
                </a>
                <a href={whatsappUrl(order.user.phone)} target="_blank" rel="noreferrer" className={secondaryButtonClass}>
                  WhatsApp
                </a>
              </>
            ) : null}
            {onShowRoute ? (
              <button type="button" onClick={() => onShowRoute(order)} className={secondaryButtonClass}>
                Show route
              </button>
            ) : null}
            <a href={directionsUrl(order)} target="_blank" rel="noreferrer" className={secondaryButtonClass}>
              Google Maps
            </a>
          </>
        ) : (
          <button className={primaryButtonClass} type="button" disabled={busy} onClick={() => onAction(order)}>
            Accept {isPickup(order) ? "pickup" : "delivery"}
          </button>
        )}
      </div>
    </SoftCard>
  );
}

const EARNINGS_POLL_INTERVAL_MS = 60_000;

const EARNING_STATUS_BADGES: Record<EarningStatus, { text: string; tone: "green" | "amber" | "gray" }> = {
  paid: { text: "Paid out", tone: "green" },
  unpaid: { text: "Owed", tone: "amber" },
  needs_distance: { text: "Distance pending", tone: "gray" },
};

/** Pay per trip: KES per km for each pickup and delivery the rider completed. */
function EarningsSection() {
  const { data, error } = usePolledData(fetchMyEarnings, EARNINGS_POLL_INTERVAL_MS);

  return (
    <section className="mt-8">
      <SectionHeader title="Earnings" />
      {error && !data ? <FormStatusMessage message={`Failed to load earnings: ${error}`} /> : null}
      {data ? (
        <>
          <div className="grid grid-cols-3 gap-3">
            <SoftCard>
              <p className="text-xs font-medium text-slate-500">Today</p>
              <p className="mt-1 text-lg font-semibold tabular-nums">{formatKES(data.totals.today)}</p>
              <p className="text-[11px] text-slate-500">
                {data.totals.tripsToday} trip{data.totals.tripsToday === 1 ? "" : "s"}
              </p>
            </SoftCard>
            <SoftCard>
              <p className="text-xs font-medium text-slate-500">This week</p>
              <p className="mt-1 text-lg font-semibold tabular-nums">{formatKES(data.totals.week)}</p>
            </SoftCard>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-xs font-medium text-emerald-800">Ready to pay you</p>
              <p className="mt-1 text-lg font-semibold tabular-nums text-emerald-900">{formatKES(data.totals.unpaid)}</p>
              {data.totals.held > 0 ? <p className="text-[11px] text-emerald-800">+ {formatKES(data.totals.held)} once customers pay</p> : null}
            </div>
          </div>
          {data.totals.awaitingDistance > 0 ? (
            <p className="mt-2 text-xs text-slate-500">
              {data.totals.awaitingDistance} trip{data.totals.awaitingDistance === 1 ? " is" : "s are"} waiting for the distance to be
              calculated from the map.
            </p>
          ) : null}

          {data.earnings.length === 0 ? (
            <SoftCard className="mt-3 text-center text-sm text-slate-500">Complete a pickup or delivery to start earning.</SoftCard>
          ) : (
            <SoftCard padding="p-0" className="mt-3 overflow-hidden">
              <ul className="divide-y divide-slate-100">
                {data.earnings.slice(0, 30).map((earning) => {
                  const badge = EARNING_STATUS_BADGES[earning.status];
                  return (
                    <li key={earning.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                      <div className="min-w-0">
                        <p className="font-medium">
                          {earning.leg === "pickup" ? "Pickup" : "Delivery"} · {orderRef({ id: earning.order_id })}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          {earning.distance_km ? `${Number(earning.distance_km)} km × ${formatKES(Number(earning.rate_per_km))}/km` : earning.order.pickup_address}
                          {" · "}
                          {formatDateTime(earning.created_at)}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <span className="font-semibold tabular-nums">{earning.amount ? formatKES(Number(earning.amount)) : "—"}</span>
                        <Badge
                          text={earning.status === "unpaid" && earning.order.payment_status !== "paid" ? "Held: customer unpaid" : badge.text}
                          tone={earning.status === "unpaid" && earning.order.payment_status !== "paid" ? "gray" : badge.tone}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </SoftCard>
          )}
        </>
      ) : null}
    </section>
  );
}

export function RiderScreen() {
  const { data: jobs, error, loading, setData } = usePolledData(fetchRiderJobs, ORDER_POLL_INTERVAL_MS);
  const now = useNow();
  // Overdue first, then due soon; the API already orders each group by pickup time.
  const byUrgency = (orders: ApiOrder[]) => [...orders].sort((a, b) => alertRank(orderAlert(a, now)) - alertRank(orderAlert(b, now)));
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [routeJobId, setRouteJobId] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  function showRoute(order: ApiOrder) {
    setRouteJobId(order.id);
    mapRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function run(order: ApiOrder, action: () => Promise<unknown>, success: string) {
    try {
      setBusyId(order.id);
      setMessage(null);
      await action();
      setData(await fetchRiderJobs());
      setMessage(success);
    } catch (err) {
      setMessage(`Update failed: ${err instanceof Error ? err.message : "please try again."}`);
      // The job may have been taken by another rider; show the current list.
      setData(await fetchRiderJobs().catch(() => jobs));
    } finally {
      setBusyId(null);
    }
  }

  function advance(order: ApiOrder) {
    const step = nextStep[order.status];
    if (step) void run(order, () => updateJobStatus(order.id, step.status), `${orderRef(order)}: ${STATUS_LABELS[step.status]}.`);
  }

  function accept(order: ApiOrder) {
    void run(order, () => claimJob(order.id), `${orderRef(order)} added to your jobs.`);
  }

  return (
    <AppShell active="jobs" nav="rider" homeHref="/rider">
      <PageHeading
        title={
          <>
            Hi, <FirstName />
          </>
        }
        subtitle={
          jobs
            ? `${jobs.mine.length} job${jobs.mine.length === 1 ? "" : "s"} in progress · ${jobs.available.length} open nearby`
            : "Your pickups and deliveries."
        }
      />

      {error && !jobs ? <FormStatusMessage message={`Failed to load jobs: ${error}`} /> : null}
      {loading ? <p className="text-sm text-slate-500">Loading jobs…</p> : null}
      {message ? (
        <div className="mb-4">
          <FormStatusMessage message={message} />
        </div>
      ) : null}

      {jobs ? (
        <div ref={mapRef} className="scroll-mt-20">
          <RiderMapCard jobs={jobs.mine} selectedId={routeJobId} onSelect={setRouteJobId} />
        </div>
      ) : null}

      {jobs ? (
        <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
          <section>
            <SectionHeader title="My jobs" />
            <div className="space-y-3">
              {jobs.mine.length === 0 ? (
                <SoftCard className="text-center text-sm text-slate-500">No jobs yet. Accept one from the open jobs list.</SoftCard>
              ) : (
                byUrgency(jobs.mine).map((order) => (
                  <JobCard key={order.id} order={order} mine busy={busyId === order.id} now={now} onAction={advance} onShowRoute={showRoute} />
                ))
              )}
            </div>
          </section>

          <section>
            <SectionHeader title="Open jobs" />
            <div className="space-y-3">
              {jobs.available.length === 0 ? (
                <SoftCard className="text-center text-sm text-slate-500">No open pickups or deliveries right now.</SoftCard>
              ) : (
                byUrgency(jobs.available).map((order) => (
                  <JobCard key={order.id} order={order} mine={false} busy={busyId === order.id} now={now} onAction={accept} />
                ))
              )}
            </div>
          </section>
        </div>
      ) : null}

      <EarningsSection />
    </AppShell>
  );
}
