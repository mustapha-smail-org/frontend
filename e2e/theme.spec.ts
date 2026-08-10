import { expect, test } from '@playwright/test'

import { stubCatalog } from './fixtures/catalog'
import { luminanceOf } from './fixtures/colour'

test.describe('Dark mode', () => {
  test.beforeEach(async ({ page }) => {
    await stubCatalog(page)
  })

  test('follows the OS preference by default', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.goto('/')
    await expect(page.getByTestId('event-list')).toBeVisible()

    await expect(page.locator('html')).toHaveClass(/dark/)

    await page.emulateMedia({ colorScheme: 'light' })
    await page.goto('/')
    await expect(page.locator('html')).not.toHaveClass(/dark/)
  })

  test('the toggle reflects the system theme before it is touched', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.goto('/')
    await expect(page.getByTestId('event-list')).toBeVisible()

    const toggle = page.getByTestId('theme-toggle')
    await expect(toggle).toHaveRole('switch')
    await expect(toggle).toBeChecked()
  })

  test('an explicit choice overrides the OS and survives a reload', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' })
    await page.goto('/')
    await expect(page.getByTestId('event-list')).toBeVisible()

    await page.getByTestId('theme-toggle').click()
    await expect(page.locator('html')).toHaveClass(/dark/)

    await page.reload()
    await expect(page.locator('html')).toHaveClass(/dark/)
    // The OS still says light; the explicit choice wins.
    await expect(page.getByTestId('theme-toggle')).toBeChecked()
  })

  test('the toggle works from the keyboard', async ({ page, isMobile }) => {
    test.skip(Boolean(isMobile), 'Keyboard interaction')
    await page.emulateMedia({ colorScheme: 'light' })
    await page.goto('/')
    await expect(page.getByTestId('event-list')).toBeVisible()

    await page.getByTestId('theme-toggle').focus()
    await page.keyboard.press('Space')
    await expect(page.locator('html')).toHaveClass(/dark/)
  })

  test('applies before first paint, with no light flash', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' })
    await page.goto('/')
    await page.getByTestId('theme-toggle').click()
    await expect(page.locator('html')).toHaveClass(/dark/)

    /*
     * Re-navigate and read the class as early as the document exists. The
     * inline boot script in index.html must already have run, before React
     * has had any chance to hydrate.
     */
    await page.goto('/', { waitUntil: 'commit' })
    const classAtCommit = await page.evaluate(() => document.documentElement.className)
    expect(classAtCommit).toContain('dark')
  })

  test('the theme is not part of the shareable URL', async ({ page }) => {
    await page.goto('/?pricing=FREE')
    await expect(page.getByTestId('event-list')).toBeVisible()

    await page.getByTestId('theme-toggle').click()
    await expect(page.locator('html')).toHaveClass(/dark/)

    expect(page.url()).not.toContain('theme')
    await expect(page).toHaveURL(/pricing=FREE/)
  })

  test('dark surfaces are actually dark, not just class-flipped', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.goto('/')
    await expect(page.getByTestId('event-list')).toBeVisible()

    expect(await luminanceOf(page, 'body')).toBeLessThan(0.1)
    // Cards must be distinguishable from the page, but still dark.
    const cardLuminance = await luminanceOf(page, '[data-event-id]')
    expect(cardLuminance).toBeLessThan(0.15)
    // Body text must be light against them.
    expect(await luminanceOf(page, 'body', 'color')).toBeGreaterThan(0.7)
  })

  test('the map renders in dark mode', async ({ page, isMobile }) => {
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.goto('/')
    await expect(page.getByTestId('event-list')).toBeVisible()

    if (isMobile) {
      await page.getByRole('tab', { name: 'Map' }).click()
    }

    await expect(page.locator('.leaflet-container')).toBeVisible()
    await expect(page.locator('.leaflet-marker-icon').first()).toBeVisible()
  })

  /*
   * Regression guard. leaflet.css ships in the lazily loaded map chunk, so it is
   * appended after globals.css and its single-class rules beat equally specific
   * overrides. That left the marker popup white with white text in dark mode.
   * This asserts real contrast, not merely that a class is present.
   */
  test('the marker popup card is readable in dark mode', async ({ page, isMobile }) => {
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.goto('/')
    await expect(page.getByTestId('event-list')).toBeVisible()

    if (isMobile) {
      await page.getByRole('tab', { name: 'Map' }).click()
    }

    await page.locator('.leaflet-marker-icon').first().click()
    const popup = page.locator('.leaflet-popup-content-wrapper')
    await expect(popup).toBeVisible()

    const contrast = await popup.evaluate((wrapper) => {
      const heading = wrapper.querySelector('h3')
      if (!heading) return null

      /*
       * Computed colours come back in the authored colour space — these tokens
       * are oklch() — so parse by painting each colour onto a canvas and
       * reading the sRGB pixel the browser produces.
       */
      const canvas = document.createElement('canvas')
      canvas.width = 1
      canvas.height = 1
      const context = canvas.getContext('2d')
      if (!context) return null

      const toRgb = (color: string) => {
        context.clearRect(0, 0, 1, 1)
        context.fillStyle = color
        context.fillRect(0, 0, 1, 1)
        const [r = 0, g = 0, b = 0] = context.getImageData(0, 0, 1, 1).data
        return { r, g, b }
      }

      const relativeLuminance = ({ r, g, b }: { r: number; g: number; b: number }) => {
        const channel = (raw: number) => {
          const c = raw / 255
          return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
        }
        return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
      }

      const backgroundLuminance = relativeLuminance(
        toRgb(getComputedStyle(wrapper).backgroundColor)
      )
      const textLuminance = relativeLuminance(toRgb(getComputedStyle(heading).color))
      const [lighter, darker] = [backgroundLuminance, textLuminance].sort((a, b) => b - a) as [
        number,
        number,
      ]

      return { ratio: (lighter + 0.05) / (darker + 0.05), backgroundLuminance }
    })

    expect(contrast).not.toBeNull()
    // The popup surface must actually be dark, not Leaflet's default white...
    expect(contrast!.backgroundLuminance).toBeLessThan(0.3)
    // ...and the title must clear WCAG AA for normal text.
    expect(contrast!.ratio).toBeGreaterThanOrEqual(4.5)
  })
})

test.describe('Skip link', () => {
  test.skip(({ isMobile }) => Boolean(isMobile), 'Keyboard-only affordance')

  test.beforeEach(async ({ page }) => {
    await stubCatalog(page)
  })

  test('is hidden until focused, then jumps to the results', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('event-list')).toBeVisible()

    const skipLink = page.getByRole('link', { name: 'Skip to results' })

    // Present for assistive tech, but not visible on the page.
    const boxBefore = await skipLink.boundingBox()
    expect(boxBefore?.width ?? 0).toBeLessThanOrEqual(2)

    await page.keyboard.press('Tab')
    await expect(skipLink).toBeFocused()

    const boxAfter = await skipLink.boundingBox()
    expect(boxAfter?.width ?? 0).toBeGreaterThan(40)

    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/#main-content$/)
  })
})
