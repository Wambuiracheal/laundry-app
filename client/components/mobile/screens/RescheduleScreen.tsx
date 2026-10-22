"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PendingOrderState, usePendingOrder } from "@/components/mobile/PendingOrderPicker";
import { AppShell, PageHeading, SoftCard, primaryButtonClass } from "@/components/mobile/primitives";
import { FormField, FormStatusMessage, formControlClass, formSelectClass } from "@/components/shared/form/FormField";
import { PICKUP_WINDOWS, pickupDateTime, validatePickupSlot, type PickupSlot } from "@/utils/newOrderValidation";
import { canChangePickup, formatDateTime, orderRef, rescheduleOrder, serviceSummary, type ApiOrder } from "@/utils/ordersApi";

function localDateValue(date: Date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

/** The order's current slot, so the form starts from what's booked. */
function currentSlot(order: ApiOrder): PickupSlot {
  if (!order.pickup_time) return { pickupDate: "", timeWindow: "" };
  const date = new Date(order.pickup_time);
  const time = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  return { pickupDate: localDateValue(date), timeWindow: PICKUP_WINDOWS.some((window) => window.value === time) ? time : "" };
}

function RescheduleForm({ order }: { order: ApiOrder }) {
  const router = useRouter();
  const [values, setValues] = useState<PickupSlot>(() => currentSlot(order));
  const [errors, setErrors] = useState<Partial<Record<keyof PickupSlot, string>>>({});
  const [status, setStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const unchanged = order.pickup_time !== null && values.pickupDate && values.timeWindow && pickupDateTime(values).getTime() === new Date(order.pickup_time).getTime();

  function setField(field: keyof PickupSlot, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validatePickupSlot(values);
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    try {
      setIsSubmitting(true);
      setStatus(null);
      await rescheduleOrder(order.id, pickupDateTime(values).toISOString());
      router.push(`/order-tracking?id=${order.id}`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Couldn't reschedule. Please try again.");
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={submit} noValidate>
      <div className="rounded-xl bg-slate-50 px-3 py-2.5 text-sm">
        <p className="font-medium text-slate-800">
          {orderRef(order)} · {serviceSummary(order)}
        </p>
        <p className="text-xs text-slate-500">Currently {formatDateTime(order.pickup_time)} · {order.pickup_address}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField htmlFor="pickupDate" label="New pickup date" error={errors.pickupDate}>
          <input
            id="pickupDate"
            type="date"
            className={formControlClass}
            min={localDateValue(new Date())}
            value={values.pickupDate}
            onChange={(event) => setField("pickupDate", event.target.value)}
          />
        </FormField>
        <FormField htmlFor="timeWindow" label="Pickup window" error={errors.timeWindow}>
          <select id="timeWindow" className={formSelectClass} value={values.timeWindow} onChange={(event) => setField("timeWindow", event.target.value)}>
            <option value="">Select a window…</option>
            {PICKUP_WINDOWS.map((window) => (
              <option key={window.value} value={window.value}>
                {window.label}
              </option>
            ))}
          </select>
        </FormField>
      </div>

      <p className="text-xs text-slate-500">We&apos;ll text you to confirm the new time.</p>

      <button className={`${primaryButtonClass} w-full`} type="submit" disabled={isSubmitting || Boolean(unchanged)}>
        {isSubmitting ? "Saving…" : "Save new pickup time"}
      </button>
      {status ? <FormStatusMessage message={status} tone="error" /> : null}
    </form>
  );
}

export function RescheduleScreen() {
  const state = usePendingOrder();
  const { order } = state;

  return (
    <AppShell active="orders" title="Reschedule" backHref={order ? `/order-tracking?id=${order.id}` : "/order-tracking"} backLabel="Back to order">
      <PageHeading title="Reschedule pickup" subtitle="Pick a new day and window. You can change it until the rider collects your clothes." />
      <SoftCard padding="p-5" className="max-w-xl space-y-4">
        <PendingOrderState state={state} basePath="/reschedule" action="rescheduled" />
        {order && canChangePickup(order) ? <RescheduleForm key={order.id} order={order} /> : null}
      </SoftCard>
    </AppShell>
  );
}
