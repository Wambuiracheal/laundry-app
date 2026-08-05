"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { CheckIcon, HomeIcon, OrdersIcon, ProfileIcon, ServiceIcon } from "@/components/mobile/icons";
import { Sidebar, WebLayout } from "@/components/web/primitives";
import { useAuth } from "@/components/shared/auth/AuthProvider";
import { getOrder, listMyOrders, type Order } from "@/utils/ordersApi";

const LeafletMap = dynamic(() => import("@/components/web/LeafletMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-slate-100" />,
});

const STEPS = [
  { key: "placed", label: "Order Placed", description: "We've received your laundry request." },
  { key: "picked_up", label: "Picked Up", description: "Items safely collected from your doorstep." },
  { key: "processing", label: "Processing", description: "Deep cleaning in progress at our facility." },
  { key: "out_for_delivery", label: "Out for Delivery", description: "Ready for transit to your doorstep." },
  { key: "delivered", label: "Delivered", description: "Order safely returned to your home." },
];

function normalizeStatus(status: string): string {
  return status.trim().toLowerCase().replace(/\s+/g, "_");
}

function formatDateTime(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function money(value: string | null): string {
  return value ? `$${Number(value).toFixed(2)}` : "$0.00";
}

export function OrderTrackingScreen() {
  const { user, accessToken } = useAuth();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  const [order, setOrder] = useState<Order | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;

    async function load() {
      try {
        if (orderId) {
          const result = await getOrder(orderId);
          if (!cancelled) setOrder(result);
          return;
        }

        const orders = await listMyOrders(accessToken as string);
        if (cancelled) return;
        const active = orders.find((item) => normalizeStatus(item.status) !== "delivered" && normalizeStatus(item.status) !== "cancelled");
        setOrder(active ?? orders[0] ?? null);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load order.");
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [accessToken, orderId]);

  let content: ReactNode;
  if (order === undefined) {
    content = <p className="text-sm text-slate-500">Loading your order…</p>;
  } else if (order === null) {
    content = (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <p className="text-slate-600">You don&apos;t have any orders to track yet.</p>
        <Link href="/new-order" className="mt-3 inline-block font-semibold text-blue-700">
          Book your first pickup
        </Link>
      </div>
    );
  } else {
    content = <OrderTrackingContent order={order} />;
  }

  return (
    <WebLayout
      sidebar={
        <Sidebar
          userName={user ? `${user.first_name} ${user.last_name}` : "Guest"}
          userSubtitle="Premium Member"
          items={[
            { label: "Home", icon: <HomeIcon className="h-5 w-5" />, href: "/customer-dashboard" },
            { label: "Services", icon: <ServiceIcon className="h-5 w-5" />, href: "/new-order" },
            { label: "Orders", icon: <OrdersIcon className="h-5 w-5" />, href: "/order-tracking", active: true },
            { label: "Profile", icon: <ProfileIcon className="h-5 w-5" />, href: "/login" },
          ]}
        />
      }
    >
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Track Your Freshness</h1>
          {order?.delivery_time ? (
            <p className="mt-1 text-slate-500">Estimated arrival by {formatDateTime(order.delivery_time)}</p>
          ) : null}
        </div>
        <div className="flex items-center gap-3">
          <Link href="/cancel-order" className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">
            Cancel Order
          </Link>
          <Link href="/support" className="rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800">
            Contact Support
          </Link>
        </div>
      </header>

      {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div> : null}

      {content}
    </WebLayout>
  );
}

function OrderTrackingContent({ order }: Readonly<{ order: Order }>) {
  const currentStepIndex = STEPS.findIndex((step) => step.key === normalizeStatus(order.status));

  function stepTimestamp(stepKey: string): string | null {
    return order.statusHistory.find((entry) => normalizeStatus(entry.status) === stepKey)?.timestamp ?? null;
  }

  return (
    <div className="grid grid-cols-[1.6fr_1fr] gap-6">
      <div className="space-y-6">
        <div className="h-80 overflow-hidden rounded-2xl border border-slate-200">
          {order.pickup_lat && order.pickup_lng ? (
            <LeafletMap
              lat={order.pickup_lat}
              lng={order.pickup_lng}
              label={order.assignedRider ? `${order.assignedRider.first_name} ${order.assignedRider.last_name}` : "Your order"}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-slate-100 text-sm text-slate-500">
              No pickup location on file for this order.
            </div>
          )}
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="mb-3 text-lg font-semibold">Itemized List</h2>
          <ul className="divide-y divide-slate-100">
            {order.orderItems.length === 0 ? (
              <li className="py-3 text-sm text-slate-500">No items recorded for this order.</li>
            ) : (
              order.orderItems.map((item) => (
                <li key={item.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-slate-900">{item.service.name}</p>
                    <p className="text-sm text-slate-500">Qty {item.quantity}</p>
                  </div>
                  <p className="font-semibold text-slate-900">{money(item.price)}</p>
                </li>
              ))
            )}
          </ul>
        </section>

        <div className="grid grid-cols-2 gap-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="mb-2 text-lg font-semibold">Delivery Address</h2>
            <p className="text-sm text-slate-600">{order.pickup_address}</p>
          </section>

          <section className="rounded-2xl bg-blue-700 p-5 text-white">
            <p className="text-sm text-blue-100">Total Payment</p>
            <div className="mt-2 space-y-1 text-sm text-blue-100">
              <div className="flex justify-between"><span>Deposit paid</span><span>{money(order.deposit_amount)}</span></div>
              <div className="flex justify-between"><span>Remaining</span><span>{money(order.remaining_amount)}</span></div>
            </div>
            <div className="mt-3 flex items-baseline justify-between border-t border-white/20 pt-3">
              <span className="text-sm capitalize text-blue-100">{order.payment_status}</span>
              <span className="text-2xl font-semibold">{money(order.total_amount)}</span>
            </div>
          </section>
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="mb-4 text-lg font-semibold">Status Details</h2>
        <div className="space-y-5">
          {STEPS.map((step, index) => {
            const done = currentStepIndex >= 0 && index <= currentStepIndex;
            const active = index === currentStepIndex;
            const timestamp = stepTimestamp(step.key);

            let badgeTone = "border-slate-300 bg-slate-100 text-slate-400";
            if (done) {
              badgeTone = active ? "border-blue-600 bg-blue-100 text-blue-700" : "border-blue-600 bg-blue-600 text-white";
            }

            return (
              <div key={step.key} className="relative flex gap-3">
                {index < STEPS.length - 1 ? (
                  <div className={`absolute left-3.5 top-8 h-full w-0.5 ${done ? "bg-blue-600" : "bg-slate-200"}`} />
                ) : null}
                <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs ${badgeTone}`}>
                  {done && !active ? <CheckIcon className="h-3.5 w-3.5" /> : index + 1}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <p className={`font-semibold ${active ? "text-blue-700" : "text-slate-800"}`}>{step.label}</p>
                    {active ? <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">In Progress</span> : null}
                  </div>
                  <p className="text-sm text-slate-500">{step.description}</p>
                  {timestamp ? <p className="mt-0.5 text-xs text-slate-400">{formatDateTime(timestamp)}</p> : null}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
