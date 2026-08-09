import { vi } from 'vitest'

import { DESKTOP_QUERY } from '@/shared/hooks/use-media-query'

/**
 * jsdom reports `matches: false` for every media query, so components always
 * render their mobile branch. This lets a test opt into the desktop layout.
 */
export function setViewport(viewport: 'mobile' | 'desktop'): void {
  vi.spyOn(window, 'matchMedia').mockImplementation((query: string) => {
    const matches = viewport === 'desktop' && query === DESKTOP_QUERY
    return {
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    } as unknown as MediaQueryList
  })
}
