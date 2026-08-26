import type { EventSummary } from "@/lib/types";

/** Normalized category id → French display label. */
const CATEGORY_LABELS: Record<string, string> = {
  CONCERT: "Concert", CLUBBING: "Clubbing", THEATRE: "Théâtre", DANSE: "Danse",
  SPECTACLE: "Spectacle", CINEMA: "Cinéma", EXPOSITION: "Expo", FESTIVAL: "Festival",
  ATELIER: "Atelier", CONFERENCE: "Conférence", LITTERATURE: "Littérature",
  GASTRONOMIE: "Gastronomie", MARCHE: "Marché", SPORT: "Sport", BIEN_ETRE: "Bien-être",
  VISITE: "Visite", JEUNE_PUBLIC: "Jeune public", NATURE: "Nature",
};

const MOOD_LABELS: Record<string, string> = {
  FESTIF: "Festif", ROMANTIQUE: "Romantique", CHILL: "Chill", CULTUREL: "Culturel",
  CONVIVIAL: "Convivial", CONTEMPLATIF: "Contemplatif", UNDERGROUND: "Underground",
  CHIC: "Chic", DECOUVERTE: "Découverte",
};

const ENERGY_LABELS: Record<string, string> = {
  CALME: "Calme", MODERE: "Modéré", INTENSE: "Intense",
};

export function moodLabel(id: string): string { return MOOD_LABELS[id] ?? id; }
export function energyLabel(id: string | null): string | null { return id ? ENERGY_LABELS[id] ?? id : null; }

/** Indoor/outdoor label, or null when unknown (nothing to show). */
export function environmentLabel(value: string | null | undefined): string | null {
  if (value === "INDOOR") return "Intérieur";
  if (value === "OUTDOOR") return "Extérieur";
  return null;
}

/**
 * Card category: the AI-normalized one (nicer, controlled) mapped to French,
 * falling back to the raw source category while an event is unenriched.
 */
export function displayCategory(event: EventSummary): string | undefined {
  const normalized = event.enrichment?.categories?.[0];
  if (normalized && CATEGORY_LABELS[normalized]) return CATEGORY_LABELS[normalized];
  return event.categories[0];
}

export type HighlightFlag = { label: string; kind: "quality" | "unique" };

/**
 * A rare, subtle standout flag for a card — only for genuinely exceptional
 * events (top score band, ≥85) so it stays meaningful. Quality wins over
 * uniqueness when both qualify.
 */
export function highlightFlag(event: EventSummary): HighlightFlag | null {
  const e = event.enrichment;
  if (!e) return null;
  if ((e.qualityScore ?? 0) >= 85) return { label: "Incontournable", kind: "quality" };
  if ((e.uniquenessScore ?? 0) >= 85) return { label: "Insolite", kind: "unique" };
  return null;
}
