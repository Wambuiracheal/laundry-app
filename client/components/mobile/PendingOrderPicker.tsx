"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { PlusIcon } from "@/components/mobile/icons";
import { SoftCard, primaryButtonClass } from "@/components/mobile/primitives";
import { FormField, FormStatusMessage, formSelectClass } from "@/components/shared/form/FormField";
import { canChangePickup, fetchMyOrders, formatDateTime, orderRef, serviceSummary, type ApiOrder } from "@/utils/ordersApi";

/**
 * The order a reschedule/cancel page acts on: `?id=` when given, otherwise the next pickup.
 * Only orders still awaiting pickup can be changed.
 */
export function usePendingOrder() {
  const requestedId = useSearchParams().get("id");
  const [orders, setOrders] = useState<ApiOrder[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMyOrders().then(setOrders, (err: unknown) => setError(err instanceof Error ? err.message : "Could not load your orders."));
  }, []);

  const pending = (orders ?? [])
    .filter(canChangePickup)
    .sort((a, b) => (a.pickup_time ?? "").localeCompare(b.pickup_time ?? ""));
  const requested = orders?.find((order) => order.id === requestedId) ?? null;
  const order = requestedId ? requested : (pending[0] ?? null);

  return { orders, pending, order, requested, requestedId, error, loading: orders === null && error === null };
}

/** Explains why there's nothing to change, or lets the customer switch between pending orders. */
export function PendingOrderState({
  state,
  basePath,
  action,
}: {
  state: ReturnType<typeof usePendingOrder>;
  basePath: string;
  action: string;
}) {
  const router = useRouter();
  const { order, pending, requested, requestedId, error, loading } = state;

  if (error) return <FormStatusMessage message={`Couldn't load your orders: ${error}`} />;
  if (loading) return <p className="text-sm text-slate-500">Loading your orders…</p>;

  if (requestedId && !requested) {
    return <SoftCard className="text-sm text-slate-600">We couldn&apos;t find that order on your account.</SoftCard>;
  }

  if (order && !canChangePickup(order)) {
    return (
      <SoftCard className="space-y-3 text-sm text-slate-600">
        <p>
          Order {orderRef(order)} has already been collected, so it can&apos;t be {action} here. Our team can still help.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link href="/support" className={primaryButtonClass}>
            Contact support
          </Link>
          <Link href={`/order-tracking?id=${order.id}`} className="inline-flex items-center px-2 text-sm font-medium text-blue-700">
            Back to order
          </Link>
        </div>
      </SoftCard>
    );
  }

  if (!order) {
    return (
      <SoftCard className="text-center text-sm text-slate-600">
        <p>You have no pickups waiting to be collected.</p>
        <Link href="/new-order" className={`${primaryButtonClass} mt-4`}>
          <PlusIcon className="h-4 w-4" />
          Book a pickup
        </Link>
      </SoftCard>
    );
  }

  if (pending.length < 2) return null;

  return (
    <FormField htmlFor="order" label="Order">
      <select
        id="order"
        className={formSelectClass}
        value={order.id}
        onChange={(event) => router.replace(`${basePath}?id=${event.target.value}`)}
      >
        {pending.map((candidate) => (
          <option key={candidate.id} value={candidate.id}>
            {orderRef(candidate)} · {serviceSummary(candidate)} · {formatDateTime(candidate.pickup_time)}
          </option>
        ))}
      </select>
    </FormField>
  );
}
