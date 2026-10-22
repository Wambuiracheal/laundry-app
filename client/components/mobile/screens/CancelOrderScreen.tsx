"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PendingOrderState, usePendingOrder } from "@/components/mobile/PendingOrderPicker";
import { AppShell, PageHeading, SoftCard } from "@/components/mobile/primitives";
import { FormField, FormStatusMessage, formSelectClass, formTextareaClass } from "@/components/shared/form/FormField";
import { hasErrors, validateCancellationForm, type CancellationValues, type FormErrors } from "@/utils/actionFormValidation";
import { canChangePickup, cancelOrder, formatDateTime, orderRef, serviceSummary, type ApiOrder } from "@/utils/ordersApi";

const reasons = ["Schedule conflict", "No longer needed", "Booked by mistake", "Pricing concern", "Other"];

const initialValues: CancellationValues = { reason: "", details: "", acknowledge: false };

function CancelForm({ order }: { order: ApiOrder }) {
  const router = useRouter();
  const [values, setValues] = useState<CancellationValues>(initialValues);
  const [errors, setErrors] = useState<FormErrors<CancellationValues>>({});
  const [status, setStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function setField<K extends keyof CancellationValues>(field: K, value: CancellationValues[K]) {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateCancellationForm(values);
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) return;

    try {
      setIsSubmitting(true);
      setStatus(null);
      await cancelOrder(order.id, { reason: values.reason, details: values.details.trim() });
      router.push(`/order-tracking?id=${order.id}`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Couldn't cancel. Please try again.");
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={submit} noValidate>
      <div className="rounded-xl bg-slate-50 px-3 py-2.5 text-sm">
        <p className="font-medium text-slate-800">
          {orderRef(order)} · {serviceSummary(order)}
        </p>
        <p className="text-xs text-slate-500">Pickup {formatDateTime(order.pickup_time)} · {order.pickup_address}</p>
      </div>

      <FormField htmlFor="reason" label="Reason" error={errors.reason}>
        <select id="reason" className={formSelectClass} value={values.reason} onChange={(event) => setField("reason", event.target.value)}>
          <option value="">Select a reason</option>
          {reasons.map((reason) => (
            <option key={reason} value={reason}>
              {reason}
            </option>
          ))}
        </select>
      </FormField>

      <FormField htmlFor="details" label="Anything else? (optional)" error={errors.details}>
        <textarea
          id="details"
          className={formTextareaClass}
          maxLength={1000}
          value={values.details}
          onChange={(event) => setField("details", event.target.value)}
        />
      </FormField>

      <label className="flex items-start gap-2 text-sm text-slate-600">
        <input
          type="checkbox"
          className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-rose-600"
          checked={values.acknowledge}
          onChange={(event) => setField("acknowledge", event.target.checked)}
        />
        I understand the pickup will be cancelled and can&apos;t be undone.
      </label>
      {errors.acknowledge ? <p className="text-xs text-rose-600">{errors.acknowledge}</p> : null}

      <div className="flex flex-col-reverse gap-2 sm:flex-row">
        <Link
          href={`/order-tracking?id=${order.id}`}
          className="inline-flex flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Keep my order
        </Link>
        <button
          className="inline-flex flex-1 items-center justify-center rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-60"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Cancelling…" : "Cancel order"}
        </button>
      </div>
      {status ? <FormStatusMessage message={status} tone="error" /> : null}
    </form>
  );
}

export function CancelOrderScreen() {
  const state = usePendingOrder();
  const { order } = state;

  return (
    <AppShell active="orders" title="Cancel order" backHref={order ? `/order-tracking?id=${order.id}` : "/order-tracking"} backLabel="Back to order">
      <PageHeading title="Cancel order" subtitle="You can cancel free of charge until the rider collects your clothes." />
      <SoftCard padding="p-5" className="max-w-xl space-y-4">
        <PendingOrderState state={state} basePath="/cancel-order" action="cancelled" />
        {order && canChangePickup(order) ? <CancelForm key={order.id} order={order} /> : null}
      </SoftCard>
    </AppShell>
  );
}
