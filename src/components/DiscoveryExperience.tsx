"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";
import { List, LoaderCircle, Map, Search } from "lucide-react";
import { EventCard } from "@/components/EventCard";
import { FilterBar } from "@/components/filters/FilterBar";
import {
  discoveryApiParams,
  discoveryUrlParams,
  EMPTY_DISCOVERY_FILTERS,
  type DiscoveryFilters,
} from "@/lib/discoveryFilters";
import type { CursorPage, EventFacets, EventMapMarker, EventSummary } from "@/lib/types";

const DiscoveryMap = dynamic(() => import("@/components/DiscoveryMap").then((module) => module.DiscoveryMap), { ssr: false, loading: () => <div className="map-loading"><LoaderCircle className="animate-spin"/><span>Chargement de la carte</span></div> });
type View = "list" | "map";

export function DiscoveryExperience({ initialEvents, initialMap, initialFacets, initialFilters, initialError = false }: { initialEvents: CursorPage<EventSummary>; initialMap: CursorPage<EventMapMarker>; initialFacets: EventFacets; initialFilters: DiscoveryFilters; initialError?: boolean }) {
  const router = useRouter();
  const [query, setQuery] = useState(initialFilters.query);
  const [date, setDate] = useState(initialFilters.date);
  const [preset, setPreset] = useState(initialFilters.preset);
  const [categories, setCategories] = useState(initialFilters.categories);
  const [arrondissements, setArrondissements] = useState(initialFilters.arrondissements);
  const [pricing, setPricing] = useState(initialFilters.pricing);
  const [facets, setFacets] = useState(initialFacets);
  const [view, setView] = useState<View>("list");
  const [events, setEvents] = useState(initialEvents); const [markers, setMarkers] = useState(initialMap.items);
  const [mapCursor, setMapCursor] = useState(initialMap.nextCursor); const [mapHasNext, setMapHasNext] = useState(initialMap.hasNext);
  const [error, setError] = useState(initialError); const [selectedId, setSelectedId] = useState<string | null>(null); const [isPending, startTransition] = useTransition();

  function filters(): DiscoveryFilters { return { query, date, preset, categories, arrondissements, pricing }; }
  async function refresh(next = filters()) {
    setError(false);
    const params = discoveryApiParams(next);
    // Start list, map and facets together, but only make the (fast) list block
    // the UI — markers and facets land independently and never fail the list.
    const markersPromise = fetch(`/api/events/map?${params}`)
      .then((response) => (response.ok ? (response.json() as Promise<CursorPage<EventMapMarker>>) : null))
      .catch(() => null);
    const facetsPromise = fetch(`/api/events/facets?${discoveryApiParams(next)}`)
      .then((response) => (response.ok ? (response.json() as Promise<EventFacets>) : null))
      .catch(() => null);
    try {
      const eventResponse = await fetch(`/api/events?${params}`);
      if (!eventResponse.ok) throw new Error("api");
      setEvents(await eventResponse.json() as CursorPage<EventSummary>);
      const url = discoveryUrlParams(next);
      router.replace(`/decouvrir${url.size ? `?${url}` : ""}`, { scroll: false });
    } catch { setError(true); return; }
    const nextMarkers = await markersPromise;
    if (nextMarkers) { setMarkers(nextMarkers.items); setMapCursor(nextMarkers.nextCursor); setMapHasNext(nextMarkers.hasNext); }
    const nextFacets = await facetsPromise;
    if (nextFacets) setFacets(nextFacets);
  }
  function submit(event: FormEvent) { event.preventDefault(); startTransition(() => { void refresh(); }); }
  function changeFilter(next: Partial<DiscoveryFilters>) {
    const values = { ...filters(), ...next };
    if (next.query !== undefined) setQuery(next.query);
    if (next.date !== undefined) setDate(next.date);
    if (next.preset !== undefined) setPreset(next.preset);
    if (next.categories !== undefined) setCategories(next.categories);
    if (next.arrondissements !== undefined) setArrondissements(next.arrondissements);
    if (next.pricing !== undefined) setPricing(next.pricing);
    startTransition(() => { void refresh(values); });
  }
  function reset() {
    setQuery("");
    changeFilter({ ...EMPTY_DISCOVERY_FILTERS });
  }
  async function loadMore() {
    const wantList = Boolean(events.nextCursor); const wantMap = mapHasNext && Boolean(mapCursor);
    if (!wantList && !wantMap) return;
    // List and map paginate independently (the map endpoint returns only
    // geolocated events), so advance each by its own cursor and append both.
    const [listResponse, mapResponse] = await Promise.all([
      wantList ? fetch(`/api/events?${discoveryApiParams(filters(), events.nextCursor!)}`) : null,
      wantMap ? fetch(`/api/events/map?${discoveryApiParams(filters(), mapCursor!)}`).catch(() => null) : null,
    ]);
    if (wantList) {
      if (!listResponse!.ok) { setError(true); return; }
      const page = await listResponse!.json() as CursorPage<EventSummary>;
      setEvents({ ...page, items: [...events.items, ...page.items] });
    }
    if (wantMap && mapResponse?.ok) {
      const page = await mapResponse.json() as CursorPage<EventMapMarker>;
      setMarkers((current) => [...current, ...page.items]); setMapCursor(page.nextCursor); setMapHasNext(page.hasNext);
    }
  }
  return (
    <div className="discover-experience">
      <div className="discover-tools shell-pad">
        <form onSubmit={submit} className="discover-search"><Search aria-hidden="true"/><label className="sr-only" htmlFor="event-search">Rechercher</label><input id="event-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Expo, concert, quartier…"/><button type="submit">Rechercher</button></form>
        <FilterBar filters={filters()} facets={facets} onChange={changeFilter} onReset={reset}/>
      </div>
      <div className="view-switch" aria-label="Mode d’affichage"><button data-active={view === "list"} onClick={() => setView("list")}><List size={17}/>Liste</button><button data-active={view === "map"} onClick={() => setView("map")}><Map size={17}/>Carte</button></div>
      <div className={`discover-results view-${view}`} aria-busy={isPending}>
        <section className="discover-list" aria-label="Résultats"><div className="result-heading"><p><strong>{events.items.length}</strong> sorties affichées</p>{isPending && <LoaderCircle className="animate-spin" size={18}/>}</div>
          {error ? <div className="inline-error"><strong>Impossible de charger les sorties.</strong><button onClick={() => void refresh()}>Réessayer</button></div> : events.items.length ? <div className="compact-list">{events.items.map((event) => <div key={event.id} data-selected={selectedId === event.id} onMouseEnter={() => setSelectedId(event.id)} onMouseLeave={() => setSelectedId(null)}><EventCard event={event} compact /></div>)}</div> : <div className="inline-error"><strong>Aucune sortie trouvée.</strong><span>Modifiez les filtres pour élargir la recherche.</span></div>}
          {events.hasNext && <button className="load-more" onClick={() => void loadMore()}>Afficher plus de sorties</button>}
        </section>
        <section className="discover-map-wrap" aria-label="Carte des résultats"><DiscoveryMap markers={markers} selectedId={selectedId} onSelect={setSelectedId}/>{mapHasNext && <button className="map-load-more" onClick={() => void loadMore()}>Afficher plus de lieux</button>}</section>
      </div>
    </div>
  );
}
