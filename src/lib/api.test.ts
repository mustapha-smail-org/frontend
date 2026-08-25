import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ApiError,
  eventSearchParams,
  getCategories,
  getEventBySlug,
  getEvents,
  getFacets,
  getFeedback,
  getMapEvents,
  getReports,
  reportEvent,
  submitFeedback,
} from "@/lib/api";

function jsonResponse(body: unknown, ok = true, status = 200) {
  return { ok, status, json: async () => body, text: async () => JSON.stringify(body) } as Response;
}

describe("eventSearchParams", () => {
  it("omits an all-period default and serializes active filters", () => {
    const params = eventSearchParams({ query: "  jazz  ", category: "Concert", pricing: "FREE", cursor: "next", limit: 18 });
    expect(params.get("period")).toBeNull(); expect(params.get("query")).toBe("jazz");
    expect(params.get("category")).toBe("Concert"); expect(params.get("pricing")).toBe("FREE"); expect(params.get("cursor")).toBe("next");
  });
  it("keeps a period and drops the ALL pricing sentinel", () => {
    const params = eventSearchParams({ period: "TODAY", pricing: "ALL" });
    expect(params.get("period")).toBe("TODAY"); expect(params.get("pricing")).toBeNull(); expect(params.get("limit")).toBe("12");
  });
  it("appends repeated category/arrondissement params and a specific date", () => {
    const params = eventSearchParams({ date: "2026-08-25", categories: ["Concerts", "Expositions"], arrondissements: ["1", "OUTSIDE_PARIS"], pricing: "PAID" });
    expect(params.get("date")).toBe("2026-08-25");
    expect(params.getAll("categories")).toEqual(["Concerts", "Expositions"]);
    expect(params.getAll("arrondissements")).toEqual(["1", "OUTSIDE_PARIS"]);
    expect(params.get("pricing")).toBe("PAID");
  });
});

describe("catalog fetch helpers", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
  afterEach(() => vi.unstubAllGlobals());

  it("parses a validated page and defaults the map limit to 100", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue(jsonResponse({ items: [], nextCursor: null, hasNext: false }));
    await expect(getMapEvents()).resolves.toEqual({ items: [], nextCursor: null, hasNext: false });
    expect(fetchMock.mock.calls[0][0]).toContain("limit=100");
  });
  it("returns the categories array", async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(["Concert", "Expo"]));
    await expect(getCategories()).resolves.toEqual(["Concert", "Expo"]);
  });
  it("parses validated facet counts and targets the facets endpoint", async () => {
    const fetchMock = vi.mocked(fetch);
    const facets = { categories: [{ value: "Concerts", count: 3 }], arrondissements: [{ value: "1", count: 2 }] };
    fetchMock.mockResolvedValue(jsonResponse(facets));
    await expect(getFacets({ categories: ["Concerts"] })).resolves.toEqual(facets);
    expect(fetchMock.mock.calls[0][0]).toContain("/api/v1/events/facets");
    expect(fetchMock.mock.calls[0][0]).toContain("categories=Concerts");
  });
  it("throws ApiError on a non-ok response, tagged with the status", async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse({}, false, 503));
    await expect(getEvents({ query: "x" })).rejects.toBeInstanceOf(ApiError);
    await expect(getEventBySlug("fête de la musique")).rejects.toMatchObject({ status: 503 });
  });
});

describe("BFF post helpers", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
  afterEach(() => vi.unstubAllGlobals());

  it("posts feedback to the same-origin BFF route", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue(jsonResponse({ id: "1", status: "RECEIVED" }));
    await expect(submitFeedback({ type: "BUG", message: "hi" })).resolves.toEqual({ id: "1", status: "RECEIVED" });
    expect(fetchMock.mock.calls[0][0]).toBe("/api/feedback");
  });
  it("throws ApiError when a report is rejected", async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse({}, false, 400));
    await expect(reportEvent("some-slug", { type: "WRONG_INFO" })).rejects.toBeInstanceOf(ApiError);
  });
});

describe("admin read helpers", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
  afterEach(() => vi.unstubAllGlobals());

  it("sends the admin token header and parses a feedback page", async () => {
    const fetchMock = vi.mocked(fetch);
    const page = { items: [{ id: "1", type: "BUG", message: "hi", email: null, status: "OPEN", createdAt: null, processedAt: null, internalNote: null }], nextCursor: null, hasNext: false };
    fetchMock.mockResolvedValue(jsonResponse(page));
    await expect(getFeedback("s3cret", 2)).resolves.toEqual(page);
    expect(fetchMock.mock.calls[0][0]).toBe("/api/admin/feedback?page=2");
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ headers: { "x-admin-token": "s3cret" } });
  });
  it("targets the reports route", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue(jsonResponse({ items: [], nextCursor: null, hasNext: false }));
    await getReports("s3cret");
    expect(fetchMock.mock.calls[0][0]).toBe("/api/admin/reports?page=0");
  });
  it("throws ApiError tagged with 401 on an invalid token", async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse({}, false, 401));
    await expect(getFeedback("wrong")).rejects.toMatchObject({ status: 401 });
  });
});
