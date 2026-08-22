"use client";
import dynamic from "next/dynamic";
import type { EventMapMarker } from "@/lib/types";
const Map = dynamic(() => import("@/components/DiscoveryMap").then((m) => m.DiscoveryMap), { ssr:false, loading:() => <div className="map-loading">Chargement de la carte</div> });
export function HomeMapPreview({ markers }: { markers: EventMapMarker[] }) { return <Map markers={markers}/>; }
