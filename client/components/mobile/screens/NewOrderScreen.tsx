"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  BackIcon,
  BellIcon,
  MinusIcon,
  OrdersIcon,
  PlusIcon,
  ProfileIcon,
  ServiceIcon,
  HomeIcon,
} from "@/components/mobile/icons";
import { Badge, MobileBottomNav, MobileHeader, MobileLayout } from "@/components/mobile/primitives";
import { validateServiceSelection } from "@/utils/serviceSelectionValidation";
import { formatServicePrice, getServiceDisplay } from "@/utils/serviceDisplay";
import { listServices, type Service } from "@/utils/servicesApi";

type QtyMap = Record<string, number>;

const UNIT_LABEL: Record<string, string> = {
  per_kg: "Priced per kg",
  per_item: "Priced per item",
  per_pair: "Priced per pair",
};

export function NewOrderScreen() {
  const [services, setServices] = useState<Service[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [qty, setQty] = useState<QtyMap>({});
  const [error, setError] = useState<string | null>(null);

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
    setError(null);
  }

  function removeItem(serviceId: string) {
    setQty((prev) => ({ ...prev, [serviceId]: Math.max(0, (prev[serviceId] ?? 0) - 1) }));
    setError(null);
  }

  function handleContinue() {
    const result = validateServiceSelection(qty);
    if (!result.valid) {
      setError(result.error ?? "Please review your order.");
      return;
    }

    setError(`Looks good. ${result.totalItems} item(s) selected.`);
  }

  return (
    <MobileLayout>
      <MobileHeader
        left={
          <Link href="/customer-dashboard" aria-label="Back to dashboard">
            <BackIcon className="h-5 w-5 text-blue-700" />
          </Link>
        }
        title={<span className="text-blue-700">New Order</span>}
        right={
          <div className="flex items-center justify-end gap-2 text-slate-500">
            <BellIcon className="h-5 w-5" />
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">JD</span>
          </div>
        }
      />

      <section className="mb-5">
        <div className="mb-2 flex items-center justify-between text-sm text-slate-500">
          <span className="text-blue-700">1 Service</span>
          <span>2 Details</span>
          <span>3 Payment</span>
        </div>
        <div className="h-1.5 rounded-full bg-slate-200">
          <div className="h-full w-1/3 rounded-full bg-blue-700" />
        </div>
      </section>

      <h1 className="text-4xl font-semibold tracking-tight">Select Services</h1>
      <p className="mt-2 text-xl text-slate-600">Choose the items you need help with. We&apos;ll handle the rest with care.</p>

      {loadError ? (
        <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{loadError}</div>
      ) : null}

      <section className="mt-5 space-y-4">
        {services === null ? (
          <p className="py-6 text-center text-slate-500">Loading services…</p>
        ) : services.length === 0 ? (
          <p className="py-6 text-center text-slate-500">No services are available right now.</p>
        ) : (
          services.map((service, index) => {
            const count = qty[service.id] ?? 0;
            const display = getServiceDisplay(service.name, index);

            return (
              <article key={service.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_20px_rgba(15,23,42,0.06)]">
                <div className="relative h-40 w-full" style={{ background: display.accent }}>
                  {display.imageSrc ? (
                    <Image src={display.imageSrc} alt={service.name} fill className="object-cover" />
                  ) : null}
                  <span className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1 text-lg font-semibold text-blue-700 shadow-sm backdrop-blur">
                    {formatServicePrice(service)}
                  </span>
                </div>

                <div className="p-4">
                  <h2 className="text-2xl font-semibold leading-tight">{service.name}</h2>
                  {service.description ? (
                    <p className="mt-1 text-lg leading-6 text-slate-600">{service.description}</p>
                  ) : null}

                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 rounded-full bg-slate-50 px-2 py-1">
                      <button
                        className="rounded-full border border-slate-200 bg-white p-1 text-blue-700"
                        type="button"
                        onClick={() => removeItem(service.id)}
                        aria-label={`Reduce ${service.name}`}
                      >
                        <MinusIcon className="h-4 w-4" />
                      </button>
                      <span className="w-6 text-center text-xl">{count}</span>
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
                      <span className="text-sm font-medium text-slate-500">{UNIT_LABEL[service.price_type] ?? service.price_type}</span>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })
        )}
      </section>

      <div className="fixed bottom-[74px] left-1/2 z-10 w-full max-w-[390px] -translate-x-1/2 px-4">
        <button
          className="w-full rounded-xl bg-blue-700 px-4 py-3 text-base font-semibold text-white shadow-[0_10px_18px_rgba(29,78,216,0.35)]"
          type="button"
          onClick={handleContinue}
        >
          Continue
        </button>
        <div className="mt-2 flex items-center justify-between px-1 text-sm">
          <span className="text-slate-500">Total items: {totalItems}</span>
          {error ? <Badge text={error} tone={error.includes("Looks good") ? "green" : "gray"} /> : null}
        </div>
      </div>

      <MobileBottomNav
        items={[
          { label: "Home", icon: <HomeIcon className="h-5 w-5" />, href: "/customer-dashboard" },
          { label: "Services", icon: <ServiceIcon className="h-5 w-5" />, active: true, href: "/new-order" },
          { label: "Orders", icon: <OrdersIcon className="h-5 w-5" />, href: "/order-tracking" },
          { label: "Profile", icon: <ProfileIcon className="h-5 w-5" />, href: "/login" },
        ]}
      />
    </MobileLayout>
  );
}
