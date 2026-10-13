"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { serviceItems } from "@/components/mobile/data";
import { CheckIcon } from "@/components/mobile/icons";
import { AppShell, PageHeading, SoftCard, primaryButtonClass } from "@/components/mobile/primitives";
import { AddressAutocomplete } from "@/components/shared/form/AddressAutocomplete";
import { FormField, FormStatusMessage, formControlClass, formSelectClass, formTextareaClass } from "@/components/shared/form/FormField";
import type { AddressSuggestion } from "@/utils/addressSearch";
import { fetchDeliveryQuote, fetchServices, rateLabel, requestOrder, type ApiService, type DeliveryQuote } from "@/utils/ordersApi";
import { formatKES } from "@/utils/currency";
import { PICKUP_WINDOWS, pickupDateTime, validateNewOrder, type NewOrderErrors, type NewOrderValues } from "@/utils/newOrderValidation";

const steps = ["Request pickup", "We weigh at the shop", "Pay final price"];

const initialValues: NewOrderValues = {
  serviceIds: [],
  pickupAddress: "",
  pickupDate: "",
  timeWindow: "",
  houseDetails: "",
  deliveryInstructions: "",
  notes: "",
};

function todayInputValue() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

/** Artwork and tag from the static catalogue, matched by service name. */
function serviceArt(service: ApiService) {
  return serviceItems.find((item) => item.name.toLowerCase() === service.name.toLowerCase());
}

