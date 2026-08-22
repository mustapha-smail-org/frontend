import { defineTheme } from "@astryxdesign/core/theme";

/**
 * Paname Spot theme for Astryx.
 * Canonical brand palette (Brand Identity Guidelines v1.0):
 *   Midnight Paris #071A33 · Paname Red #F2384A · Paris Blue #2474E5
 *   Warm White #F8F6F1 · Charcoal #15171A.
 * Accent = Paname Red, because the delivered prototype uses red for primary
 * actions/links (brand's "blue for interactive" is aspirational; we implement
 * the prototype). Dark mode uses Midnight as the principal surface (guide §40).
 * Fonts are loaded by the app via next/font (Astryx only sets the family tokens).
 * Rebuild after edits:  npx astryx theme build src/theme/paname-spot.ts
 */
export const panameSpotTheme = defineTheme({
  name: "paname-spot",

  color: { accent: ["#F2384A", "#F2384A"], neutralStyle: "warm", contrast: "standard" },

  typography: {
    scale: { base: 16, ratio: 1.2 },
    body: { family: "Inter", fallbacks: "system-ui, -apple-system, sans-serif" },
    heading: {
      family: "Space Grotesk",
      fallbacks: "Inter, system-ui, sans-serif",
      weight: "semibold",
      weights: { 1: "semibold", 2: "semibold" },
    },
  },

  radius: { base: 4, multiplier: 1.4 },

  motion: { fast: 150, medium: 400, slow: 900, ratio: 0.75 },

  tokens: {
    "--color-accent": ["#F2384A", "#F2384A"],
    "--color-on-accent": ["#FFFFFF", "#FFFFFF"],
    // Light = Warm White page / white cards; Dark = Midnight surface / lighter navy cards (no pure black).
    "--color-background-body": ["#F8F6F1", "#071A33"],
    "--color-background-surface": ["#FFFFFF", "#0C2340"],
    "--color-background-card": ["#FFFFFF", "#0C2340"],
    "--color-background-inverted": ["#071A33", "#0C2340"],
    "--color-text-primary": ["#15171A", "#F1EFE9"],
    "--color-border": ["#E7E4DC", "#1E3A5F"],
    "--focus-outline-color": "var(--color-accent)",
  },
});
