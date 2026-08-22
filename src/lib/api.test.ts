import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ApiError,
  eventSearchParams,
  getCategories,
  getEventBySlug,
  getEvents,
  getMapEvents,
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
