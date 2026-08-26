import { describe, expect, it } from "vitest";
import { displayCategory, environmentLabel, highlightFlag, moodLabel, energyLabel } from "@/lib/enrichmentLabels";
import type { EventEnrichment, EventSummary } from "@/lib/types";

function enrichment(over: Partial<EventEnrichment> = {}): EventEnrichment {
  return {
    categories: [], moodAffinities: [], socialContexts: [], semanticTags: [],
    energyLevel: null, environmentFallback: null,
    uniquenessScore: null, qualityScore: null, rankScore: null, ...over,
  };
}
function event(over: Partial<EventSummary> = {}): EventSummary {
  return {
    id: "id", slug: "s", title: "t", summary: null, categories: ["Expo"],
    pricing: "PAID", arrondissement: null, venue: null, officialUrl: null,
    imageUrl: null, imageAlt: null, imageCredit: null, sourceUpdatedAt: null,
    environment: "UNKNOWN", enrichment: null,
    startAt: null, endAt: null, displayStartAt: null, displayEndAt: null,
    ongoing: false, scheduleLabel: null, ...over,
  };
}

describe("enrichmentLabels", () => {
  it("maps ids to French labels", () => {
    expect(moodLabel("CONTEMPLATIF")).toBe("Contemplatif");
    expect(energyLabel("CALME")).toBe("Calme");
    expect(energyLabel(null)).toBeNull();
    expect(environmentLabel("OUTDOOR")).toBe("Extérieur");
    expect(environmentLabel("UNKNOWN")).toBeNull();
  });

  it("prefers the normalized category, falls back to raw", () => {
    expect(displayCategory(event({ enrichment: enrichment({ categories: ["EXPOSITION"] }) }))).toBe("Expo");
    expect(displayCategory(event({ categories: ["Danse"], enrichment: null }))).toBe("Danse");
  });

  it("flags only exceptional events, quality first", () => {
    expect(highlightFlag(event())).toBeNull();
    expect(highlightFlag(event({ enrichment: enrichment({ qualityScore: 60, uniquenessScore: 60 }) }))).toBeNull();
    expect(highlightFlag(event({ enrichment: enrichment({ uniquenessScore: 90 }) }))).toEqual({ label: "Insolite", kind: "unique" });
    expect(highlightFlag(event({ enrichment: enrichment({ qualityScore: 88, uniquenessScore: 90 }) }))).toEqual({ label: "Incontournable", kind: "quality" });
  });
});
