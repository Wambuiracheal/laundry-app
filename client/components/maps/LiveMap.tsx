"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import type { LayerGroup, Map as LeafletMap } from "leaflet";

export type MapMarkerKind = "rider" | "home" | "shop" | "pickup" | "atShop" | "ready" | "delivery";

export type MapMarker = {
  id: string;
  lat: number;
  lng: number;
  kind: MapMarkerKind;
  /** Popup text when tapped. */
  label: string;
  /** Faded, e.g. a rider whose position is out of date. */
  dimmed?: boolean;
};

// Inline styles (not Tailwind) because Leaflet renders these outside React.
const MARKER_STYLES: Record<MapMarkerKind, { background: string; symbol: string }> = {
  rider: { background: "#1d4ed8", symbol: "🛵" },
  home: { background: "#047857", symbol: "🏠" },
  shop: { background: "#7c3aed", symbol: "🧺" },
  pickup: { background: "#d97706", symbol: "📦" },
  atShop: { background: "#64748b", symbol: "🧼" },
  ready: { background: "#059669", symbol: "✓" },
  delivery: { background: "#2563eb", symbol: "🚚" },
};

const NAIROBI: [number, number] = [-1.2864, 36.8172];
const TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

function escapeHtml(text: string) {
  return text.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);
}

/**
 * OpenStreetMap map with markers and an optional route line. Leaflet needs `window`, so it is
 * loaded in the browser only. The view fits the content when `fitKey` changes (not on every
 * refresh), so polling updates don't yank the map while someone is panning it.
 */
export function LiveMap({
  markers,
  route,
  fitKey,
  className = "h-72",
  ariaLabel,
}: {
  markers: MapMarker[];
  route?: [number, number][] | null;
  fitKey?: string;
  className?: string;
  ariaLabel: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const layerRef = useRef<LayerGroup | null>(null);
  const leafletRef = useRef<typeof import("leaflet") | null>(null);
  const fittedKeyRef = useRef<string | undefined>(undefined);

  // Create the map once.
  useEffect(() => {
    let cancelled = false;
    import("leaflet").then((L) => {
      if (cancelled || !containerRef.current || mapRef.current) return;
      leafletRef.current = L;
      const map = L.map(containerRef.current, { zoomControl: true, attributionControl: true }).setView(NAIROBI, 13);
      L.tileLayer(TILE_URL, { maxZoom: 19, attribution: ATTRIBUTION }).addTo(map);
      mapRef.current = map;
      layerRef.current = L.layerGroup().addTo(map);
      // Trigger a draw with whatever props arrived before Leaflet loaded.
      containerRef.current.dispatchEvent(new Event("leaflet-ready"));
    });
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  // Redraw markers and route whenever they change.
  useEffect(() => {
    const draw = () => {
      const L = leafletRef.current;
      const map = mapRef.current;
      const layer = layerRef.current;
      if (!L || !map || !layer) return;

      layer.clearLayers();
      const points: [number, number][] = [];

      if (route && route.length > 1) {
        L.polyline(route, { color: "#1d4ed8", weight: 5, opacity: 0.75 }).addTo(layer);
        points.push(...route);
      }

      for (const marker of markers) {
        const style = MARKER_STYLES[marker.kind];
        const icon = L.divIcon({
          className: "",
          iconSize: [34, 34],
          iconAnchor: [17, 17],
          popupAnchor: [0, -16],
          html: `<div style="width:34px;height:34px;border-radius:9999px;background:${style.background};border:3px solid #fff;box-shadow:0 2px 6px rgba(15,23,42,.35);display:flex;align-items:center;justify-content:center;font-size:16px;opacity:${marker.dimmed ? 0.45 : 1}">${style.symbol}</div>`,
        });
        L.marker([marker.lat, marker.lng], { icon, title: marker.label, zIndexOffset: marker.kind === "rider" ? 1000 : 0 })
          .bindPopup(escapeHtml(marker.label))
          .addTo(layer);
        points.push([marker.lat, marker.lng]);
      }

      if (fittedKeyRef.current !== fitKey && points.length > 0) {
        fittedKeyRef.current = fitKey;
        if (points.length === 1) map.setView(points[0], 15);
        else map.fitBounds(L.latLngBounds(points), { padding: [36, 36], maxZoom: 16 });
      }
    };

    draw();
    const container = containerRef.current;
    container?.addEventListener("leaflet-ready", draw);
    return () => container?.removeEventListener("leaflet-ready", draw);
  }, [markers, route, fitKey]);

  return <div ref={containerRef} role="region" aria-label={ariaLabel} className={`isolate z-0 w-full overflow-hidden rounded-2xl border border-slate-200 ${className}`} />;
}
