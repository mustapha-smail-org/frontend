"use client";

import L from "leaflet";
import { MapContainer, Marker, TileLayer } from "react-leaflet";
import { useIsDark } from "@/lib/useIsDark";
import { cartoTileUrl } from "@/lib/mapTiles";

const icon = L.divIcon({ className: "paname-marker", html: '<span aria-hidden="true"></span>', iconSize: [28, 36], iconAnchor: [14, 36] });

export function EventMiniMap({ latitude, longitude }: { latitude: number; longitude: number }) {
  const dark = useIsDark();
  return (
    <MapContainer center={[latitude, longitude]} zoom={14} scrollWheelZoom={false} dragging={false} zoomControl={false} attributionControl={false} className="event-mini-map" aria-label="Emplacement de l’événement">
      <TileLayer key={dark ? "dark" : "light"} attribution="&copy; OpenStreetMap &copy; CARTO" url={cartoTileUrl(dark)} />
      <Marker position={[latitude, longitude]} icon={icon} />
    </MapContainer>
  );
}
