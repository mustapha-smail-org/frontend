import { describe, expect, it } from "vitest";
import { buildTodayRails } from "@/lib/todayRails";
import type { EventEnrichment, EventSummary } from "@/lib/types";

const TODAY = "2026-08-26";

function enrichment(over: Partial<EventEnrichment> = {}): EventEnrichment {
  return {
    categories: [], moodAffinities: [], socialContexts: [], semanticTags: [],
    energyLevel: null, environmentFallback: null,
    uniquenessScore: null, qualityScore: null, rankScore: null, ...over,
  };
}

function event(over: Partial<EventSummary> = {}): EventSummary {
  return {
    id: "id", slug: "slug", title: "t", summary: null, categories: [],
    pricing: "PAID", arrondissement: null, venue: null, officialUrl: null,
    imageUrl: null, imageAlt: null, imageCredit: null, sourceUpdatedAt: null,
    environment: "UNKNOWN", enrichment: null,
    startAt: null, endAt: null, displayStartAt: null, displayEndAt: null,
    ongoing: false, scheduleLabel: null, ...over,
  };
}

describe("buildTodayRails", () => {
  it("fills rule-based rails from Track A/B fields", () => {
    const events = [
      event({ id: "free", pricing: "FREE" }),
      event({ id: "outdoor", environment: "OUTDOOR" }),
      event({ id: "evening", displayStartAt: "2026-08-26T21:00:00+02:00" }),
      event({ id: "morning", displayStartAt: "2026-08-26T09:00:00+02:00" }),
      event({ id: "lastday", endAt: "2026-08-26T20:00:00+02:00" }),
      event({ id: "ongoing", endAt: "2026-09-10T20:00:00+02:00" }),
    ];
    const rails = buildTodayRails(events, TODAY);
    expect(rails.gratuit.map((e) => e.id)).toEqual(["free"]);
    expect(rails.pleinAir.map((e) => e.id)).toEqual(["outdoor"]);
    expect(rails.ceSoir.map((e) => e.id)).toEqual(["evening"]);
    expect(rails.dernierJour.map((e) => e.id)).toEqual(["lastday"]);
  });

  it("ranks enrichment rails by score and skips unenriched events", () => {
    const events = [
      event({ id: "plain" }),
      event({ id: "good", enrichment: enrichment({ qualityScore: 90, uniquenessScore: 40 }) }),
      event({ id: "great", enrichment: enrichment({ qualityScore: 70, uniquenessScore: 95 }) }),
      event({ id: "meh", enrichment: enrichment({ qualityScore: 50, uniquenessScore: 50 }) }),
    ];
    const rails = buildTodayRails(events, TODAY);
    // incontournables: quality >= 65, sorted desc -> good(90), great(70)
    expect(rails.incontournables.map((e) => e.id)).toEqual(["good", "great"]);
    // insolite: uniqueness >= 65 -> great(95)
    expect(rails.insolite.map((e) => e.id)).toEqual(["great"]);
  });

  it("selects date-fit events by social context or romantic mood", () => {
    const events = [
      event({ id: "couple", enrichment: enrichment({ socialContexts: ["COUPLE"] }) }),
      event({ id: "romantic", enrichment: enrichment({ moodAffinities: ["ROMANTIQUE"] }) }),
      event({ id: "friends", enrichment: enrichment({ socialContexts: ["ENTRE_AMIS"] }) }),
      event({ id: "bare" }),
    ];
    const rails = buildTodayRails(events, TODAY);
    expect(rails.date.map((e) => e.id).sort()).toEqual(["couple", "romantic"]);
  });
});
