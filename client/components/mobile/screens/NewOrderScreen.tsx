"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { serviceItems } from "@/components/mobile/data";
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
import { Badge, MobileBottomNav, MobileHeader, MobileLayout, SoftCard } from "@/components/mobile/primitives";
import { validateServiceSelection } from "@/utils/serviceSelectionValidation";

type QtyMap = Record<string, number>;

const toneStyles = {
  blue: {
    icon: "bg-blue-100 text-blue-700",
    action: "bg-blue-700 text-white",
  },
  green: {
    icon: "bg-emerald-100 text-emerald-700",
    action: "bg-emerald-700 text-white",
  },
  amber: {
    icon: "bg-amber-100 text-amber-700",
    action: "bg-amber-700 text-white",
  },
} as const;

export function NewOrderScreen() {
  const [qty, setQty] = useState<QtyMap>({});
  const [error, setError] = useState<string | null>(null);

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

      <section className="mt-5 space-y-3.5">
        {serviceItems.map((item) => {
          const count = qty[item.id] ?? 0;
          const style = toneStyles[item.tone];

          return (
            <SoftCard key={item.id}>
              <div className="flex items-start gap-3">
                <div className={`rounded-xl p-3 ${style.icon}`}>
                  <ServiceIcon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h2 className="text-[34px] font-semibold leading-tight">{item.name}</h2>
                  <p className="mt-1 text-xl leading-7 text-slate-600">{item.description}</p>
                  <p className="mt-1 text-[32px] font-semibold text-blue-700">{item.priceLabel}</p>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-2 rounded-full bg-slate-50 px-2 py-1">
                  <button
                    className="rounded-full border border-slate-200 bg-white p-1 text-blue-700"
                    type="button"
                    onClick={() => removeItem(item.id)}
                    aria-label={`Reduce ${item.name}`}
                  >
                    <MinusIcon className="h-4 w-4" />
                  </button>
                  <span className="w-6 text-center text-xl">{count}</span>
                  <button
                    className={`rounded-full p-1 ${style.action}`}
                    type="button"
                    onClick={() => addItem(item.id)}
                    aria-label={`Increase ${item.name}`}
                  >
                    <PlusIcon className="h-4 w-4" />
                  </button>
                </div>
                <span className="text-xl text-slate-500">{item.tag}</span>
              </div>
            </SoftCard>
          );
        })}
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