export function NewOrderScreen() {
  const router = useRouter();
  const [services, setServices] = useState<ApiService[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [values, setValues] = useState<NewOrderValues>(initialValues);
  const [errors, setErrors] = useState<NewOrderErrors>({});
  const [status, setStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Coordinates of the picked suggestion; kept while the typed address still contains it
  // (so adding "Apt 4B" afterwards doesn't drop the pin).
  const [pickupLocation, setPickupLocation] = useState<AddressSuggestion | null>(null);
  // Delivery fee quote for the pinned address, tagged with the address it was quoted for so a
  // slow response for an earlier pick is never shown against a newer one.
  const [quote, setQuote] = useState<{ forId: string; value: DeliveryQuote | null; loading: boolean } | null>(null);

  useEffect(() => {
    fetchServices()
      .then(setServices)
      .catch((error: unknown) => setLoadError(error instanceof Error ? error.message : "Could not load services."));
  }, []);

  const selectedServices = useMemo(
    () => (services ?? []).filter((service) => values.serviceIds.includes(service.id)),
    [services, values.serviceIds],
  );

  function setField<K extends keyof NewOrderValues>(field: K, value: NewOrderValues[K]) {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }

  function changeAddress(address: string) {
    setField("pickupAddress", address);
    if (pickupLocation && !address.includes(pickupLocation.label)) {
      setPickupLocation(null);
    }
  }

  function selectAddress(suggestion: AddressSuggestion) {
    setField("pickupAddress", suggestion.label);
    setPickupLocation(suggestion);
    setQuote({ forId: suggestion.id, value: null, loading: true });
    fetchDeliveryQuote(suggestion.lat, suggestion.lng)
      .then((value) => setQuote((prev) => (prev?.forId === suggestion.id ? { forId: suggestion.id, value, loading: false } : prev)))
      .catch(() => setQuote((prev) => (prev?.forId === suggestion.id ? { forId: suggestion.id, value: null, loading: false } : prev)));
  }

  function toggleService(serviceId: string) {
    setField(
      "serviceIds",
      values.serviceIds.includes(serviceId) ? values.serviceIds.filter((id) => id !== serviceId) : [...values.serviceIds, serviceId],
    );
  }

  const currentQuote = quote && pickupLocation && quote.forId === pickupLocation.id ? quote : null;

  async function submit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateNewOrder(values);
    // The delivery fee is measured on the map, so the address must come from the suggestions.
    if (!nextErrors.pickupAddress && !pickupLocation) {
      nextErrors.pickupAddress = "Choose your address from the suggestions so we can find it on the map.";
    }
    setErrors(nextErrors);

    if (Object.values(nextErrors).some(Boolean)) {
      setStatus(null);
      return;
    }

    try {
      setIsSubmitting(true);
      setStatus(null);
      const order = await requestOrder({
        service_ids: values.serviceIds,
        pickup_address: values.pickupAddress.trim(),
        pickup_lat: pickupLocation?.lat ?? null,
        pickup_lng: pickupLocation?.lng ?? null,
        pickup_time: pickupDateTime(values).toISOString(),
        notes: values.notes.trim(),
        house_details: values.houseDetails.trim(),
        delivery_instructions: values.deliveryInstructions.trim(),
      });
      router.push(`/order-tracking?id=${order.id}`);
    } catch (error) {
      setStatus(`Order request failed: ${error instanceof Error ? error.message : "please try again."}`);
      setIsSubmitting(false);
    }
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

      <PageHeading
        title="Request a pickup"
        subtitle="Just tell us what you need and when. No need to count or weigh anything. We weigh your clothes at the shop and the price shows up on your order."
      />

      <form className="lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-8" onSubmit={submit} noValidate>
        <div className="space-y-6">
          <section>
            <h2 className="mb-1 text-sm font-semibold">1. Choose services</h2>
            <p className="mb-3 text-xs text-slate-500">Pick everything that applies. You can choose more than one.</p>

            {loadError ? <FormStatusMessage message={`Failed to load services: ${loadError}`} /> : null}
            {!services && !loadError ? <p className="text-sm text-slate-500">Loading services…</p> : null}

            <div className="grid gap-3 sm:grid-cols-2">
              {(services ?? []).map((service) => {
                const selected = values.serviceIds.includes(service.id);
                const art = serviceArt(service);

                return (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => toggleService(service.id)}
                    aria-pressed={selected}
                    className={`flex items-stretch overflow-hidden rounded-2xl border bg-white text-left shadow-sm shadow-slate-900/[0.03] transition ${
                      selected ? "border-blue-400 ring-2 ring-blue-100" : "border-slate-200/80 hover:border-slate-300"
                    }`}
                  >
                    {art ? (
                      <span className="relative w-20 shrink-0">
                        <Image src={art.image} alt="" fill sizes="80px" className="object-cover" />
                      </span>
                    ) : null}
                    <span className="flex flex-1 flex-col gap-0.5 p-3">
                      <span className="flex items-start justify-between gap-2">
                        <span className="text-sm font-semibold">{service.name}</span>
                        <span
                          className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                            selected ? "border-blue-700 bg-blue-700 text-white" : "border-slate-300"
                          }`}
                        >
                          {selected ? <CheckIcon className="h-3 w-3" /> : null}
                        </span>
                      </span>
                      <span className="text-xs font-semibold text-blue-700">{rateLabel(service)}</span>
                      {service.description ? <span className="text-xs leading-5 text-slate-500">{service.description}</span> : null}
                    </span>
                  </button>
                );
              })}
            </div>
            {errors.serviceIds ? <p className="mt-2 text-xs text-rose-600">{errors.serviceIds}</p> : null}
          </section>

          <section className="space-y-4">
            <h2 className="text-sm font-semibold">2. Pickup details</h2>
            <FormField
              htmlFor="pickupAddress"
              label="Pickup address"
              error={errors.pickupAddress}
              info={
                pickupLocation
                  ? "Location pinned. Add a house or apartment number if needed."
                  : "Start typing a building, street or estate and pick a suggestion. We use it to measure the delivery distance."
              }
            >
              <AddressAutocomplete
                id="pickupAddress"
                placeholder="e.g. Yaya Centre, Kilimani"
                value={values.pickupAddress}
                onChange={changeAddress}
                onSelect={selectAddress}
              />
            </FormField>

            <FormField
              htmlFor="houseDetails"
              label="House, apartment or gate (optional)"
              info="e.g. Apt 4B, Block C, Gate 2"
              error={errors.houseDetails}
            >
              <input
                id="houseDetails"
                className={formControlClass}
                maxLength={191}
                autoComplete="address-line2"
                value={values.houseDetails}
                onChange={(event) => setField("houseDetails", event.target.value)}
              />
            </FormField>

            <FormField
              htmlFor="deliveryInstructions"
              label="Directions for the rider (optional)"
              info="Landmarks, which gate to use, what to tell the guard or reception."
              error={errors.deliveryInstructions}
            >
              <textarea
                id="deliveryInstructions"
                className={formTextareaClass}
                maxLength={500}
                placeholder="e.g. Blue gate opposite the Shell petrol station. Tell the guard you're collecting for Apt 4B."
                value={values.deliveryInstructions}
                onChange={(event) => setField("deliveryInstructions", event.target.value)}
              />
            </FormField>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField htmlFor="pickupDate" label="Pickup date" error={errors.pickupDate}>
                <input
                  id="pickupDate"
                  type="date"
                  className={formControlClass}
                  min={todayInputValue()}
                  value={values.pickupDate}
                  onChange={(event) => setField("pickupDate", event.target.value)}
                />
              </FormField>
              <FormField htmlFor="timeWindow" label="Pickup window" error={errors.timeWindow}>
                <select
                  id="timeWindow"
                  className={formSelectClass}
                  value={values.timeWindow}
                  onChange={(event) => setField("timeWindow", event.target.value)}
                >
                  <option value="">Select a window…</option>
                  {PICKUP_WINDOWS.map((window) => (
                    <option key={window.value} value={window.value}>
                      {window.label}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>

            <FormField
              htmlFor="notes"
              label="Notes about your laundry (optional)"
              info="Number of bags, stains to look at, special care, and so on."
              error={errors.notes}
            >
              <textarea
                id="notes"
                className={formTextareaClass}
                value={values.notes}
                onChange={(event) => setField("notes", event.target.value)}
              />
            </FormField>
          </section>
        </div>

        <aside className="mt-6 lg:sticky lg:top-24 lg:mt-0">
          <SoftCard padding="p-5">
            <h2 className="text-base font-semibold">Summary</h2>
            {selectedServices.length === 0 ? (
              <p className="mt-3 rounded-xl border border-dashed border-slate-200 px-4 py-5 text-center text-xs text-slate-500">
                No services selected yet.
              </p>
            ) : (
              <ul className="mt-3 divide-y divide-slate-100">
                {selectedServices.map((service) => (
                  <li key={service.id} className="flex items-center justify-between py-2.5 text-sm">
                    <span className="font-medium text-slate-800">{service.name}</span>
                    <span className="text-xs text-slate-500">{rateLabel(service)}</span>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-4 flex items-start justify-between gap-3 border-t border-slate-100 pt-4 text-sm">
              <div>
                <p className="font-medium text-slate-800">Pickup & delivery</p>
                <p className="text-xs text-slate-500">
                  {currentQuote?.loading
                    ? "Working out the distance…"
                    : currentQuote?.value
                      ? `${currentQuote.value.delivery_distance_km} km each way · ${formatKES(currentQuote.value.delivery_rate_per_km)}/km`
                      : "Choose your address from the suggestions to see the fee."}
                </p>
              </div>
              <span className="shrink-0 font-semibold tabular-nums">{currentQuote?.value ? formatKES(currentQuote.value.delivery_fee) : "—"}</span>
            </div>

            <div className="mt-4 rounded-xl bg-blue-50 px-3 py-2.5 text-xs leading-5 text-blue-900">
              <p className="font-semibold">How pricing works</p>
              <p>
                When your clothes reach the shop we weigh them (or count items like suits and shoes). Your total is the
                laundry plus pickup & delivery, and updates on the order page as soon as that&apos;s done. You pay before
                your clean clothes leave the shop.
              </p>
            </div>

            <button className={`${primaryButtonClass} mt-4 w-full`} type="submit" disabled={isSubmitting || !services}>
              {isSubmitting ? "Requesting pickup…" : "Request pickup"}
            </button>
            {status ? (
              <div className="mt-3">
                <FormStatusMessage message={status} />
              </div>
            ) : null}
          </SoftCard>
        </aside>
      </form>
    </AppShell>
  );
}
