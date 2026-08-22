"use client";

import Link from "next/link";
import L from "leaflet";
import { useEffect } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import type { EventMapMarker } from "@/lib/types";
import { arrondissementLabel, formatSchedule, priceLabel } from "@/lib/format";
import { useIsDark } from "@/lib/useIsDark";
import { cartoTileUrl } from "@/lib/mapTiles";

const markerIcon = L.divIcon({ className: "paname-marker", html: '<span aria-hidden="true"></span>', iconSize: [28, 36], iconAnchor: [14, 36], popupAnchor: [0, -34] });
const selectedIcon = L.divIcon({ className: "paname-marker selected", html: '<span aria-hidden="true"></span>', iconSize: [34, 42], iconAnchor: [17, 42], popupAnchor: [0, -40] });

export function DiscoveryMap({ markers, selectedId, onSelect }: { markers: EventMapMarker[]; selectedId?: string | null; onSelect?: (id: string | null) => void }) {
  const dark = useIsDark();
  return (
    <MapContainer center={[48.8566, 2.3522]} zoom={12} minZoom={10} scrollWheelZoom className="discovery-map" aria-label="Carte des événements parisiens">
      <TileLayer key={dark ? "dark" : "light"} attribution='&copy; OpenStreetMap &copy; CARTO' url={cartoTileUrl(dark)} />
      <MapResize />
      {markers.map((event) => (
        <Marker key={event.id} position={[event.latitude, event.longitude]} icon={selectedId === event.id ? selectedIcon : markerIcon} eventHandlers={{ mouseover: () => onSelect?.(event.id), mouseout: () => onSelect?.(null), click: () => onSelect?.(event.id) }}>
          <Popup><div className="map-popup"><p>{event.category || "Sortie"} · {priceLabel(event.pricing)}</p><strong>{event.title}</strong><span>{formatSchedule(event)}</span><span>{arrondissementLabel(event.arrondissement)}</span><Link href={`/events/${event.slug}`}>Voir l’événement</Link></div></Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

function MapResize() {
  const map = useMap();
  useEffect(() => {
    const container = map.getContainer();
    const observer = new ResizeObserver(() => map.invalidateSize({ animate: false }));
    observer.observe(container);
    map.invalidateSize({ animate: false });
    return () => observer.disconnect();
  }, [map]);
  return null;
}
