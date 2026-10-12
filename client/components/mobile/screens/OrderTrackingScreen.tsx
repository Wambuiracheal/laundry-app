"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { CheckIcon, PlusIcon } from "@/components/mobile/icons";
import { AppShell, Badge, PageHeading, SoftCard, primaryButtonClass, secondaryButtonClass } from "@/components/mobile/primitives";
import { DamageList, DeliveryInstructions } from "@/components/mobile/OrderDetails";
import { FormStatusMessage } from "@/components/shared/form/FormField";
import { CustomerTrackingCard } from "@/components/maps/CustomerTrackingCard";
import { PaymentCard } from "@/components/mobile/PaymentCard";
import { usePolledData } from "@/hooks/usePolledData";
import { formatKES } from "@/utils/currency";
import {
  ORDER_FLOW,
  ORDER_POLL_INTERVAL_MS,
  STATUS_LABELS,
  STATUS_TONES,
  fetchMyOrders,
  formatDateTime,
  isMeasured,
  deliveryFeeDetail,
  isOrderPriced,
  measurementLabel,
  orderRef,
  orderTotalLabel,
  paymentBadge,
  rateLabel,
  serviceSummary,
  type ApiOrder,
  type OrderStatus,
} from "@/utils/ordersApi";

const timelineCopy: Record<Exclude<OrderStatus, "cancelled">, { title: string; detail: string }> = {
  pending_pickup: { title: "Order placed", detail: "We've received your pickup request." },
  picked_up: { title: "Picked up", detail: "Your clothes are on their way to the shop to be weighed." },
  processing: { title: "Weighed & cleaning", detail: "Weighed, priced and now being professionally cleaned." },
  ready: { title: "Ready", detail: "Cleaned, folded and packed." },
  out_for_delivery: { title: "Out for delivery", detail: "On the way to your doorstep." },
  delivered: { title: "Delivered", detail: "Order safely returned to you." },
};

