import type { CursorPage, EventDetail, EventFacets, EventMapMarker, EventReport, EventSearchOptions, EventSummary, FeedbackSubmission } from "@/lib/types";
import type { z } from "zod";
import { categoriesSchema, eventDetailSchema, eventFacetsSchema, eventMapPageSchema, eventReportPageSchema, eventSummaryPageSchema, feedbackPageSchema } from "@/lib/contracts";

export const serverApiBase = process.env.CITYPULSE_API_BASE_URL ?? "http://localhost:8080";

export class ApiError extends Error {
  constructor(public readonly status: number, path: string) {
    super(`API ${path} returned ${status}`);
  }
}

export function eventSearchParams(options: EventSearchOptions = {}) {
  const params = new URLSearchParams();
  params.set("sort", options.sort ?? "START_DATE");
  params.set("limit", String(options.limit ?? 12));
  if (options.period) params.set("period", options.period);
  if (options.date) params.set("date", options.date);
  if (options.query?.trim()) params.set("query", options.query.trim());
  if (options.category) params.set("category", options.category);
  for (const category of options.categories ?? []) params.append("categories", category);
  for (const arrondissement of options.arrondissements ?? []) params.append("arrondissements", arrondissement);
  if (options.pricing && options.pricing !== "ALL") params.set("pricing", options.pricing);
  if (options.cursor) params.set("cursor", options.cursor);
  return params;
}

async function getJson<T>(path: string, schema: z.ZodType<T>): Promise<T> {
  const response = await fetch(`${serverApiBase}${path}`, {
    headers: { Accept: "application/json" },
    next: { revalidate: 60 },
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) throw new ApiError(response.status, path);
  return schema.parse(await response.json());
}

export function getEvents(options: EventSearchOptions = {}) {
  return getJson<CursorPage<EventSummary>>(`/api/v1/events?${eventSearchParams(options)}`, eventSummaryPageSchema);
}
export function getMapEvents(options: EventSearchOptions = {}) {
  return getJson<CursorPage<EventMapMarker>>(`/api/v1/events/map?${eventSearchParams({ ...options, limit: options.limit ?? 100 })}`, eventMapPageSchema);
}
export function getCategories() { return getJson<string[]>("/api/v1/categories", categoriesSchema); }
export function getFacets(options: EventSearchOptions = {}) {
  return getJson<EventFacets>(`/api/v1/events/facets?${eventSearchParams(options)}`, eventFacetsSchema);
}
export function getEventBySlug(slug: string) {
  return getJson<EventDetail>(`/api/v1/events/slug/${encodeURIComponent(slug)}`, eventDetailSchema);
}

async function postJson<T>(path: string, payload: unknown) {
  const response = await fetch(path, {
    method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) throw new ApiError(response.status, path);
  return (await response.json()) as T;
}
export function submitFeedback(payload: { type: string; message: string; email?: string }) {
  return postJson<{ id: string; status: string }>("/api/feedback", payload);
}
export function reportEvent(slug: string, payload: { type: string; message?: string; email?: string }) {
  return postJson<{ id: string; status: string }>(`/api/events/${encodeURIComponent(slug)}/reports`, payload);
}

// Admin read path: fetched client-side through the BFF proxy, which validates
// the shared secret and forwards it to the catalog service.
async function getAdminJson<T>(path: string, token: string, schema: z.ZodType<T>): Promise<T> {
  const response = await fetch(path, {
    headers: { Accept: "application/json", "x-admin-token": token },
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) throw new ApiError(response.status, path);
  return schema.parse(await response.json());
}
export function getFeedback(token: string, page = 0) {
  return getAdminJson<CursorPage<FeedbackSubmission>>(`/api/admin/feedback?page=${page}`, token, feedbackPageSchema);
}
export function getReports(token: string, page = 0) {
  return getAdminJson<CursorPage<EventReport>>(`/api/admin/reports?page=${page}`, token, eventReportPageSchema);
}
