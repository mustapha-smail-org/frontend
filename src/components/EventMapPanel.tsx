"use client";

import dynamic from "next/dynamic";
const Map = dynamic(() => import("@/components/EventMiniMap").then((m) => m.EventMiniMap), { ssr: false, loading: () => <div className="event-mini-map map-loading">Chargement de la carte</div> });
export function EventMapPanel(props: { latitude: number; longitude: number }) { return <Map {...props}/>; }
