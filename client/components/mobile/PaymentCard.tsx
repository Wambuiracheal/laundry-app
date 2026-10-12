"use client";

import { useEffect, useState } from "react";
import { SoftCard, primaryButtonClass } from "@/components/mobile/primitives";
import { FormStatusMessage, formControlClass } from "@/components/shared/form/FormField";
import { formatKES } from "@/utils/currency";
import { isOrderPriced, type ApiOrder } from "@/utils/ordersApi";
import {
  PAYMENT_POLL_INTERVAL_MS,
  PAYMENT_POLL_TIMEOUT_MS,
  fetchPayment,
  paymentFailureMessage,
  startMpesaPayment,
  type MpesaPayment,
} from "@/utils/paymentsApi";

// Per-device convenience: prefill the number used last time.
const PHONE_STORAGE_KEY = "pl_mpesa_phone";

function readSavedPhone() {
  try {
    return localStorage.getItem(PHONE_STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

function savePhone(phone: string) {
  try {
    localStorage.setItem(PHONE_STORAGE_KEY, phone);
  } catch {
    // Storage can be unavailable (private mode); prefilling is optional.
  }
}

/** Outstanding balance for an order, falling back to the total before any payment exists. */
export function amountDue(order: ApiOrder) {
  return Number(order.remaining_amount ?? order.total_amount ?? 0);
}

/** Lets the customer pay the weighed total with an M-Pesa STK push, then waits for the result. */
export function PaymentCard({ order, onPaid }: { order: ApiOrder; onPaid: () => void }) {
  const [phone, setPhone] = useState(readSavedPhone);
  const [payment, setPayment] = useState<MpesaPayment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // While a prompt is open, check on it every few seconds until M-Pesa reports an outcome.
  const paymentId = payment?.status === "pending" ? payment.id : null;
  useEffect(() => {
    if (!paymentId) return;
    const startedAt = Date.now();
    let timer: number | undefined;
    let cancelled = false;

    const check = async () => {
      try {
        const latest = await fetchPayment(paymentId);
        if (cancelled) return;
        if (latest.status !== "pending") {
          setPayment(latest);
          if (latest.status === "success") onPaid();
          return;
        }
      } catch {
        // Network hiccup: keep trying until the timeout.
      }
      if (cancelled) return;
      if (Date.now() - startedAt > PAYMENT_POLL_TIMEOUT_MS) {
        setError("We couldn't confirm the payment yet. If you entered your PIN, it will show here shortly.");
        return;
      }
      timer = window.setTimeout(check, PAYMENT_POLL_INTERVAL_MS);
    };

    timer = window.setTimeout(check, PAYMENT_POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [paymentId, onPaid]);

  if (order.status === "cancelled" || !isOrderPriced(order)) return null;

  const due = amountDue(order);
  if (order.payment_status === "paid" || due <= 0) {
    return (
      <SoftCard className="border-emerald-200 bg-emerald-50 lg:p-5">
        <h2 className="text-base font-semibold text-emerald-900">Paid</h2>
        <p className="text-sm text-emerald-800">Thank you. We&apos;ve received your M-Pesa payment for this order.</p>
        {payment?.mpesa_receipt ? <p className="mt-1 text-xs text-emerald-700">M-Pesa code: {payment.mpesa_receipt}</p> : null}
      </SoftCard>
    );
  }

  async function pay(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      const started = await startMpesaPayment(order.id, phone);
      savePhone(phone);
      setPayment(started);
    } catch (err) {
      setError(`Payment failed: ${err instanceof Error ? err.message : "please try again."}`);
    } finally {
      setSubmitting(false);
    }
  }

  const waiting = payment?.status === "pending";

  return (
    <SoftCard className="lg:p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-base font-semibold">Pay with M-Pesa</h2>
        <span className="text-lg font-semibold tabular-nums text-blue-700">{formatKES(Math.ceil(due))}</span>
      </div>
      {order.payment_status === "partial" ? <p className="text-xs text-slate-500">Balance remaining after your earlier payment.</p> : null}
      <p className="mt-1 text-xs text-slate-500">
        {order.status === "ready"
          ? "Your clothes are clean and packed. Pay now and we'll send a rider with them."
          : "Your clothes have been weighed. Pay any time before they're ready, so delivery isn't held up."}
      </p>

      {waiting ? (
        <div className="mt-3 flex items-center gap-3 rounded-xl bg-blue-50 px-3 py-3 text-sm text-blue-900">
          <span aria-hidden className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-blue-200 border-t-blue-700" />
          <p>
            Check your phone and enter your M-Pesa PIN to pay <strong>{formatKES(Number(payment.amount))}</strong>. This page updates
            once it&apos;s done.
          </p>
        </div>
      ) : (
        <form className="mt-3 space-y-3" onSubmit={pay} noValidate>
          {payment?.status === "failed" ? <FormStatusMessage message={`Payment failed: ${paymentFailureMessage(payment)}`} /> : null}
          <label className="block text-sm font-medium text-slate-700" htmlFor="mpesaPhone">
            M-Pesa phone number
          </label>
          <input
            id="mpesaPhone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            className={formControlClass}
            placeholder="0712 345 678"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
          />
          <button className={`${primaryButtonClass} w-full`} type="submit" disabled={submitting || phone.trim() === ""}>
            {submitting ? "Sending prompt…" : payment?.status === "failed" ? "Try again" : "Send M-Pesa prompt"}
          </button>
          <p className="text-xs text-slate-500">You&apos;ll get a prompt on your phone to confirm with your PIN.</p>
        </form>
      )}

      {error ? (
        <div className="mt-3">
          <FormStatusMessage message={error} />
        </div>
      ) : null}
    </SoftCard>
  );
}
