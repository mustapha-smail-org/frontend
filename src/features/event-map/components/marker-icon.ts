import L from 'leaflet'

import type { PricingCategory } from '@/shared/api/types'

/**
 * Lightweight inline-SVG markers (PRD 14.2) — no image requests, and no
 * dependency on Leaflet's default icon assets, which break under bundlers.
 */

const FILL: Record<PricingCategory, string> = {
  FREE: 'var(--free)',
  PAID: 'var(--paid)',
  NOT_SPECIFIED: 'var(--unspecified)',
}

function svg(fill: string, selected: boolean): string {
  const scale = selected ? 1.18 : 1
  return `
    <svg width="${26 * scale}" height="${34 * scale}" viewBox="0 0 26 34" xmlns="http://www.w3.org/2000/svg" style="filter:drop-shadow(0 2px 3px rgba(20,20,30,.35));transition:transform 160ms ease">
      <path d="M13 33.2C13 33.2 25 20.9 25 13A12 12 0 1 0 1 13c0 7.9 12 20.2 12 20.2Z" fill="${fill}" stroke="white" stroke-width="${selected ? 2.6 : 2}"/>
      <circle cx="13" cy="13" r="${selected ? 4.6 : 4}" fill="white"/>
    </svg>
  `
}

export function createMarkerIcon(pricing: PricingCategory, selected: boolean): L.DivIcon {
  const scale = selected ? 1.18 : 1
  return L.divIcon({
    className: 'cp-marker',
    html: svg(FILL[pricing], selected),
    iconSize: [26 * scale, 34 * scale],
    iconAnchor: [13 * scale, 33 * scale],
    popupAnchor: [0, -30 * scale],
  })
}
