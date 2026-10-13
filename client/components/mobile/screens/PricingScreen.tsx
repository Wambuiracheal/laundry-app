"use client";

import { useEffect, useState } from "react";
import { AppShell, PageHeading, SoftCard, primaryButtonClass } from "@/components/mobile/primitives";
import { FormStatusMessage, formControlClass, formSelectClass } from "@/components/shared/form/FormField";
import { formatKES } from "@/utils/currency";
import { fetchServices, rateLabel, updateService, type ApiService } from "@/utils/ordersApi";

type PriceType = NonNullable<ApiService["price_type"]>;

const PRICE_TYPE_LABELS: Record<PriceType, string> = {
  per_kg: "Per kg",
  per_item: "Per item",
  fixed: "Flat rate",
};

type Draft = { base_price: string; price_type: PriceType; description: string };

function toDraft(service: ApiService): Draft {
  return {
    base_price: String(Number(service.base_price ?? 0)),
    price_type: service.price_type ?? "per_item",
    description: service.description ?? "",
  };
}

function ServiceRow({ service, onSaved }: { service: ApiService; onSaved: (service: ApiService) => void }) {
  const [draft, setDraft] = useState<Draft>(() => toDraft(service));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const saved = toDraft(service);
  const dirty =
    Number(draft.base_price) !== Number(saved.base_price) || draft.price_type !== saved.price_type || draft.description.trim() !== saved.description;
  const price = Number(draft.base_price);
  const invalidPrice = draft.base_price.trim() === "" || !Number.isFinite(price) || price < 0;

  async function save() {
    try {
      setBusy(true);
      setMessage(null);
      const updated = await updateService(service.id, {
        base_price: String(price),
        price_type: draft.price_type,
        description: draft.description,
      });
      onSaved(updated);
      setDraft(toDraft(updated));
      setMessage(`Saved. ${service.name} is now ${rateLabel(updated)}.`);
    } catch (error) {
      setMessage(`Save failed: ${error instanceof Error ? error.message : "please try again."}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <SoftCard className="lg:p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-base font-semibold">{service.name}</h2>
        <span className="text-sm text-slate-500">Current: {rateLabel(service)}</span>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_160px]">
        <label className="text-xs font-medium text-slate-600">
          Rate (KES)
          <input
            type="number"
            inputMode="decimal"
            min={0}
            step={10}
            className={`${formControlClass} mt-1`}
            value={draft.base_price}
            onChange={(event) => setDraft((prev) => ({ ...prev, base_price: event.target.value }))}
          />
        </label>
        <label className="text-xs font-medium text-slate-600">
          Charged
          <select
            className={`${formSelectClass} mt-1`}
            value={draft.price_type}
            onChange={(event) => setDraft((prev) => ({ ...prev, price_type: event.target.value as PriceType }))}
          >
            {(Object.keys(PRICE_TYPE_LABELS) as PriceType[]).map((type) => (
              <option key={type} value={type}>
                {PRICE_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-medium text-slate-600 sm:col-span-2">
          Description shown to customers
          <input
            className={`${formControlClass} mt-1`}
            maxLength={191}
            value={draft.description}
            onChange={(event) => setDraft((prev) => ({ ...prev, description: event.target.value }))}
          />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button className={primaryButtonClass} type="button" onClick={save} disabled={busy || !dirty || invalidPrice}>
          {busy ? "Saving…" : "Save"}
        </button>
        {dirty && !invalidPrice ? (
          <span className="text-xs text-slate-500">
            New rate: {formatKES(price)}
            {draft.price_type === "per_kg" ? " / kg" : draft.price_type === "per_item" ? " / item" : ""}
          </span>
        ) : null}
        {invalidPrice ? <span className="text-xs text-rose-600">Enter a price of 0 or more.</span> : null}
      </div>
      {message ? (
        <div className="mt-3">
          <FormStatusMessage message={message} />
        </div>
      ) : null}
    </SoftCard>
  );
}

export function PricingScreen() {
  const [services, setServices] = useState<ApiService[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchServices()
      .then(setServices)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Could not load services."));
  }, []);

  const replaceService = (updated: ApiService) =>
    setServices((prev) => (prev ?? []).map((service) => (service.id === updated.id ? updated : service)));

  return (
    <AppShell active="pricing" nav="admin" homeHref="/shop" title="Pricing" backHref="/shop" backLabel="Shop">
      <PageHeading
        title="Service pricing"
        subtitle="Changes show up for customers straight away. Items already weighed keep the price they were charged; new rates apply to anything weighed from now on."
      />

      {error ? <FormStatusMessage message={`Failed to load services: ${error}`} /> : null}
      {!services && !error ? <p className="text-sm text-slate-500">Loading services…</p> : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {(services ?? []).map((service) => (
          <ServiceRow key={service.id} service={service} onSaved={replaceService} />
        ))}
      </div>
    </AppShell>
  );
}
