"use client";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";

const driverIcon = L.divIcon({
  className: "",
  html: `<div style="
    width: 34px; height: 34px; border-radius: 9999px;
    background: #1d4ed8; border: 3px solid white;
    box-shadow: 0 4px 10px rgba(15,23,42,0.35);
    display: flex; align-items: center; justify-content: center;
    color: white; font-size: 16px;
  ">🚚</div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 17],
});

export default function LeafletMap({
  lat,
  lng,
  label,
}: {
  lat: number;
  lng: number;
  label: string;
}) {
  return (
    <MapContainer center={[lat, lng]} zoom={14} scrollWheelZoom={false} className="h-full w-full">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[lat, lng]} icon={driverIcon}>
        <Popup>{label}</Popup>
      </Marker>
    </MapContainer>
  );
}
