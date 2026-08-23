import { describe, expect, it } from "vitest";
import {
  arrondissementLabel,
  discoveryApiParams,
  discoveryUrlParams,
  hasActiveFilters,
  parisTodayISO,
  readDiscoveryFilters,
  splitPopular,
  toSearchOptions,
  toSearchParams,
  type DiscoveryFilters,
} from "@/lib/discoveryFilters";

const base: DiscoveryFilters = {
  query: "", date: "", preset: "", categories: [], arrondissements: [], pricing: "",
};

describe("readDiscoveryFilters", () => {
  it("reads repeated cat/zone params and single-valued fields", () => {
    const params = new URLSearchParams("q=jazz&periode=TODAY&cat=Concerts&cat=Expos&zone=1&zone=OUTSIDE_PARIS&prix=FREE");
    expect(readDiscoveryFilters(params)).toEqual({
      query: "jazz", date: "", preset: "TODAY",
      categories: ["Concerts", "Expos"], arrondissements: ["1", "OUTSIDE_PARIS"], pricing: "FREE",
    });
  });
  it("lets a specific date supersede a preset", () => {
    const params = new URLSearchParams("date=2026-08-25&periode=THIS_WEEK");
    const filters = readDiscoveryFilters(params);
    expect(filters.date).toBe("2026-08-25");
    expect(filters.preset).toBe("");
  });
});

describe("toSearchParams", () => {
  it("expands array record values into repeated params", () => {
    const params = toSearchParams({ cat: ["A", "B"], q: "x", missing: undefined });
    expect(params.getAll("cat")).toEqual(["A", "B"]);
    expect(params.get("q")).toBe("x");
    expect(params.has("missing")).toBe(false);
  });
});

describe("discoveryUrlParams", () => {
  it("serializes active filters and prefers date over preset", () => {
    const params = discoveryUrlParams({ ...base, query: " jazz ", date: "2026-08-25", preset: "TODAY", categories: ["Concerts"], arrondissements: ["1"], pricing: "PAID" });
    expect(params.get("q")).toBe("jazz");
    expect(params.get("date")).toBe("2026-08-25");
    expect(params.has("periode")).toBe(false);
    expect(params.getAll("cat")).toEqual(["Concerts"]);
    expect(params.getAll("zone")).toEqual(["1"]);
    expect(params.get("prix")).toBe("PAID");
  });
  it("falls back to the preset when no date is set", () => {
    const params = discoveryUrlParams({ ...base, preset: "THIS_WEEK" });
    expect(params.get("periode")).toBe("THIS_WEEK");
    expect(params.has("date")).toBe(false);
  });
});

describe("discoveryApiParams", () => {
  it("emits catalog params with repeated categories/arrondissements and default limit 50", () => {
    const params = discoveryApiParams({ ...base, date: "2026-08-25", categories: ["Concerts", "Expos"], arrondissements: ["1", "OUTSIDE_PARIS"], pricing: "FREE" }, "cur");
    expect(params.get("limit")).toBe("50");
    expect(params.get("date")).toBe("2026-08-25");
    expect(params.has("period")).toBe(false);
    expect(params.getAll("categories")).toEqual(["Concerts", "Expos"]);
    expect(params.getAll("arrondissements")).toEqual(["1", "OUTSIDE_PARIS"]);
    expect(params.get("pricing")).toBe("FREE");
    expect(params.get("cursor")).toBe("cur");
  });
  it("emits period when only a preset is set", () => {
    const params = discoveryApiParams({ ...base, preset: "TODAY" });
    expect(params.get("period")).toBe("TODAY");
    expect(params.has("date")).toBe(false);
    expect(params.has("cursor")).toBe(false);
  });
});

describe("toSearchOptions", () => {
  it("nulls the period when a date is present", () => {
    expect(toSearchOptions({ ...base, date: "2026-08-25", preset: "TODAY" }, 50)).toMatchObject({ date: "2026-08-25", period: undefined, limit: 50 });
  });
  it("passes the preset as period when there is no date", () => {
    expect(toSearchOptions({ ...base, preset: "THIS_WEEK" })).toMatchObject({ period: "THIS_WEEK", date: undefined });
  });
});

describe("hasActiveFilters", () => {
  it("is false for empty filters and true once anything is set", () => {
    expect(hasActiveFilters(base)).toBe(false);
    expect(hasActiveFilters({ ...base, categories: ["Concerts"] })).toBe(true);
    expect(hasActiveFilters({ ...base, query: "  " })).toBe(false);
    expect(hasActiveFilters({ ...base, pricing: "FREE" })).toBe(true);
  });
});

describe("arrondissementLabel", () => {
  it("labels arrondissements, outside, and unknown", () => {
    expect(arrondissementLabel("1")).toBe("1er");
    expect(arrondissementLabel("2")).toBe("2e");
    expect(arrondissementLabel("20")).toBe("20e");
    expect(arrondissementLabel("OUTSIDE_PARIS")).toBe("Hors Paris");
    expect(arrondissementLabel("UNKNOWN")).toBe("Non précisé");
  });
});

describe("splitPopular", () => {
  const facets = [1, 2, 3, 4, 5, 6, 7].map((n) => ({ value: String(n), count: 10 - n }));
  it("splits into the top N and the remainder", () => {
    const { popular, rest } = splitPopular(facets, 5);
    expect(popular.map((f) => f.value)).toEqual(["1", "2", "3", "4", "5"]);
    expect(rest.map((f) => f.value)).toEqual(["6", "7"]);
  });
  it("keeps everything popular when the list is short", () => {
    expect(splitPopular(facets.slice(0, 3), 5)).toEqual({ popular: facets.slice(0, 3), rest: [] });
  });
});

describe("parisTodayISO", () => {
  it("returns the Paris calendar date as yyyy-mm-dd", () => {
    // 2026-08-25T00:30Z is already 02:30 in Paris (CEST) → same calendar day.
    expect(parisTodayISO(new Date("2026-08-25T00:30:00Z"))).toBe("2026-08-25");
    // 23:30Z on the 24th is 01:30 on the 25th in Paris.
    expect(parisTodayISO(new Date("2026-08-24T23:30:00Z"))).toBe("2026-08-25");
  });
});
