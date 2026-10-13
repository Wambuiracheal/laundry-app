"use client";

import { useEffect, useRef, useState } from "react";
import { metersBetween, shareLocation, stopSharingLocation, type LatLng } from "@/utils/trackingApi";

// Send at most this often, or sooner once the rider has moved this far.
const SEND_INTERVAL_MS = 10_000;
const SEND_DISTANCE_M = 30;

export type ShareStatus = "off" | "locating" | "sharing" | "denied" | "unavailable";

/**
 * While `enabled`, follows the phone's GPS and shares it with the API so customers and the shop
 * can see the rider on the map. Stops (and clears the shared position) when disabled.
 * Browsers only allow location on HTTPS pages or localhost.
 */
export function useShareLocation(enabled: boolean) {
  const [position, setPosition] = useState<(LatLng & { accuracy_m: number }) | null>(null);
  const [status, setStatus] = useState<ShareStatus>("off");
  const lastSent = useRef<{ at: number; point: LatLng } | null>(null);

  useEffect(() => {
    if (!enabled) return;
    if (!("geolocation" in navigator)) {
      const timer = window.setTimeout(() => setStatus("unavailable"), 0);
      return () => window.clearTimeout(timer);
    }

    const watchId = navigator.geolocation.watchPosition(
      (event) => {
        const point = { lat: event.coords.latitude, lng: event.coords.longitude };
        setPosition({ ...point, accuracy_m: event.coords.accuracy });
        setStatus("sharing");

        const previous = lastSent.current;
        const due = !previous || Date.now() - previous.at >= SEND_INTERVAL_MS || metersBetween(previous.point, point) >= SEND_DISTANCE_M;
        if (!due) return;
        lastSent.current = { at: Date.now(), point };
        shareLocation({ ...point, accuracy_m: event.coords.accuracy, heading: event.coords.heading }).catch(() => {
          // Retry on the next GPS fix.
          lastSent.current = null;
        });
      },
      (error) => setStatus(error.code === error.PERMISSION_DENIED ? "denied" : "unavailable"),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 },
    );
    const locating = window.setTimeout(() => setStatus((current) => (current === "off" ? "locating" : current)), 0);

    return () => {
      window.clearTimeout(locating);
      navigator.geolocation.clearWatch(watchId);
      lastSent.current = null;
      setStatus("off");
      stopSharingLocation().catch(() => undefined);
    };
  }, [enabled]);

  return { position: enabled ? position : null, status };
}
