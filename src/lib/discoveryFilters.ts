import type { EventPeriod, EventSearchOptions, Facet, PricingCategory } from "@/lib/types";

/**
 * Client-side filter state for the discovery page. `date` and `preset` are
 * mutually exclusive (a specific calendar date wins over a named period), and
 * `pricing` is single-valued ("" means show both free and paid).
 */
export interface DiscoveryFilters {
  query: string;
  date: string; // ISO yyyy-mm-dd
  preset: string; // "" | TODAY | TOMORROW | THIS_WEEK
  categories: string[];
  arrondissements: string[];
  pricing: string; // "" | FREE | PAID
}

export const EMPTY_DISCOVERY_FILTERS: DiscoveryFilters = {
  query: "", date: "", preset: "", categories: [], arrondissements: [], pricing: "",
};

/** Turn a plain SSR searchParams record into a URLSearchParams for uniform reading. */
export function toSearchParams(record: Record<string, string | string[] | undefined>): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(record)) {
    if (Array.isArray(value)) value.forEach((item) => params.append(key, item));
    else if (value != null) params.set(key, value);
  }
  return params;
}

/** Read discovery filters from the page's URL params (`q`, `date`, `periode`, `cat`, `zone`, `prix`). */
export function readDiscoveryFilters(params: URLSearchParams): DiscoveryFilters {
  const date = params.get("date") ?? "";
  return {
    query: params.get("q") ?? "",
    date,
    // A specific date supersedes a named period.
    preset: date ? "" : params.get("periode") ?? "",
    categories: params.getAll("cat"),
    arrondissements: params.getAll("zone"),
    pricing: params.get("prix") ?? "",
  };
}

/** Build the shareable URL params (`/decouvrir?...`) for the current filters. */
export function discoveryUrlParams(filters: DiscoveryFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.query.trim()) params.set("q", filters.query.trim());
  if (filters.date) params.set("date", filters.date);
  else if (filters.preset) params.set("periode", filters.preset);
  for (const category of filters.categories) params.append("cat", category);
  for (const arrondissement of filters.arrondissements) params.append("zone", arrondissement);
  if (filters.pricing) params.set("prix", filters.pricing);
  return params;
}

/** Build the catalog API query params for a list/map fetch. */
export function discoveryApiParams(filters: DiscoveryFilters, cursor?: string, limit = 50): URLSearchParams {
  const params = new URLSearchParams({ sort: "START_DATE", limit: String(limit) });
  if (filters.query.trim()) params.set("query", filters.query.trim());
  if (filters.date) params.set("date", filters.date);
  else if (filters.preset) params.set("period", filters.preset);
  for (const category of filters.categories) params.append("categories", category);
  for (const arrondissement of filters.arrondissements) params.append("arrondissements", arrondissement);
  if (filters.pricing) params.set("pricing", filters.pricing);
  if (cursor) params.set("cursor", cursor);
  return params;
}

/** Map filters to the typed options accepted by the server-side api helpers. */
export function toSearchOptions(filters: DiscoveryFilters, limit?: number): EventSearchOptions {
  return {
    query: filters.query.trim() || undefined,
    date: filters.date || undefined,
    period: filters.date ? undefined : ((filters.preset as EventPeriod) || undefined),
    categories: filters.categories,
    arrondissements: filters.arrondissements,
    pricing: (filters.pricing as PricingCategory) || undefined,
    limit,
  };
}

/** True when any filter (search or facet) is active. */
export function hasActiveFilters(filters: DiscoveryFilters): boolean {
  return Boolean(
    filters.query.trim() || filters.date || filters.preset || filters.pricing ||
    filters.categories.length || filters.arrondissements.length,
  );
}

/** Human label for a `where` facet value: "1er", "2e"…"20e", "Hors Paris", "Non précisé". */
export function arrondissementLabel(value: string): string {
  if (value === "OUTSIDE_PARIS") return "Hors Paris";
  if (value === "UNKNOWN") return "Non précisé";
  const n = Number(value);
  return n === 1 ? "1er" : `${n}e`;
}

/** Split a facet list into the N most-populous "popular" options and the rest. */
export function splitPopular(options: Facet[], popularCount: number): { popular: Facet[]; rest: Facet[] } {
  if (popularCount <= 0 || options.length <= popularCount) return { popular: options, rest: [] };
  return { popular: options.slice(0, popularCount), rest: options.slice(popularCount) };
}

/** Today's date in the Europe/Paris calendar as an ISO yyyy-mm-dd string (min for the picker). */
export function parisTodayISO(now: Date = new Date()): string {
  // en-CA yields yyyy-mm-dd; the timeZone pins it to Paris regardless of the visitor's clock.
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(now);
}
