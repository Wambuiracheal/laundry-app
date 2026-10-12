"use client";

import { useEffect, useState } from "react";
import { AppShell, Badge, PageHeading, SectionHeader, SoftCard, primaryButtonClass } from "@/components/mobile/primitives";
import { AddressAutocomplete } from "@/components/shared/form/AddressAutocomplete";
import { FormStatusMessage, formControlClass } from "@/components/shared/form/FormField";
import { usePolledData } from "@/hooks/usePolledData";
import type { AddressSuggestion } from "@/utils/addressSearch";
import { formatKES } from "@/utils/currency";
import { formatDateTime, orderRef } from "@/utils/ordersApi";
import {
  DISTANCE_SOURCE_LABELS,
  fetchPayouts,
  fetchSettings,
  payOutRider,
  saveSettings,
  type AppSettings,
  type RiderPayout,
} from "@/utils/ridersApi";

const PAYOUTS_POLL_INTERVAL_MS = 30_000;

/** Per-km rate and the shop location every trip is measured from. */
function PaySettingsCard() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [rate, setRate] = useState("");
  const [address, setAddress] = useState("");
  const [picked, setPicked] = useState<AddressSuggestion | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings()
      .then((loaded) => {
        setSettings(loaded);
        setRate(String(loaded.riderRatePerKm));
        setAddress(loaded.shop?.address ?? "");
      })
      .catch((error: unknown) => setMessage(`Failed to load settings: ${error instanceof Error ? error.message : "unknown error"}`));
  }, []);

  async function save() {
    const rateValue = Number(rate);
    if (!Number.isFinite(rateValue) || rateValue < 0) {
      setMessage("Enter a rate of 0 or more.");
      return;
    }
    try {
      setBusy(true);
      setMessage(null);
      const saved = await saveSettings({
        rider_rate_per_km: rateValue,
        ...(picked ? { shop: { address: picked.label, lat: picked.lat, lng: picked.lng } } : {}),
      });
      setSettings(saved);
      setPicked(null);
      setAddress(saved.shop?.address ?? "");
      setMessage("Saved. New orders are quoted with these settings; existing orders keep the fee they were quoted.");
    } catch (error) {
      setMessage(`Save failed: ${error instanceof Error ? error.message : "please try again."}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <SoftCard className="lg:p-5">
      <h2 className="text-base font-semibold">Rider pay</h2>
      <p className="text-xs text-slate-500">
        Customers pay this rate for each km of road between the shop and their address, once for the pickup and once for the
        delivery. Each rider is paid the trip they did once the customer has paid.
      </p>
      {!settings && !message ? <p className="mt-3 text-sm text-slate-500">Loading…</p> : null}
      {settings ? (
        <div className="mt-3 grid gap-3 sm:grid-cols-[160px_minmax(0,1fr)]">
          <label className="text-xs font-medium text-slate-600">
            KES per km
            <input
              type="number"
              inputMode="decimal"
              min={0}
              step={10}
              className={`${formControlClass} mt-1`}
              value={rate}
              onChange={(event) => setRate(event.target.value)}
            />
          </label>
          <div className="text-xs font-medium text-slate-600">
            <label htmlFor="shopAddress">Shop location</label>
            <div className="mt-1">
              <AddressAutocomplete
                id="shopAddress"
                placeholder="Search for the shop's building or street"
                value={address}
                onChange={(value) => {
                  setAddress(value);
                  setPicked(null);
                }}
                onSelect={(suggestion) => {
                  setAddress(suggestion.label);
                  setPicked(suggestion);
                }}
              />
            </div>
            <p className="mt-1 font-normal text-slate-500">
              {picked
                ? "New location selected. Save to use it."
                : settings.shop
                  ? `Pinned at ${settings.shop.lat.toFixed(4)}, ${settings.shop.lng.toFixed(4)}.`
                  : "Not set yet. Delivery fees and rider pay are calculated from this, so set it before taking orders."}
            </p>
          </div>
        </div>
      ) : null}
      {settings ? (
        <button className={`${primaryButtonClass} mt-4`} type="button" onClick={save} disabled={busy}>
          {busy ? "Saving…" : "Save"}
        </button>
      ) : null}
      {message ? (
        <div className="mt-3">
          <FormStatusMessage message={message} />
        </div>
      ) : null}
    </SoftCard>
  );
}

function RiderCard({ rider, onChanged }: { rider: RiderPayout; onChanged: () => void }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const name = `${rider.first_name} ${rider.last_name}`.trim();

  async function payOut() {
    if (!window.confirm(`Record ${formatKES(rider.unpaid_total)} as paid to ${name}? Do this after sending the money.`)) return;
    try {
      setBusy(true);
      setMessage(null);
      const result = await payOutRider(rider.id);
      setMessage(`Recorded ${formatKES(result.paid_total)} paid for ${result.paid_trips} trip${result.paid_trips === 1 ? "" : "s"}.`);
      onChanged();
    } catch (error) {
      setMessage(`Payout failed: ${error instanceof Error ? error.message : "please try again."}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <SoftCard className="lg:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold">{name}</h3>
          <a href={`tel:${rider.phone}`} className="text-xs font-medium text-blue-700 hover:text-blue-800">
            {rider.phone}
          </a>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold tabular-nums">{formatKES(rider.unpaid_total)}</p>
          <p className="text-xs text-slate-500">
            payable · {rider.unpaid_trips} trip{rider.unpaid_trips === 1 ? "" : "s"}
          </p>
          {rider.held_total > 0 ? <p className="text-xs text-amber-700">+ {formatKES(rider.held_total)} held until customers pay</p> : null}
        </div>
      </div>

      {rider.earnings.length > 0 ? (
        <ul className="mt-3 divide-y divide-slate-100 border-t border-slate-100">
          {rider.earnings.map((earning) => (
            <li key={earning.id} className="py-2.5 text-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium">
                    {earning.leg === "pickup" ? "Pickup" : "Delivery"} · {orderRef({ id: earning.order_id })}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {earning.distance_km
                      ? `${Number(earning.distance_km)} km, ${DISTANCE_SOURCE_LABELS[earning.distance_source ?? "road"]}`
                      : earning.order.pickup_address}
                    {" · "}
                    {formatDateTime(earning.created_at)}
                  </p>
                </div>
                {earning.status === "needs_distance" ? (
                  <Badge text="Distance pending" tone="amber" />
                ) : (
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="font-semibold tabular-nums">{formatKES(Number(earning.amount ?? 0))}</span>
                    {earning.order.payment_status !== "paid" ? <Badge text="Held: customer unpaid" tone="gray" /> : null}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-xs text-slate-500">Nothing owed right now.</p>
      )}

      {rider.unpaid_total > 0 ? (
        <button className={`${primaryButtonClass} mt-3`} type="button" onClick={payOut} disabled={busy}>
          Mark {formatKES(rider.unpaid_total)} as paid
        </button>
      ) : null}
      {message ? (
        <div className="mt-3">
          <FormStatusMessage message={message} />
        </div>
      ) : null}
    </SoftCard>
  );
}

export function RiderPayoutsScreen() {
  const { data, error, loading, setData } = usePolledData(fetchPayouts, PAYOUTS_POLL_INTERVAL_MS);
  const riders = data?.riders ?? null;
  const reload = () => {
    fetchPayouts().then(setData, () => undefined);
  };

  const totalOwed = data?.summary.owed_to_riders ?? 0;
  const needsDistance = (riders ?? []).reduce(
    (count, rider) => count + rider.earnings.filter((earning) => earning.status === "needs_distance").length,
    0,
  );

  return (
    <AppShell active="riders" nav="admin" homeHref="/shop" title="Riders" backHref="/shop" backLabel="Shop">
      <PageHeading
        title="Rider pay"
        subtitle={
          riders
            ? `${formatKES(totalOwed)} payable across ${riders.length} rider${riders.length === 1 ? "" : "s"}${needsDistance ? ` · ${needsDistance} trip${needsDistance === 1 ? "" : "s"} need a distance` : ""}.`
            : "What each rider has earned and is owed."
        }
      />

      <div className="space-y-6">
        {data ? (
          <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <SoftCard>
              <p className="text-xs font-medium text-slate-500">Delivery fees collected</p>
              <p className="mt-1 text-lg font-semibold tabular-nums">{formatKES(data.summary.fees_collected)}</p>
            </SoftCard>
            <SoftCard>
              <p className="text-xs font-medium text-slate-500">Paid to riders</p>
              <p className="mt-1 text-lg font-semibold tabular-nums">{formatKES(data.summary.paid_to_riders)}</p>
            </SoftCard>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-xs font-medium text-emerald-800">Payable now</p>
              <p className="mt-1 text-lg font-semibold tabular-nums text-emerald-900">{formatKES(data.summary.owed_to_riders)}</p>
            </div>
            <SoftCard>
              <p className="text-xs font-medium text-slate-500">Held (customer unpaid)</p>
              <p className="mt-1 text-lg font-semibold tabular-nums">{formatKES(data.summary.held)}</p>
            </SoftCard>
          </section>
        ) : null}

        <PaySettingsCard />

        <section>
          <SectionHeader title="Owed to riders" />
          {error && !riders ? <FormStatusMessage message={`Failed to load riders: ${error}`} /> : null}
          {loading ? <p className="text-sm text-slate-500">Loading riders…</p> : null}
          {riders && riders.length === 0 ? <SoftCard className="text-center text-sm text-slate-500">No riders have signed up yet.</SoftCard> : null}
          <div className="grid gap-4 lg:grid-cols-2">
            {[...(riders ?? [])]
              .sort((a, b) => b.unpaid_total - a.unpaid_total)
              .map((rider) => (
                <RiderCard key={rider.id} rider={rider} onChanged={reload} />
              ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
