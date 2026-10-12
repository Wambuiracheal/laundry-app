"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { LiveMap, type MapMarker } from "@/components/maps/LiveMap";
import { SoftCard } from "@/components/mobile/primitives";
import { useShareLocation, type ShareStatus } from "@/hooks/useShareLocation";
import { orderRef, type ApiOrder } from "@/utils/ordersApi";
import { fetchJobRoute, formatDistance, formatDuration, metersBetween, type JobRoute, type LatLng } from "@/utils/trackingApi";

// Re-route when the rider has moved this far from where the last route started, or it's this old.
const REROUTE_DISTANCE_M = 100;
const REROUTE_AFTER_MS = 60_000;
const STEPS_SHOWN = 6;

const STATUS_TEXT: Record<ShareStatus, string> = {
  off: "Location sharing is paused.",
  locating: "Finding your location…",
  sharing: "Sharing your live location with the shop and your customers.",
  denied: "Location is blocked. Allow location for this site in your browser settings to share it and get directions.",
  unavailable: "Your location isn't available right now. Check that GPS is on.",
};

function jobMarker(order: ApiOrder): MapMarker | null {
  if (order.pickup_lat === null || order.pickup_lng === null) return null;
  const pickup = order.status === "pending_pickup";
  return {
    id: order.id,
    lat: order.pickup_lat,
    lng: order.pickup_lng,
    kind: pickup ? "pickup" : order.status === "ready" ? "ready" : "delivery",
    label: `${pickup ? "Pickup" : "Delivery"} ${orderRef(order)}: ${order.pickup_address}`,
  };
}

/**
 * Rider's map: shares their live location while they have jobs, shows their stops, and draws
 * the road route with turn-by-turn directions to the selected job's next stop.
 */
export function RiderMapCard({ jobs, selectedId, onSelect }: { jobs: ApiOrder[]; selectedId: string | null; onSelect: (id: string | null) => void }) {
  const [paused, setPaused] = useState(false);
  const { position, status } = useShareLocation(!paused && jobs.length > 0);
  const selected = jobs.find((order) => order.id === selectedId) ?? null;

  const [route, setRoute] = useState<{ orderId: string; data: JobRoute | null; error: string | null } | null>(null);
  const lastFetch = useRef<{ orderId: string; status: string; point: LatLng | null; at: number } | null>(null);

  // Fetch directions for the selected job; refresh as the rider moves or the stop changes.
  useEffect(() => {
    if (!selected) return;
    const from = position ? { lat: position.lat, lng: position.lng } : null;
    const last = lastFetch.current;
    const due =
      !last ||
      last.orderId !== selected.id ||
      last.status !== selected.status ||
      (from !== null && (last.point === null || metersBetween(last.point, from) > REROUTE_DISTANCE_M)) ||
      Date.now() - last.at > REROUTE_AFTER_MS;
    if (!due) return;

    lastFetch.current = { orderId: selected.id, status: selected.status, point: from, at: Date.now() };
    fetchJobRoute(selected.id, from).then(
      (data) => setRoute({ orderId: selected.id, data, error: null }),
      (error: unknown) => setRoute({ orderId: selected.id, data: null, error: error instanceof Error ? error.message : "Directions unavailable." }),
    );
  }, [selected, position]);

  const current = route && selected && route.orderId === selected.id ? route : null;

  const markers = useMemo(() => {
    const list: MapMarker[] = jobs.map(jobMarker).filter((marker): marker is MapMarker => marker !== null);
    if (current?.data?.destination.kind === "shop") {
      list.push({ id: "shop", lat: current.data.destination.lat, lng: current.data.destination.lng, kind: "shop", label: `Shop: ${current.data.destination.address}` });
    }
    if (position) list.push({ id: "me", lat: position.lat, lng: position.lng, kind: "rider", label: "You" });
    return list;
  }, [jobs, current, position]);

  const steps = current?.data?.route?.steps ?? [];

  return (
    <SoftCard className="mb-6 lg:p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold">Live map</h2>
          <p className={`text-xs ${status === "denied" || status === "unavailable" ? "text-rose-700" : "text-slate-500"}`}>
            {jobs.length === 0 ? "Location sharing starts when you accept a job." : STATUS_TEXT[paused ? "off" : status]}
          </p>
        </div>
        {jobs.length > 0 ? (
          <button
            type="button"
            onClick={() => setPaused((value) => !value)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
              paused ? "border-blue-700 bg-blue-700 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
            }`}
          >
            {paused ? "Resume sharing" : "Pause sharing"}
          </button>
        ) : null}
      </div>

      <LiveMap
        markers={markers}
        route={current?.data?.route?.coordinates}
        fitKey={`${selected?.id ?? "all"}:${selected?.status ?? ""}:${markers.length > 0}:${current ? "route" : ""}`}
        ariaLabel="Map of your position, your jobs and the route to your next stop"
      />

      {selected ? (
        <div className="mt-3 rounded-xl border border-slate-200 p-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold">
                Route to {current?.data?.destination.kind === "shop" ? "the shop" : "the customer"} · {orderRef(selected)}
              </p>
              <p className="text-xs text-slate-500">{current?.data?.destination.address ?? selected.pickup_address}</p>
            </div>
            <button type="button" onClick={() => onSelect(null)} className="text-xs font-semibold text-slate-500 hover:text-slate-700">
              Close
            </button>
          </div>

          {current?.error ? <p className="mt-2 text-xs text-rose-700">{current.error}</p> : null}
          {!current ? <p className="mt-2 text-xs text-slate-500">Getting directions…</p> : null}
          {current?.data && !current.data.route ? <p className="mt-2 text-xs text-slate-500">Road directions are unavailable right now. Use Google Maps on the job card.</p> : null}

          {current?.data?.route ? (
            <>
              <p className="mt-2 text-lg font-semibold text-blue-700">
                {formatDuration(current.data.route.duration_s)} <span className="text-sm font-medium text-slate-500">· {formatDistance(current.data.route.distance_m)}</span>
              </p>
              <ol className="mt-2 space-y-1.5">
                {steps.slice(0, STEPS_SHOWN).map((step, index) => (
                  <li key={index} className="flex items-baseline justify-between gap-3 text-sm">
                    <span className={index === 0 ? "font-semibold" : "text-slate-700"}>{step.instruction}</span>
                    {step.distance_m > 0 ? <span className="shrink-0 text-xs tabular-nums text-slate-500">{formatDistance(step.distance_m)}</span> : null}
                  </li>
                ))}
              </ol>
              {steps.length > STEPS_SHOWN ? <p className="mt-1 text-xs text-slate-400">+ {steps.length - STEPS_SHOWN} more steps</p> : null}
            </>
          ) : null}
        </div>
      ) : jobs.length > 0 ? (
        <p className="mt-2 text-xs text-slate-500">Tap “Show route” on a job for turn-by-turn directions.</p>
      ) : null}
    </SoftCard>
  );
}
