import { expect, test } from '@playwright/test'

import { stubCatalog } from './fixtures/catalog'

test.describe('Mobile list/map toggle', () => {
  test.skip(({ isMobile }) => !isMobile, 'Mobile-only behaviour')

  test.beforeEach(async ({ page }) => {
    await stubCatalog(page)
  })

  test('flow 7 — filters and view state survive toggling', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('event-list')).toBeVisible()

    // Defaults to List on first visit.
    await expect(page.getByRole('tab', { name: 'List' })).toHaveAttribute('aria-selected', 'true')

    // Apply a filter through the bottom sheet.
    const trigger = page.getByTestId('mobile-filter-trigger')
    await trigger.click()
    const sheet = page.getByTestId('mobile-filter-sheet')
    await expect(sheet).toBeVisible()

    await sheet.getByTestId('pricing-select').click()
    await page.getByRole('option', { name: 'Free' }).click()
    await sheet.getByRole('button', { name: 'Show results' }).click()
    await expect(sheet).toBeHidden()

    // Focus returns to the trigger when the sheet closes.
    await expect(trigger).toBeFocused()
    await expect(page).toHaveURL(/pricing=FREE/)

    // Switch to the map and back; filters and results survive.
    await page.getByRole('tab', { name: 'Map' }).click()
    await expect(page.locator('.leaflet-container')).toBeVisible()
    await expect(page).toHaveURL(/pricing=FREE/)

    await page.getByRole('tab', { name: 'List' }).click()
    await expect(page.getByTestId('event-list')).toBeVisible()
    await expect(page.getByTestId('active-filter-chips').getByText('Free')).toBeVisible()
  })

  test('the map bundle is not requested until Map is opened', async ({ page }) => {
    const scripts: string[] = []
    page.on('request', (request) => {
      if (request.resourceType() === 'script') scripts.push(request.url())
    })

    await page.goto('/')
    await expect(page.getByTestId('event-list')).toBeVisible()
    await page.waitForTimeout(600)

    expect(scripts.some((url) => /map-vendor/.test(url))).toBe(false)

    await page.getByRole('tab', { name: 'Map' }).click()
    await expect(page.locator('.leaflet-container')).toBeVisible()
    expect(scripts.some((url) => /map-vendor/.test(url))).toBe(true)
  })

  test('the sheet traps focus while open', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('event-list')).toBeVisible()

    await page.getByTestId('mobile-filter-trigger').click()
    const sheet = page.getByTestId('mobile-filter-sheet')
    await expect(sheet).toBeVisible()

    /*
     * Tabbing must never reach the page behind the sheet. The dialog's own
     * focus sentinels sit just outside the content element, so assert on
     * background content rather than on strict containment.
     */
    for (let index = 0; index < 8; index += 1) {
      await page.keyboard.press('Tab')
      const escaped = await page.evaluate(() => {
        const active = document.activeElement
        if (!active || active === document.body) return false
        return Boolean(
          active.closest('header') ??
          active.closest('[aria-label="Search and filters"]') ??
          active.closest('[data-testid="event-list"]')
        )
      })
      expect(escaped).toBe(false)
    }

    await page.keyboard.press('Escape')
    await expect(sheet).toBeHidden()
  })

  test('the chosen view is remembered across reloads but not in the URL', async ({ page }) => {
    await page.goto('/?pricing=FREE')
    await page.getByRole('tab', { name: 'Map' }).click()
    await expect(page.locator('.leaflet-container')).toBeVisible()

    const url = page.url()
    expect(url).not.toContain('view=')

    await page.reload()
    await expect(page.getByRole('tab', { name: 'Map' })).toHaveAttribute('aria-selected', 'true')
    // The shared URL still means the same search.
    await expect(page).toHaveURL(/pricing=FREE/)
  })

  test('touch targets on the primary controls are large enough', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('event-list')).toBeVisible()

    for (const locator of [
      page.getByTestId('mobile-filter-trigger'),
      page.getByRole('tab', { name: 'List' }),
      page.getByRole('tab', { name: 'Map' }),
      page.getByTestId('load-more-events'),
    ]) {
      const box = await locator.boundingBox()
      expect(box).not.toBeNull()
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(36)
    }
  })
})
