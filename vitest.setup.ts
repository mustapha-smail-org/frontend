import '@testing-library/jest-dom/vitest'

import { onlineManager } from '@tanstack/react-query'
import { cleanup } from '@testing-library/react'
import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest'

import { server } from './src/test/msw/server'

/**
 * jsdom shims. These are deliberately plain functions rather than `vi.fn()`:
 * a test calling `vi.restoreAllMocks()` must not be able to blank them and
 * poison every subsequent test in the file.
 */
function installBrowserShims(): void {
  window.matchMedia = function matchMedia(query: string): MediaQueryList {
    return {
      matches: false,
      media: query,
      onchange: null,
      addListener() {},
      removeListener() {},
      addEventListener() {},
      removeEventListener() {},
      dispatchEvent() {
        return false
      },
    } as unknown as MediaQueryList
  }

  window.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  Element.prototype.scrollIntoView = function scrollIntoView() {}
  Element.prototype.scrollTo = function scrollTo() {}
  Element.prototype.hasPointerCapture = function hasPointerCapture() {
    return false
  }
  Element.prototype.setPointerCapture = function setPointerCapture() {}
  Element.prototype.releasePointerCapture = function releasePointerCapture() {}
}

// Vaul reads `transform` off computed style and calls `.match` on it; jsdom
// returns an empty string, so substitute the CSS initial value.
const realGetComputedStyle = window.getComputedStyle.bind(window)
window.getComputedStyle = function getComputedStyle(element: Element, pseudo?: string | null) {
  const style = realGetComputedStyle(element, pseudo ?? undefined)
  if (!style.transform) {
    Object.defineProperty(style, 'transform', { value: 'none', configurable: true })
  }
  return style
} as typeof window.getComputedStyle

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' })
})

beforeEach(() => {
  installBrowserShims()
})

afterEach(() => {
  cleanup()
  server.resetHandlers()
  server.events.removeAllListeners()
  // A test that simulates going offline flips TanStack Query's global
  // onlineManager, which would otherwise pause every query in later tests.
  onlineManager.setOnline(true)
})

afterAll(() => {
  server.close()
})
