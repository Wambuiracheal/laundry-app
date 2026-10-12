"use client";

import { useMemo } from "react";
import { LiveMap, type MapMarker, type MapMarkerKind } from "@/components/maps/LiveMap";
import { AppShell, Badge, PageHeading, SectionHeader, SoftCard } from "@/components/mobile/primitives";
import { FormStatusMessage } from "@/components/shared/form/FormField";
import { useNow } from "@/hooks/useNow";
import { useSession } from "@/hooks/useSession";
import { usePolledData } from "@/hooks/usePolledData";
import { STATUS_LABELS, STATUS_TONES, type OrderStatus } from "@/utils/ordersApi";
import { fetchLiveOverview } from "@/utils/trackingApi";

const LIVE_POLL_INTERVAL_MS = 10_000;

const ORDER_MARKER: Partial<Record<OrderStatus, MapMarkerKind>> = {
  pending_pickup: "pickup",
  picked_up: "atShop",
  processing: "atShop",
  ready: "ready",
  out_for_delivery: "delivery",
};

const LEGEND: { kind: MapMarkerKind; label: string; symbol: string }[] = [
  { kind: "rider", label: "Rider", symbol: "🛵" },
  { kind: "shop", label: "Shop", symbol: "🧺" },
  { kind: "pickup", label: "Awaiting pickup", symbol: "📦" },
  { kind: "atShop", label: "At shop", symbol: "🧼" },
  { kind: "ready", label: "Ready", symbol: "✓" },
  { kind: "delivery", label: "Out for delivery", symbol: "🚚" },
];

/** Dispatch view: where every rider is and where every active order needs to go. */
export function LiveDispatchScreen() {
  const role = useSession()?.role;
  const { data, error, loading } = usePolledData(fetchLiveOverview, LIVE_POLL_INTERVAL_MS);
  const now = useNow(30_000);

  const markers = useMemo(() => {
    if (!data) return [];
    const list: MapMarker[] = [];
    if (data.shop) list.push({ id: "shop", lat: data.shop.lat, lng: data.shop.lng, kind: "shop", label: `Shop: ${data.shop.address}` });
    for (const order of data.orders) {
      const kind = ORDER_MARKER[order.status];
      // Orders at the shop sit on the shop's pin; only show the customer address for trips.
      if (!kind || kind === "atShop") continue;
      list.push({ id: order.id, lat: order.lat, lng: order.lng, kind, label: `${order.ref} · ${STATUS_LABELS[order.status]} · ${order.customer}, ${order.address}` });
    }
    for (const rider of data.riders) {
      const jobs = rider.jobs.map((job) => job.ref).join(", ");
      list.push({
        id: `rider-${rider.id}`,
        lat: rider.location.lat,
        lng: rider.location.lng,
        kind: "rider",
        label: `${rider.name}${jobs ? ` · ${jobs}` : " · no active job"}`,
        dimmed: rider.location.stale,
      });
    }
    return list;
  }, [data]);

  const lastSeen = (iso: string) => {
    const minutes = Math.round((now - Date.parse(iso)) / 60_000);
    return minutes < 1 ? "just now" : `${minutes} min ago`;
  };

  return (
    <AppShell active="map" nav={role === "admin" ? "admin" : "shop"} homeHref="/shop" title="Live map" backHref="/shop" backLabel="Shop">
      <PageHeading
        title="Live map"
        subtitle={
          data
            ? `${data.riders.length} rider${data.riders.length === 1 ? "" : "s"} sharing location · ${data.orders.length} active order${data.orders.length === 1 ? "" : "s"}. Updates every 10 seconds.`
            : "Riders and active orders in real time."
        }
      />

      {error && !data ? <FormStatusMessage message={`Failed to load the live map: ${error}`} /> : null}
      {loading ? <p className="text-sm text-slate-500">Loading map…</p> : null}
      {data && !data.shop ? (
        <div className="mb-4">
          <FormStatusMessage message="The shop location isn't set. An admin can set it on the Riders page." />
        </div>
      ) : null}

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-6">
        <div>
          <LiveMap markers={markers} fitKey={data ? "loaded" : undefined} className="h-[60vh] min-h-80" ariaLabel="Map of riders and active orders" />
          <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600" aria-label="Map legend">
            {LEGEND.map((item) => (
              <li key={item.kind}>
                <span aria-hidden>{item.symbol}</span> {item.label}
              </li>
            ))}
          </ul>
        </div>

        <section className="mt-6 lg:mt-0">
          <SectionHeader title="Riders on shift" />
          {data && data.riders.length === 0 ? (
            <SoftCard className="text-sm text-slate-500">No riders are sharing their location right now. Riders share it automatically while they have jobs.</SoftCard>
          ) : null}
          <div className="space-y-3">
            {(data?.riders ?? []).map((rider) => (
              <SoftCard key={rider.id}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">{rider.name}</p>
                    <a href={`tel:${rider.phone}`} className="text-xs font-medium text-blue-700 hover:text-blue-800">
                      {rider.phone}
                    </a>
                  </div>
                  <span className={`text-xs ${rider.location.stale ? "text-amber-700" : "text-emerald-700"}`}>
                    {rider.location.stale ? `Last seen ${lastSeen(rider.location.updated_at)}` : `Live · ${lastSeen(rider.location.updated_at)}`}
                  </span>
                </div>
                {rider.jobs.length > 0 ? (
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {rider.jobs.map((job) => (
                      <li key={job.order_id}>
                        <Badge text={`${job.ref} · ${STATUS_LABELS[job.status]}`} tone={STATUS_TONES[job.status]} />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-xs text-slate-500">No active job</p>
                )}
              </SoftCard>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
