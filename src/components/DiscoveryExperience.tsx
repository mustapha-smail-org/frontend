"use client";

import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";
import { List, LoaderCircle, Map, Search, SlidersHorizontal, X } from "lucide-react";
import { EventCard } from "@/components/EventCard";
import type { CursorPage, EventMapMarker, EventSummary } from "@/lib/types";

const DiscoveryMap = dynamic(() => import("@/components/DiscoveryMap").then((module) => module.DiscoveryMap), { ssr: false, loading: () => <div className="map-loading"><LoaderCircle className="animate-spin"/><span>Chargement de la carte</span></div> });
type View = "list" | "map";

function apiParams(filters: { query: string; period: string; category: string; free: boolean }, cursor?: string) {
  const params = new URLSearchParams({ sort: "START_DATE", limit: "18" });
  if (filters.query.trim()) params.set("query", filters.query.trim());
  if (filters.period) params.set("period", filters.period);
  if (filters.category) params.set("category", filters.category);
  if (filters.free) params.set("pricing", "FREE");
  if (cursor) params.set("cursor", cursor);
  return params;
}

export function DiscoveryExperience({ initialEvents, initialMap, categories, initialError = false }: { initialEvents: CursorPage<EventSummary>; initialMap: CursorPage<EventMapMarker>; categories: string[]; initialError?: boolean }) {
  const searchParams = useSearchParams(); const router = useRouter();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [period, setPeriod] = useState(searchParams.get("periode") ?? "");
  const [category, setCategory] = useState(searchParams.get("categorie") ?? "");
  const [free, setFree] = useState(searchParams.get("gratuit") === "1");
  const [view, setView] = useState<View>("list");
  const [events, setEvents] = useState(initialEvents); const [markers, setMarkers] = useState(initialMap.items);
  const [mapCursor, setMapCursor] = useState(initialMap.nextCursor); const [mapHasNext, setMapHasNext] = useState(initialMap.hasNext);
  const [error, setError] = useState(initialError); const [selectedId, setSelectedId] = useState<string | null>(null); const [isPending, startTransition] = useTransition();

  function filters() { return { query, period, category, free }; }
  async function refresh(next = filters()) {
    setError(false);
    const params = apiParams(next);
    // Same filters + limit as the list so the map tracks it. Start both, but
    // don't make the (fast) list wait on the map query — filters should feel
    // instant. Markers land independently; a map failure never blocks the list.
    const markersPromise = fetch(`/api/events/map?${params}`)
      .then((response) => (response.ok ? (response.json() as Promise<CursorPage<EventMapMarker>>) : null))
      .catch(() => null);
    try {
      const eventResponse = await fetch(`/api/events?${params}`);
      if (!eventResponse.ok) throw new Error("api");
      setEvents(await eventResponse.json() as CursorPage<EventSummary>);
      const url = new URLSearchParams();
      if (next.query.trim()) url.set("q", next.query.trim()); if (next.period) url.set("periode", next.period);
      if (next.category) url.set("categorie", next.category); if (next.free) url.set("gratuit", "1");
      router.replace(`/decouvrir${url.size ? `?${url}` : ""}`, { scroll: false });
    } catch { setError(true); return; }
    const nextMarkers = await markersPromise;
    if (nextMarkers) { setMarkers(nextMarkers.items); setMapCursor(nextMarkers.nextCursor); setMapHasNext(nextMarkers.hasNext); }
  }
  function submit(event: FormEvent) { event.preventDefault(); startTransition(() => { void refresh(); }); }
  function changeFilter(next: Partial<ReturnType<typeof filters>>) {
    const values = { ...filters(), ...next };
    if (next.period !== undefined) setPeriod(next.period); if (next.category !== undefined) setCategory(next.category); if (next.free !== undefined) setFree(next.free);
    startTransition(() => { void refresh(values); });
  }
  async function loadMore() {
    const wantList = Boolean(events.nextCursor); const wantMap = mapHasNext && Boolean(mapCursor);
    if (!wantList && !wantMap) return;
    // List and map paginate independently (the map endpoint returns only
    // geolocated events), so advance each by its own cursor and append both.
    const [listResponse, mapResponse] = await Promise.all([
      wantList ? fetch(`/api/events?${apiParams(filters(), events.nextCursor!)}`) : null,
      wantMap ? fetch(`/api/events/map?${apiParams(filters(), mapCursor!)}`).catch(() => null) : null,
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
        <div className="filter-row" aria-label="Filtres">
          <span className="filter-label"><SlidersHorizontal size={16}/>Filtres</span>
          {[{ label: "Tout", value: "" }, { label: "Aujourd’hui", value: "TODAY" }, { label: "Cette semaine", value: "THIS_WEEK" }, { label: "Ce mois", value: "THIS_MONTH" }].map((item) => <button key={item.label} data-active={period === item.value} onClick={() => changeFilter({ period: item.value })}>{item.label}</button>)}
          <select aria-label="Catégorie" value={category} onChange={(e) => changeFilter({ category: e.target.value })}><option value="">Toutes les catégories</option>{categories.map((item) => <option key={item}>{item}</option>)}</select>
          <button data-active={free} onClick={() => changeFilter({ free: !free })}>Gratuit</button>
          {(period || category || free || query) && <button className="reset-filter" onClick={() => { setQuery(""); changeFilter({ query: "", period: "", category: "", free: false }); }}><X size={15}/>Effacer</button>}
        </div>
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
