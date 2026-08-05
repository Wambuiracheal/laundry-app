"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BellIcon, HomeIcon, OrdersIcon, ProfileIcon, ServiceIcon } from "@/components/mobile/icons";
import { ServiceCard } from "@/components/landing/ui";
import { Sidebar, StatCard, StatusBadge, WebLayout } from "@/components/web/primitives";
import { useAuth } from "@/components/shared/auth/AuthProvider";
import { listMyOrders, type Order } from "@/utils/ordersApi";
import { listServices, type Service } from "@/utils/servicesApi";
import { formatServicePrice, getServiceDisplay } from "@/utils/serviceDisplay";

function isActiveStatus(status: string): boolean {
  const normalized = status.toLowerCase();
  return normalized !== "delivered" && normalized !== "cancelled";
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function primaryServiceLabel(order: Order): string {
  if (order.orderItems.length === 0) return "Order";
  if (order.orderItems.length === 1) return order.orderItems[0].service.name;
  return `${order.orderItems[0].service.name} +${order.orderItems.length - 1} more`;
}

export function DashboardScreen() {
  const { user, accessToken } = useAuth();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [services, setServices] = useState<Service[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;

    let cancelled = false;

    Promise.all([listMyOrders(accessToken), listServices()])
      .then(([ordersResult, servicesResult]) => {
        if (cancelled) return;
        setOrders(ordersResult);
        setServices(servicesResult);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load your dashboard.");
      });

    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  const activeOrders = useMemo(() => (orders ?? []).filter((order) => isActiveStatus(order.status)), [orders]);

  const nextPickup = useMemo(() => {
    const upcoming = activeOrders
      .filter((order) => order.pickup_time)
      .sort((a, b) => new Date(a.pickup_time as string).getTime() - new Date(b.pickup_time as string).getTime());
    return upcoming[0] ?? null;
  }, [activeOrders]);

  const recentOrders = (orders ?? []).slice(0, 5);

  const displayName = user?.first_name ?? "there";

  return (
    <WebLayout
      sidebar={
        <Sidebar
          userName={user ? `${user.first_name} ${user.last_name}` : "Guest"}
          userSubtitle="Premium Member"
          items={[
            { label: "Home", icon: <HomeIcon className="h-5 w-5" />, href: "/customer-dashboard", active: true },
            { label: "Services", icon: <ServiceIcon className="h-5 w-5" />, href: "/new-order" },
            { label: "Orders", icon: <OrdersIcon className="h-5 w-5" />, href: "/order-tracking" },
            { label: "Profile", icon: <ProfileIcon className="h-5 w-5" />, href: "/login" },
          ]}
        />
      }
    >
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Hello, {displayName}!</h1>
          <p className="mt-1 text-slate-500">Your laundry is our priority today.</p>
        </div>
        <div className="flex items-center gap-4">
          <BellIcon className="h-6 w-6 text-slate-400" />
          <Link href="/new-order" className="rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800">
            + New Order
          </Link>
        </div>
      </header>

      {error ? (
        <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>
      ) : null}

      <section className="grid grid-cols-3 gap-4">
        <StatCard>
          <p className="text-sm text-slate-500">Active Orders</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">
            {orders === null ? "—" : String(activeOrders.length).padStart(2, "0")}
          </p>
          {activeOrders[0] ? <div className="mt-3"><StatusBadge status={activeOrders[0].status} /></div> : null}
        </StatCard>

        <StatCard>
          <p className="text-sm text-slate-500">Next Pickup</p>
          <p className="mt-2 text-xl font-semibold text-slate-900">
            {orders === null ? "—" : nextPickup ? formatDate(nextPickup.pickup_time) : "No upcoming pickups"}
          </p>
          {nextPickup ? <p className="mt-1 truncate text-sm text-slate-500">{nextPickup.pickup_address}</p> : null}
        </StatCard>

        <StatCard dark>
          <p className="text-sm text-blue-100">Panda Points</p>
          <p className="mt-2 text-3xl font-semibold">1,240</p>
          <div className="mt-3 h-1.5 rounded-full bg-white/20">
            <div className="h-full w-2/3 rounded-full bg-emerald-400" />
          </div>
          <p className="mt-2 text-xs text-blue-100">280 points until next free wash</p>
        </StatCard>
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_6px_16px_rgba(15,23,42,0.05)]">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent Orders</h2>
          <Link href="/order-tracking" className="text-sm font-semibold text-blue-700 hover:text-blue-800">
            View All
          </Link>
        </div>

        {orders === null ? (
          <p className="py-6 text-center text-sm text-slate-500">Loading your orders…</p>
        ) : recentOrders.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">
            No orders yet.{" "}
            <Link href="/new-order" className="font-semibold text-blue-700">
              Book your first pickup
            </Link>
            .
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-400">
              <tr>
                <th className="pb-2 font-medium">Order ID</th>
                <th className="pb-2 font-medium">Date</th>
                <th className="pb-2 font-medium">Service</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id} className="border-t border-slate-100">
                  <td className="py-3 font-medium text-slate-900">#{order.id.slice(0, 8)}</td>
                  <td className="py-3 text-slate-600">{formatDate(order.created_at)}</td>
                  <td className="py-3 text-slate-600">{primaryServiceLabel(order)}</td>
                  <td className="py-3">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="py-3 text-right">
                    <Link href={`/order-tracking?orderId=${order.id}`} className="text-slate-400 hover:text-blue-700">
                      &gt;
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="mt-6">
        <h2 className="mb-3 text-lg font-semibold">Popular Services</h2>
        <div className="grid grid-cols-4 gap-4">
          {services === null ? (
            <p className="col-span-4 text-sm text-slate-500">Loading services…</p>
          ) : services.length === 0 ? (
            <p className="col-span-4 text-sm text-slate-500">No services available right now.</p>
          ) : (
            services.slice(0, 4).map((service, index) => {
              const display = getServiceDisplay(service.name, index);
              return (
                <ServiceCard
                  key={service.id}
                  title={service.name}
                  price={formatServicePrice(service)}
                  imageSrc={display.imageSrc}
                  accent={display.accent}
                />
              );
            })
          )}
        </div>
      </section>
    </WebLayout>
  );
}
