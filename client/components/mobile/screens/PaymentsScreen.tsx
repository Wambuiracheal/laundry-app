"use client";

import { useState } from "react";
import { AppShell, Badge, PageHeading, SoftCard } from "@/components/mobile/primitives";
import { FormStatusMessage } from "@/components/shared/form/FormField";
import { usePolledData } from "@/hooks/usePolledData";
import { formatKES } from "@/utils/currency";
import { formatDateTime, orderRef } from "@/utils/ordersApi";
import { fetchPayment, fetchPaymentLog, paymentFailureMessage, type MpesaPayment, type PaymentStatus } from "@/utils/paymentsApi";

const LOG_POLL_INTERVAL_MS = 20_000;

const FILTERS: { key: PaymentStatus | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "failed", label: "Failed" },
  { key: "pending", label: "Pending" },
  { key: "success", label: "Successful" },
];

const STATUS_BADGES: Record<PaymentStatus, { text: string; tone: "green" | "amber" | "red" }> = {
  success: { text: "Paid", tone: "green" },
  pending: { text: "Waiting for PIN", tone: "amber" },
  failed: { text: "Failed", tone: "red" },
};

/** 254712345678 -> 0712 345 678 */
function formatPhone(phone: string | null) {
  if (!phone) return "—";
  const local = `0${phone.slice(3)}`;
  return `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}`;
}

function isToday(iso: string) {
  return new Date(iso).toDateString() === new Date().toDateString();
}

export function PaymentsScreen() {
  const { data: payments, error, loading, setData } = usePolledData(fetchPaymentLog, LOG_POLL_INTERVAL_MS);
  const [filter, setFilter] = useState<PaymentStatus | "all">("all");
  const [checkingId, setCheckingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function checkStatus(payment: MpesaPayment) {
    try {
      setCheckingId(payment.id);
      setMessage(null);
      const latest = await fetchPayment(payment.id);
      setData((prev) => (prev ?? []).map((row) => (row.id === latest.id ? { ...row, ...latest, order: row.order } : row)));
      if (latest.status === "pending") setMessage(`${orderRef({ id: payment.order_id })}: still waiting for the customer.`);
    } catch (err) {
      setMessage(`Status check failed: ${err instanceof Error ? err.message : "please try again."}`);
    } finally {
      setCheckingId(null);
    }
  }

  const all = payments ?? [];
  const visible = filter === "all" ? all : all.filter((payment) => payment.status === filter);
  const collectedToday = all
    .filter((payment) => payment.status === "success" && isToday(payment.updated_at))
    .reduce((sum, payment) => sum + Number(payment.amount), 0);
  const failedToday = all.filter((payment) => payment.status === "failed" && isToday(payment.created_at)).length;

  return (
    <AppShell active="payments" nav="admin" homeHref="/shop" title="Payments" backHref="/shop" backLabel="Shop">
      <PageHeading title="M-Pesa payments" subtitle="STK push payments from customers, newest first. Failed prompts are flagged with the reason." />

      {error && !payments ? <FormStatusMessage message={`Failed to load payments: ${error}`} /> : null}
      {loading ? <p className="text-sm text-slate-500">Loading payments…</p> : null}

      {payments ? (
        <section className="mb-4 grid grid-cols-2 gap-3 md:max-w-md">
          <SoftCard>
            <p className="text-xs font-medium text-slate-500">Collected today</p>
            <p className="mt-1 text-xl font-semibold tabular-nums text-emerald-700">{formatKES(collectedToday)}</p>
          </SoftCard>
          <SoftCard>
            <p className="text-xs font-medium text-slate-500">Failed today</p>
            <p className={`mt-1 text-xl font-semibold tabular-nums ${failedToday > 0 ? "text-rose-700" : "text-slate-900"}`}>{failedToday}</p>
          </SoftCard>
        </section>
      ) : null}

      {payments ? (
        <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Filter payments by status">
          {FILTERS.map((candidate) => {
            const count = candidate.key === "all" ? all.length : all.filter((payment) => payment.status === candidate.key).length;
            const selected = candidate.key === filter;
            return (
              <button
                key={candidate.key}
                type="button"
                aria-pressed={selected}
                onClick={() => setFilter(candidate.key)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  selected ? "border-blue-700 bg-blue-700 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                }`}
              >
                {candidate.label}
                <span className={`rounded-full px-1.5 tabular-nums ${selected ? "bg-white/20" : "bg-slate-100 text-slate-600"}`}>{count}</span>
              </button>
            );
          })}
        </div>
      ) : null}

      {message ? (
        <div className="mb-4">
          <FormStatusMessage message={message} />
        </div>
      ) : null}

      {payments && visible.length === 0 ? <SoftCard className="text-center text-sm text-slate-500">No payments in this list.</SoftCard> : null}

      <div className="space-y-3">
        {visible.map((payment) => {
          const badge = STATUS_BADGES[payment.status];
          return (
            <SoftCard key={payment.id} className={payment.status === "failed" ? "border-rose-200" : ""}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">
                    Order {orderRef({ id: payment.order_id })} · {payment.order?.customer ?? "Customer"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatPhone(payment.phone)} · {formatDateTime(payment.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-semibold tabular-nums">{formatKES(Number(payment.amount))}</span>
                  <Badge text={badge.text} tone={badge.tone} />
                </div>
              </div>

              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                {payment.status === "success" ? (
                  <span className="text-slate-600">
                    M-Pesa code: <span className="font-semibold text-slate-900">{payment.mpesa_receipt ?? "not captured (no callback URL)"}</span>
                  </span>
                ) : payment.status === "failed" ? (
                  <span className="text-rose-700">{paymentFailureMessage(payment)}</span>
                ) : (
                  <span className="text-slate-500">Prompt sent; waiting for the customer to enter their PIN.</span>
                )}
                {payment.status === "pending" ? (
                  <button
                    type="button"
                    onClick={() => checkStatus(payment)}
                    disabled={checkingId === payment.id}
                    className="font-semibold text-blue-700 hover:text-blue-800 disabled:opacity-50"
                  >
                    {checkingId === payment.id ? "Checking…" : "Check status"}
                  </button>
                ) : null}
              </div>
            </SoftCard>
          );
        })}
      </div>
    </AppShell>
  );
}