function Timeline({ order }: { order: ApiOrder }) {
  const currentIndex = ORDER_FLOW.indexOf(order.status);
  const reachedAt = (status: OrderStatus) => order.statusHistory?.findLast((entry) => entry.status === status)?.timestamp ?? null;

  return (
    <ol className="mt-4">
      {ORDER_FLOW.map((status, index) => {
        const done = currentIndex >= index;
        const active = index === currentIndex && status !== "delivered";
        const time = done ? reachedAt(status) : null;
        const copy = timelineCopy[status as keyof typeof timelineCopy];

        return (
          <li key={status} className="relative flex gap-3 pb-5 last:pb-0">
            {index < ORDER_FLOW.length - 1 ? (
              <span className={`absolute bottom-0 left-3.5 top-8 w-px ${done && !active ? "bg-blue-600" : "bg-slate-200"}`} />
            ) : null}
            <span
              className={`relative inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold ${
                done
                  ? active
                    ? "border-blue-600 bg-blue-50 text-blue-700 ring-4 ring-blue-100"
                    : "border-blue-600 bg-blue-600 text-white"
                  : "border-slate-200 bg-slate-50 text-slate-400"
              }`}
            >
              {done ? <CheckIcon className="h-3.5 w-3.5" /> : index + 1}
            </span>
            <div className="pt-0.5">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <p className={`text-sm font-semibold ${active ? "text-blue-700" : done ? "text-slate-900" : "text-slate-500"}`}>{copy.title}</p>
                {time ? <span className="text-xs text-slate-400">{formatDateTime(time)}</span> : null}
              </div>
              <p className="text-xs text-slate-500">{copy.detail}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function ItemsCard({ order }: { order: ApiOrder }) {
  const measured = isOrderPriced(order);
  const payment = paymentBadge(order);

  return (
    <SoftCard className="lg:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Your items</h2>
          <p className="text-xs text-slate-500">
            {measured ? "Weighed and priced at the shop." : "We'll weigh your clothes when they reach the shop."}
          </p>
        </div>
        <Badge text={STATUS_LABELS[order.status]} tone={STATUS_TONES[order.status]} />
      </div>

      <ul className="mt-3 divide-y divide-slate-100">
        {order.orderItems.map((item) => {
          const measurement = measurementLabel(item);
          return (
            <li key={item.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
              <div>
                <p className="font-medium text-slate-800">{item.service.name}</p>
                <p className="text-xs text-slate-500">
                  {measurement ? `${measurement} × ${rateLabel(item.service)}` : rateLabel(item.service)}
                </p>
              </div>
              {isMeasured(item) ? (
                <span className="font-semibold tabular-nums">{formatKES(Number(item.price))}</span>
              ) : (
                <Badge text="Awaiting weighing" tone="amber" />
              )}
            </li>
          );
        })}
        <li className="flex items-center justify-between gap-3 py-2.5 text-sm">
          <div>
            <p className="font-medium text-slate-800">Pickup & delivery</p>
            <p className="text-xs text-slate-500">{deliveryFeeDetail(order) ?? "Being worked out from the map"}</p>
          </div>
          {order.delivery_fee !== null ? (
            <span className="font-semibold tabular-nums">{formatKES(Number(order.delivery_fee))}</span>
          ) : (
            <Badge text="Pending" tone="amber" />
          )}
        </li>
      </ul>

      <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-3">
        <span className="flex items-center gap-2 text-sm font-semibold">
          Total
          {payment ? <Badge text={payment.text} tone={payment.tone} /> : null}
        </span>
        <span className={`text-base font-semibold tabular-nums ${measured ? "text-blue-700" : "text-slate-500"}`}>{orderTotalLabel(order)}</span>
      </div>
    </SoftCard>
  );
}

function OrderSwitcher({ orders, selectedId }: { orders: ApiOrder[]; selectedId: string }) {
  if (orders.length < 2) return null;

  return (
    <SoftCard className="lg:p-5">
      <h2 className="text-base font-semibold">Your orders</h2>
      <ul className="mt-2 divide-y divide-slate-100">
        {orders.map((order) => (
          <li key={order.id}>
            <Link
              href={`/order-tracking?id=${order.id}`}
              className={`flex items-center justify-between gap-3 py-2.5 text-sm ${order.id === selectedId ? "font-semibold text-blue-700" : "text-slate-700"}`}
            >
              <span className="min-w-0">
                <span className="block">{orderRef(order)}</span>
                <span className="block truncate text-xs font-normal text-slate-500">{serviceSummary(order)}</span>
              </span>
              <Badge text={STATUS_LABELS[order.status]} tone={STATUS_TONES[order.status]} />
            </Link>
          </li>
        ))}
      </ul>
    </SoftCard>
  );
}

export function OrderTrackingScreen() {
  const requestedId = useSearchParams().get("id");
  const { data: orders, error, loading, setData } = usePolledData(fetchMyOrders, ORDER_POLL_INTERVAL_MS);
  // After a successful M-Pesa payment, reload right away instead of waiting for the next poll.
  const refreshOrders = useCallback(() => {
    fetchMyOrders().then(setData, () => undefined);
  }, [setData]);

  const order =
    orders?.find((candidate) => candidate.id === requestedId) ??
    orders?.find((candidate) => !["delivered", "cancelled"].includes(candidate.status)) ??
    orders?.[0];

  return (
    <AppShell active="orders" title="Track Order" backHref="/customer-dashboard" backLabel="Dashboard">
      {error && !orders ? <FormStatusMessage message={`Failed to load orders: ${error}`} /> : null}
      {loading ? <p className="text-sm text-slate-500">Loading your orders…</p> : null}

      {orders && !order ? (
        <SoftCard className="text-center">
          <p className="text-sm text-slate-600">You don&apos;t have any orders yet.</p>
          <Link href="/new-order" className={`${primaryButtonClass} mt-4`}>
            <PlusIcon className="h-4 w-4" />
            Request a pickup
          </Link>
        </SoftCard>
      ) : null}

      {order ? (
        <>
          <PageHeading title={`Order ${orderRef(order)}`} subtitle={`Placed ${formatDateTime(order.created_at)} · updates automatically`} />

          <div className="space-y-4 lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-6 lg:space-y-0">
            <div className="space-y-4">
              <CustomerTrackingCard key={`tracking-${order.id}`} orderId={order.id} />
              <ItemsCard order={order} />
              <PaymentCard key={order.id} order={order} onPaid={refreshOrders} />

              <SoftCard className="lg:p-5">
                <h2 className="text-base font-semibold">Pickup</h2>
                <dl className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-xs text-slate-500">Address</dt>
                    <dd className="font-medium">{order.pickup_address}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Scheduled for</dt>
                    <dd className="font-medium">{formatDateTime(order.pickup_time)}</dd>
                  </div>
                  {order.notes ? (
                    <div className="sm:col-span-2">
                      <dt className="text-xs text-slate-500">Notes</dt>
                      <dd className="whitespace-pre-line">{order.notes}</dd>
                    </div>
                  ) : null}
                </dl>
                <div className="mt-3">
                  <DeliveryInstructions order={order} />
                </div>
              </SoftCard>

              {(order.damages ?? []).length > 0 ? (
                <SoftCard className="lg:p-5">
                  <h2 className="text-base font-semibold">Condition at intake</h2>
                  <p className="mb-3 text-xs text-slate-500">
                    We found this before washing and photographed it where possible. Contact support if anything looks wrong.
                  </p>
                  <DamageList order={order} />
                </SoftCard>
              ) : null}

              <div className="grid grid-cols-2 gap-3">
                <Link href="/support" className={primaryButtonClass}>
                  Contact Support
                </Link>
                <Link href="/cancel-order" className={secondaryButtonClass}>
                  Cancel Order
                </Link>
              </div>
            </div>

            <div className="space-y-4 lg:self-start">
              <SoftCard className="lg:p-5">
                <h2 className="text-base font-semibold">Track progress</h2>
                {order.status === "cancelled" ? (
                  <p className="mt-3 text-sm text-slate-500">This order was cancelled.</p>
                ) : (
                  <Timeline order={order} />
                )}
              </SoftCard>
              <OrderSwitcher orders={orders ?? []} selectedId={order.id} />
            </div>
          </div>
        </>
      ) : null}
    </AppShell>
  );
}
