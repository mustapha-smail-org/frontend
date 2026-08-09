/**
 * The single category-to-token mapping point (PRD 7.4).
 *
 * Feature components must never hardcode a category colour. Categories arrive
 * from the backend and are not a closed set, so an unknown value deterministically
 * falls back into one of the accent slots rather than to a random colour.
 */

const ACCENT_SLOTS = ['a', 'b', 'c', 'd', 'e', 'f'] as const

/** Inline custom properties consumed by the `category` badge variant. */
export type CategoryAccentStyle = React.CSSProperties &
  Record<'--cp-accent' | '--cp-accent-subtle', string>

export interface CategoryAccent {
  style: CategoryAccentStyle
}

const NEUTRAL: CategoryAccent = {
  style: {
    '--cp-accent': 'var(--category-neutral)',
    '--cp-accent-subtle': 'var(--category-neutral-subtle)',
  },
}

/** Small, stable, order-independent hash. */
function hash(value: string): number {
  let result = 0
  for (let index = 0; index < value.length; index += 1) {
    result = (result * 31 + value.charCodeAt(index)) >>> 0
  }
  return result
}

export function getCategoryAccent(category: string | null | undefined): CategoryAccent {
  if (!category || category.trim() === '') return NEUTRAL

  const slot = ACCENT_SLOTS[hash(category.trim().toLowerCase()) % ACCENT_SLOTS.length]
  if (!slot) return NEUTRAL

  return {
    style: {
      '--cp-accent': `var(--category-${slot})`,
      '--cp-accent-subtle': `var(--category-${slot}-subtle)`,
    },
  }
}

export const NEUTRAL_CATEGORY_ACCENT = NEUTRAL
