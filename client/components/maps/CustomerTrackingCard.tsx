"use client";

import { useCallback, useMemo } from "react";
import { LiveMap, type MapMarker } from "@/components/maps/LiveMap";
import { SoftCard } from "@/components/mobile/primitives";
import { useNow } from "@/hooks/useNow";
import { usePolledData } from "@/hooks/usePolledData";
import { fetchOrderTracking, formatDistance, formatDuration } from "@/utils/trackingApi";

const TRACKING_POLL_INTERVAL_MS = 10_000;

/** Live map of the rider heading to the customer, shown only while a pickup or delivery is under way. */
export function CustomerTrackingCard({ orderId }: { orderId: string }) {
  const load = useCallback(() => fetchOrderTracking(orderId), [orderId]);
  const { data } = usePolledData(load, TRACKING_POLL_INTERVAL_MS);
  const now = useNow(30_000);

  const markers = useMemo(() => {
    const list: MapMarker[] = [];
    if (data?.home) list.push({ id: "home", ...data.home, kind: "home", label: "Your address" });
    const location = data?.rider?.location;
    if (location) {
      list.push({ id: "rider", lat: location.lat, lng: location.lng, kind: "rider", label: data?.rider?.first_name ?? "Rider", dimmed: location.stale });
    }
    return list;
  }, [data]);

  if (!data?.active || !data.rider) return null;

  const { first_name: name, location } = data.rider;
  const purpose = data.phase === "pickup" ? "to collect your laundry" : "with your clean clothes";
  const minutesAgo = location ? Math.max(1, Math.round((now - Date.parse(location.updated_at)) / 60_000)) : 0;

  return (
    <SoftCard className="lg:p-5">
      <h2 className="text-base font-semibold">
        {name} is on the way {purpose}
      </h2>
      <p className="mb-3 text-sm text-slate-600">
        {!location
          ? `We'll show ${name} on the map as soon as their location comes through.`
          : location.stale
            ? `Last seen ${minutesAgo} min ago.`
            : data.route
              ? `About ${formatDuration(data.route.duration_s)} away (${formatDistance(data.route.distance_m)}).`
              : "Live location"}
      </p>
      <LiveMap
        markers={markers}
        route={location && !location.stale ? data.route?.coordinates : null}
        fitKey={`${data.phase}:${Boolean(location)}`}
        className="h-64"
        ariaLabel={`Map showing ${name} and your address`}
      />
    </SoftCard>
  );
}
