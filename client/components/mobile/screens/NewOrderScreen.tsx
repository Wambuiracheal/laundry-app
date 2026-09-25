"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { serviceItems } from "@/components/mobile/data";
import { MinusIcon, PlusIcon } from "@/components/mobile/icons";
import { AppShell, PageHeading, SoftCard, primaryButtonClass } from "@/components/mobile/primitives";
import { validateServiceSelection } from "@/utils/serviceSelectionValidation";

type QtyMap = Record<string, number>;

const toneStyles = {
  blue: {
    action: "bg-blue-700 text-white hover:bg-blue-800",
  },
  green: {
    action: "bg-emerald-600 text-white hover:bg-emerald-700",
  },
  amber: {
    action: "bg-amber-600 text-white hover:bg-amber-700",
  },
} as const;

const steps = ["Service", "Details", "Payment"];

function formatPrice(value: number) {
  return `$${value.toFixed(2)}`;
}

function StatusMessage({ message }: { message: string }) {
  const ok = message.startsWith("Looks good");
  return (
    <p className={`rounded-lg px-3 py-2 text-xs font-medium ${ok ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}>
      {message}
    </p>
  );
}

export function NewOrderScreen() {
  const [qty, setQty] = useState<QtyMap>({});
  const [error, setError] = useState<string | null>(null);

  const totalItems = useMemo(() => Object.values(qty).reduce((sum, value) => sum + value, 0), [qty]);

  const selectedItems = useMemo(
    () => serviceItems.filter((item) => (qty[item.id] ?? 0) > 0).map((item) => ({ ...item, count: qty[item.id] })),
    [qty],
  );

  const subtotal = useMemo(() => selectedItems.reduce((sum, item) => sum + item.price * item.count, 0), [selectedItems]);

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
    <AppShell active="services" title="New Order" backHref="/customer-dashboard" backLabel="Dashboard">
      <ol className="mb-6 flex items-center gap-2">
        {steps.map((step, index) => (
          <li key={step} className="flex flex-1 items-center gap-2 last:flex-none">
            <span
              className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
                index === 0 ? "bg-blue-700 text-white" : "bg-slate-200 text-slate-500"
              }`}
            >
              {index + 1}
            </span>
            <span className={`text-xs font-medium ${index === 0 ? "text-slate-900" : "text-slate-500"}`}>{step}</span>
            {index < steps.length - 1 ? <span className="h-px flex-1 bg-slate-200" /> : null}
          </li>
        ))}
      </ol>

      <PageHeading title="Select services" subtitle="Choose the items you need help with. We'll handle the rest with care." />

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-8">
        <section className="grid gap-3 sm:grid-cols-2 lg:gap-4">
          {serviceItems.map((item) => {
            const count = qty[item.id] ?? 0;
            const style = toneStyles[item.tone];

            return (
              <SoftCard
                key={item.id}
                padding="p-0"
                className={`flex flex-col overflow-hidden transition ${count > 0 ? "border-blue-300 ring-2 ring-blue-100" : ""}`}
              >
                <div className="relative h-28 w-full sm:h-32">
                  <Image src={item.image} alt="" fill sizes="(min-width: 640px) 360px, 100vw" className="object-cover" />
                  <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-slate-700 shadow-sm backdrop-blur">
                    {item.tag}
                  </span>
                  {count > 0 ? (
                    <span className="absolute right-3 top-3 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-blue-700 px-1.5 text-[11px] font-semibold text-white">
                      {count}
                    </span>
                  ) : null}
                </div>
                <div className="flex flex-1 flex-col p-4 pb-0">
                  <h2 className="text-sm font-semibold">{item.name}</h2>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{item.description}</p>
                </div>

                <div className="flex items-center justify-between p-4">
                  <p className="text-sm font-semibold text-blue-700">{item.priceLabel}</p>
                  <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 p-0.5">
                    <button
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full text-slate-600 transition hover:bg-white disabled:opacity-40"
                      type="button"
                      onClick={() => removeItem(item.id)}
                      disabled={count === 0}
                      aria-label={`Reduce ${item.name}`}
                    >
                      <MinusIcon className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-6 text-center text-sm font-semibold tabular-nums">{count}</span>
                    <button
                      className={`inline-flex h-7 w-7 items-center justify-center rounded-full transition ${style.action}`}
                      type="button"
                      onClick={() => addItem(item.id)}
                      aria-label={`Increase ${item.name}`}
                    >
                      <PlusIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </SoftCard>
            );
          })}
        </section>

        {/* Desktop order summary */}
        <aside className="sticky top-24 hidden lg:block">
          <SoftCard padding="p-5">
            <h2 className="text-base font-semibold">Order summary</h2>
            {selectedItems.length === 0 ? (
              <p className="mt-4 rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-xs text-slate-500">
                No services selected yet. Use the + buttons to add items.
              </p>
            ) : (
              <ul className="mt-3 divide-y divide-slate-100">
                {selectedItems.map((item) => (
                  <li key={item.id} className="flex items-center justify-between py-2.5 text-sm">
                    <div>
                      <p className="font-medium text-slate-800">{item.name}</p>
                      <p className="text-xs text-slate-500">
                        {item.count} × {item.priceLabel}
                      </p>
                    </div>
                    <span className="font-semibold tabular-nums">{formatPrice(item.price * item.count)}</span>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-4 space-y-1.5 border-t border-slate-100 pt-4 text-sm">
              <div className="flex justify-between text-slate-500">
                <span>Total items</span>
                <span className="tabular-nums">{totalItems}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Estimated subtotal</span>
                <span className="tabular-nums text-blue-700">{formatPrice(subtotal)}</span>
              </div>
              <p className="pt-1 text-[11px] text-slate-400">Final price for per-kg services is confirmed after weighing.</p>
            </div>

            <button className={`${primaryButtonClass} mt-4 w-full`} type="button" onClick={handleContinue}>
              Continue
            </button>
            {error ? (
              <div className="mt-3">
                <StatusMessage message={error} />
              </div>
            ) : null}
          </SoftCard>
        </aside>
      </div>

      {/* Mobile checkout bar, sits above the bottom tab bar */}
      <div className="h-20 lg:hidden" />
      <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-10 border-t border-slate-200 bg-white/95 backdrop-blur lg:hidden">
        <div className="mx-auto max-w-xl px-4 py-3 md:max-w-3xl md:px-6">
          {error ? (
            <div className="mb-2">
              <StatusMessage message={error} />
            </div>
          ) : null}
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-slate-500">
                {totalItems} item{totalItems === 1 ? "" : "s"}
              </p>
              <p className="text-base font-semibold tabular-nums">{formatPrice(subtotal)}</p>
            </div>
            <button className={`${primaryButtonClass} px-6`} type="button" onClick={handleContinue}>
              Continue
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
