import type { Metadata } from "next";
import { DiscoveryExperience } from "@/components/DiscoveryExperience";
import { getEvents, getFacets, getMapEvents } from "@/lib/api";
import { readDiscoveryFilters, toSearchOptions, toSearchParams } from "@/lib/discoveryFilters";
import type { CursorPage, EventFacets, EventMapMarker, EventSummary } from "@/lib/types";

export const metadata: Metadata = { title: "Découvrir les sorties à Paris", description: "Recherchez les concerts, expositions, spectacles et sorties à Paris par date, catégorie, prix et quartier.", alternates: { canonical: "/decouvrir" } };
type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function DiscoverPage({ searchParams }: Props) {
  const params = await searchParams;
  const filters = readDiscoveryFilters(toSearchParams(params));
  const options = toSearchOptions(filters);
  let events: CursorPage<EventSummary> = { items: [], nextCursor: null, hasNext: false }; let map: CursorPage<EventMapMarker> = { items: [], nextCursor: null, hasNext: false }; let facets: EventFacets = { categories: [], arrondissements: [] }; let initialError = false;
  try { [events, map, facets] = await Promise.all([getEvents({ ...options, sort: "RELEVANCE", limit: 50 }), getMapEvents({ ...options, sort: "RELEVANCE", limit: 18 }), getFacets(options)]); } catch { initialError = true; }
  return <><section className="discover-title shell-pad"><div className="mx-auto max-w-[88rem]"><p className="eyebrow">Explorer Paris</p><h1>Qu’est-ce qui vous<br/><em>fait sortir ?</em></h1></div></section><DiscoveryExperience initialEvents={events} initialMap={map} initialFacets={facets} initialFilters={filters} initialError={initialError}/></>;
}
