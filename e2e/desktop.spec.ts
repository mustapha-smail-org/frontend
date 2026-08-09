import { expect, test } from '@playwright/test'

import { stubCatalog } from './fixtures/catalog'

test.describe('Desktop split layout', () => {
  test.skip(({ isMobile }) => Boolean(isMobile), 'Desktop-only behaviour')

  test.beforeEach(async ({ page }) => {
    await stubCatalog(page)
  })

  test('shows the list and the map at the same time', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByTestId('event-list')).toBeVisible()
    await expect(page.getByRole('complementary', { name: 'Map of events' })).toBeVisible()
    await expect(page.locator('.leaflet-container')).toBeVisible()
    // No mobile view switch on desktop.
    await expect(page.getByRole('tablist', { name: 'Result view' })).toHaveCount(0)
  })

  test('flow 6 — selecting a marker identifies its list card', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('.leaflet-marker-icon').first()).toBeVisible()

    await page.locator('.leaflet-marker-icon').first().click()

    await expect(page.locator('.leaflet-popup')).toBeVisible()
    await expect(
      page.locator('.leaflet-popup').getByRole('link', { name: 'View details' })
    ).toBeVisible()
    // The corresponding card is marked as selected.
    await expect(page.locator('[data-event-id="evt-001"][data-selected="true"]')).toBeVisible()
  })

  test('flow 8 — markers advance only on an explicit action', async ({ page }) => {
    const requests: string[] = []
    await stubCatalog(page, { requestLog: requests })
    await page.goto('/')
    await expect(page.locator('.leaflet-marker-icon').first()).toBeVisible()

    await expect(page.locator('.leaflet-marker-icon')).toHaveCount(3)
    const mapCallsBefore = requests.filter((url) => url.includes('/events/map')).length

    // Give the app a moment to prove it is NOT crawling pages by itself.
    await page.waitForTimeout(1200)
    expect(requests.filter((url) => url.includes('/events/map')).length).toBe(mapCallsBefore)

    await page.getByTestId('load-more-markers').click()
    await expect(page.locator('.leaflet-marker-icon')).toHaveCount(4)
    await expect(page.getByTestId('load-more-markers')).toHaveCount(0)
  })

  test('list Load more does not advance the map cursor', async ({ page }) => {
    const requests: string[] = []
    await stubCatalog(page, { requestLog: requests })
    await page.goto('/')
    await expect(page.locator('.leaflet-marker-icon').first()).toBeVisible()

    const mapCallsBefore = requests.filter((url) => url.includes('/events/map')).length
    await page.getByTestId('load-more-events').click()
    await expect(page.getByTestId('event-list').getByRole('listitem')).toHaveCount(8)

    expect(requests.filter((url) => url.includes('/events/map')).length).toBe(mapCallsBefore)
  })

  test('the map never requests geographic bounds', async ({ page }) => {
    const requests: string[] = []
    await stubCatalog(page, { requestLog: requests })
    await page.goto('/')
    await expect(page.locator('.leaflet-marker-icon').first()).toBeVisible()

    await page.getByRole('button', { name: 'Zoom in' }).click()
    await page.waitForTimeout(600)

    for (const url of requests) {
      expect(url).not.toMatch(/[?&](north|south|east|west|bbox)=/)
    }
    // Zooming must not restart the search either.
    expect(requests.filter((url) => url.includes('/events/map')).length).toBe(1)
  })

  test('map attribution is displayed', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('.leaflet-control-attribution')).toContainText('OpenStreetMap')
  })

  test('flow 11 — discovery and detail are reachable by keyboard alone', async ({ page }) => {
    await page.goto('/?period=TODAY')
    await expect(page.getByTestId('event-list')).toBeVisible()

    const firstCardLink = page.getByRole('link', { name: 'Event number 1' })
    await firstCardLink.focus()
    await expect(firstCardLink).toBeFocused()
    await page.keyboard.press('Enter')

    const heading = page.getByRole('heading', { level: 1, name: 'Event number 1' })
    await expect(heading).toBeVisible()
    // Route change moves focus to the new page heading.
    await expect(heading).toBeFocused()

    await page.keyboard.press('Shift+Tab')
    await expect(page.getByRole('link', { name: 'Back to results' })).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('event-list')).toBeVisible()
    // The filtered search is restored, not discarded.
    await expect(page).toHaveURL(/period=TODAY/)
  })
})
