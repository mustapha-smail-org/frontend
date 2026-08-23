import type { Metadata } from "next";
import { DiscoveryExperience } from "@/components/DiscoveryExperience";
import { getCategories, getEvents, getMapEvents } from "@/lib/api";
import type { CursorPage, EventMapMarker, EventPeriod, EventSummary } from "@/lib/types";

export const metadata: Metadata = { title: "Découvrir les sorties à Paris", description: "Recherchez les concerts, expositions, spectacles et sorties à Paris par date, catégorie, prix et quartier.", alternates: { canonical: "/decouvrir" } };
type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function DiscoverPage({ searchParams }: Props) {
  const params = await searchParams;
  const options = { query: typeof params.q === "string" ? params.q : undefined, period: typeof params.periode === "string" ? params.periode as EventPeriod : undefined, category: typeof params.categorie === "string" ? params.categorie : undefined, pricing: params.gratuit === "1" ? "FREE" as const : undefined };
  let events: CursorPage<EventSummary> = { items: [], nextCursor: null, hasNext: false }; let map: CursorPage<EventMapMarker> = { items: [], nextCursor: null, hasNext: false }; let categories: string[] = []; let initialError = false;
  try { [events, map, categories] = await Promise.all([getEvents({ ...options, limit: 50 }), getMapEvents({ ...options, limit: 18 }), getCategories()]); } catch { initialError = true; }
  return <><section className="discover-title shell-pad"><div className="mx-auto max-w-[88rem]"><p className="eyebrow">Explorer Paris</p><h1>Qu’est-ce qui vous<br/><em>fait sortir ?</em></h1></div></section><DiscoveryExperience initialEvents={events} initialMap={map} categories={categories} initialError={initialError}/></>;
}
