"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { HomeIcon, MinusIcon, OrdersIcon, PlusIcon, ProfileIcon, ServiceIcon } from "@/components/mobile/icons";
import { Sidebar, WebLayout } from "@/components/web/primitives";
import { useAuth } from "@/components/shared/auth/AuthProvider";
import { formatServicePrice, getServiceDisplay } from "@/utils/serviceDisplay";
import { listServices, type Service } from "@/utils/servicesApi";

type QtyMap = Record<string, number>;

const UNIT_LABEL: Record<string, string> = {
  per_kg: "Priced per kg",
  per_item: "Priced per item",
  per_pair: "Priced per pair",
};

export function ServicesScreen() {
  const { user } = useAuth();
  const [services, setServices] = useState<Service[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [qty, setQty] = useState<QtyMap>({});
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    listServices()
      .then((result) => {
        if (!cancelled) setServices(result);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : "Failed to load services.");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const totalItems = useMemo(() => Object.values(qty).reduce((sum, value) => sum + value, 0), [qty]);

  function addItem(serviceId: string) {
    setQty((prev) => ({ ...prev, [serviceId]: (prev[serviceId] ?? 0) + 1 }));
    setMessage(null);
  }

  function removeItem(serviceId: string) {
    setQty((prev) => ({ ...prev, [serviceId]: Math.max(0, (prev[serviceId] ?? 0) - 1) }));
    setMessage(null);
  }

  function handleContinue() {
    if (totalItems === 0) {
      setMessage("Add at least one service item to continue.");
      return;
    }
    if (totalItems > 50) {
      setMessage("Maximum of 50 items allowed per order.");
      return;
    }
    setMessage(`Looks good. ${totalItems} item(s) selected.`);
  }

  return (
    <WebLayout
      sidebar={
        <Sidebar
          userName={user ? `${user.first_name} ${user.last_name}` : "Guest"}
          userSubtitle={user ? "Premium Member" : "Browsing"}
          items={[
            { label: "Home", icon: <HomeIcon className="h-5 w-5" />, href: "/customer-dashboard" },
            { label: "Services", icon: <ServiceIcon className="h-5 w-5" />, href: "/new-order", active: true },
            { label: "Orders", icon: <OrdersIcon className="h-5 w-5" />, href: "/order-tracking" },
            { label: "Profile", icon: <ProfileIcon className="h-5 w-5" />, href: "/login" },
          ]}
        />
      }
    >
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Select Services</h1>
          <p className="mt-1 text-slate-500">Choose the items you need help with. We&apos;ll handle the rest with care.</p>
        </div>
        <div className="text-right">
          <button
            className="rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
            type="button"
            onClick={handleContinue}
          >
            Continue
          </button>
          <p className="mt-1 text-xs text-slate-500">Total items: {totalItems}</p>
        </div>
      </header>

      {loadError ? (
        <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{loadError}</div>
      ) : null}
      {message ? (
        <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{message}</div>
      ) : null}

      {services === null ? (
        <p className="py-10 text-center text-sm text-slate-500">Loading services…</p>
      ) : services.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-500">No services are available right now.</p>
      ) : (
        <div className="grid grid-cols-3 gap-6">
          {services.map((service, index) => {
            const count = qty[service.id] ?? 0;
            const display = getServiceDisplay(service.name, index);

            return (
              <article key={service.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_20px_rgba(15,23,42,0.06)]">
                <div className="relative h-48 w-full" style={{ background: display.accent }}>
                  {display.imageSrc ? (
                    <Image src={display.imageSrc} alt={service.name} fill className="object-cover" />
                  ) : null}
                  <span className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1 text-base font-semibold text-blue-700 shadow-sm backdrop-blur">
                    {formatServicePrice(service)}
                  </span>
                </div>

                <div className="p-5">
                  <h2 className="text-xl font-semibold leading-tight">{service.name}</h2>
                  {service.description ? <p className="mt-1 text-sm leading-6 text-slate-600">{service.description}</p> : null}

                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 rounded-full bg-slate-50 px-2 py-1">
                      <button
                        className="rounded-full border border-slate-200 bg-white p-1 text-blue-700"
                        type="button"
                        onClick={() => removeItem(service.id)}
                        aria-label={`Reduce ${service.name}`}
                      >
                        <MinusIcon className="h-4 w-4" />
                      </button>
                      <span className="w-6 text-center text-lg">{count}</span>
                      <button
                        className="rounded-full bg-blue-700 p-1 text-white"
                        type="button"
                        onClick={() => addItem(service.id)}
                        aria-label={`Increase ${service.name}`}
                      >
                        <PlusIcon className="h-4 w-4" />
                      </button>
                    </div>
                    {service.price_type ? (
                      <span className="text-xs font-medium text-slate-500">{UNIT_LABEL[service.price_type] ?? service.price_type}</span>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </WebLayout>
  );
}
