import type { EventSummary } from "@/lib/types";

const RAIL_SIZE = 8;
const HIGH_SCORE = 65;

const parisHourFormat = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit", hourCycle: "h23", timeZone: "Europe/Paris",
});
const parisDateFormat = new Intl.DateTimeFormat("en-CA", {
  year: "numeric", month: "2-digit", day: "2-digit", timeZone: "Europe/Paris",
});

function parisHour(iso: string | null): number | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  const digits = parisHourFormat.format(date).match(/\d+/);
  return digits ? Number(digits[0]) : null;
}

function parisDate(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : parisDateFormat.format(date);
}

/** Today's date (Europe/Paris) as YYYY-MM-DD — inject for deterministic tests. */
export function parisToday(now: Date = new Date()): string {
  return parisDateFormat.format(now);
}

export interface TodayRails {
  incontournables: EventSummary[];
  gratuit: EventSummary[];
  ceSoir: EventSummary[];
  pleinAir: EventSummary[];
  date: EventSummary[];
  dernierJour: EventSummary[];
  insolite: EventSummary[];
}

function byScoreDesc(pick: (e: EventSummary) => number | null | undefined) {
  return (a: EventSummary, b: EventSummary) => (pick(b) ?? 0) - (pick(a) ?? 0);
}

/**
 * Slices today's events into editorial rails. Enrichment-backed rails
 * (incontournables, date, insolite) quietly skip unenriched events; the
 * rule-based rails work off Track A/B fields alone, so the page degrades
 * gracefully while enrichment backfills.
 */
export function buildTodayRails(events: EventSummary[], today: string): TodayRails {
  const incontournables = events
    .filter((e) => (e.enrichment?.qualityScore ?? 0) >= HIGH_SCORE)
    .sort(byScoreDesc((e) => e.enrichment?.qualityScore))
    .slice(0, RAIL_SIZE);

  const insolite = events
    .filter((e) => (e.enrichment?.uniquenessScore ?? 0) >= HIGH_SCORE)
    .sort(byScoreDesc((e) => e.enrichment?.uniquenessScore))
    .slice(0, RAIL_SIZE);

  const date = events
    .filter((e) => e.enrichment != null && (
      e.enrichment.socialContexts.includes("COUPLE") ||
      e.enrichment.moodAffinities.includes("ROMANTIQUE")))
    .slice(0, RAIL_SIZE);

  const gratuit = events.filter((e) => e.pricing === "FREE").slice(0, RAIL_SIZE);
  const pleinAir = events.filter((e) => e.environment === "OUTDOOR").slice(0, RAIL_SIZE);
  const ceSoir = events
    .filter((e) => { const h = parisHour(e.displayStartAt); return h != null && h >= 17; })
    .slice(0, RAIL_SIZE);
  const dernierJour = events
    .filter((e) => e.endAt != null && parisDate(e.endAt) === today)
    .slice(0, RAIL_SIZE);

  return { incontournables, gratuit, ceSoir, pleinAir, date, dernierJour, insolite };
}
