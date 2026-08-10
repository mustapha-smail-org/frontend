import type { Page } from '@playwright/test'

/**
 * Colour measurement helper for the theme assertions.
 *
 * `getComputedStyle` returns colours in the space they were authored in, and
 * the CityPulse tokens are `oklch()`. Pulling the first three numbers out of
 * that string yields nonsense, so the colour is painted onto a 1x1 canvas and
 * read back as sRGB — letting the browser do the conversion.
 */
export async function luminanceOf(
  page: Page,
  selector: string,
  property: 'backgroundColor' | 'color' = 'backgroundColor'
): Promise<number | null> {
  return page.evaluate(
    ({ selector: target, property: prop }) => {
      const element = document.querySelector(target)
      if (!element) return null

      const canvas = document.createElement('canvas')
      canvas.width = 1
      canvas.height = 1
      const context = canvas.getContext('2d')
      if (!context) return null

      context.clearRect(0, 0, 1, 1)
      context.fillStyle = getComputedStyle(element)[prop]
      context.fillRect(0, 0, 1, 1)
      const [r = 0, g = 0, b = 0] = context.getImageData(0, 0, 1, 1).data

      const channel = (raw: number) => {
        const c = raw / 255
        return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
      }
      return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
    },
    { selector, property }
  )
}
