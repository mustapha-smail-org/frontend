import { expect, test } from '@playwright/test'

import { stubCatalog } from './fixtures/catalog'

test.describe('Discovery', () => {
  test.beforeEach(async ({ page }) => {
    await stubCatalog(page)
  })

  test('flow 1 — applying filters updates the URL', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('event-list')).toBeVisible()

    await page.getByRole('tab', { name: 'Today' }).click()
    await expect(page).toHaveURL(/period=TODAY/)

    const searchBox = page.getByRole('searchbox', { name: 'Search events' })
    await searchBox.fill('jazz')
    await searchBox.press('Enter')
    await expect(page).toHaveURL(/query=jazz/)

    const isDesktop = await page.getByTestId('pricing-select').isVisible()
    if (isDesktop) {
      await page.getByTestId('pricing-select').click()
      await page.getByRole('option', { name: 'Free' }).click()
      await expect(page).toHaveURL(/pricing=FREE/)

      await page.getByTestId('arrondissement-select').click()
      await page.getByRole('option', { name: '11th arrondissement' }).click()
      await expect(page).toHaveURL(/arrondissement=11/)
    } else {
      await page.getByTestId('mobile-filter-trigger').click()
      const sheet = page.getByTestId('mobile-filter-sheet')
      await expect(sheet).toBeVisible()
      await sheet.getByTestId('pricing-select').click()
      await page.getByRole('option', { name: 'Free' }).click()
      await expect(page).toHaveURL(/pricing=FREE/)
      await page.keyboard.press('Escape')
    }

    // Defaults stay out of the URL.
    await expect(page).not.toHaveURL(/period=THIS_WEEK/)
    await expect(page).not.toHaveURL(/cursor=/)
  })

  test('flow 2 — reloading a filtered URL reconstructs the controls', async ({ page }) => {
    const requests: string[] = []
    await stubCatalog(page, { requestLog: requests })

    await page.goto('/?period=TODAY&pricing=FREE&arrondissement=11&query=jazz')
    await expect(page.getByTestId('event-list')).toBeVisible()

    await expect(page.getByRole('tab', { name: 'Today' })).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByRole('searchbox', { name: 'Search events' })).toHaveValue('jazz')

    const chips = page.getByTestId('active-filter-chips')
    await expect(chips.getByText('Free')).toBeVisible()
    await expect(chips.getByText('11th arrondissement')).toBeVisible()

    const listRequest = requests.find((url) => url.includes('/api/v1/events?'))
    expect(listRequest).toContain('period=TODAY')
    expect(listRequest).toContain('pricing=FREE')
    expect(listRequest).toContain('arrondissement=11')
    expect(listRequest).toContain('query=jazz')
    expect(listRequest).toContain('sort=START_DATE')
  })

  test('flow 3 — Load more appends without duplicating', async ({ page }) => {
    await page.goto('/')
    const list = page.getByTestId('event-list')
    await expect(list.getByRole('listitem')).toHaveCount(5)

    await page.getByTestId('load-more-events').click()

    // Page two repeats evt-005: 5 + 4 items yields 8 unique cards, not 9.
    await expect(list.getByRole('listitem')).toHaveCount(8)
    await expect(page.getByText('Event number 5', { exact: true })).toHaveCount(1)
    await expect(page.getByTestId('load-more-events')).toHaveCount(0)
    // No total count and no numbered pagination anywhere.
    await expect(page.getByRole('navigation', { name: /pagination/i })).toHaveCount(0)
  })

  test('flow 4 & 5 — detail opens directly and returns to preserved results', async ({ page }) => {
    await page.goto('/?period=TODAY&pricing=FREE')
    await expect(page.getByTestId('event-list')).toBeVisible()

    await page.getByRole('link', { name: 'Event number 1' }).click()

    await expect(page.getByRole('heading', { level: 1, name: 'Event number 1' })).toBeVisible()
    await expect(page).toHaveURL(/\/events\/evt-001$/)
    await expect(page).toHaveTitle(/Event number 1/)
    await expect(page.getByText('From €28')).toBeVisible()
    await expect(page.getByRole('link', { name: /Buy tickets/ })).toHaveAttribute(
      'rel',
      'noopener noreferrer'
    )

    // Maps links point at the configured provider (Google by default).
    await expect(page.getByTestId('open-in-maps')).toHaveAttribute('href', /google\.com\/maps/)
    await expect(page.getByTestId('location-maps-link')).toHaveAttribute(
      'href',
      /google\.com\/maps/
    )

    await page.getByRole('link', { name: 'Back to results' }).click()
    await expect(page).toHaveURL(/period=TODAY&pricing=FREE/)
    await expect(page.getByTestId('event-list')).toBeVisible()
  })

  test('renders description and price HTML without executing any of it', async ({ page }) => {
    await page.goto('/events/evt-001')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    const description = page.getByTestId('event-description')
    // Real markup is honoured.
    await expect(description.locator('strong')).toHaveText('description')
    await expect(description.getByRole('link', { name: 'our partner' })).toHaveAttribute(
      'href',
      'https://example.org/tickets'
    )
    await expect(page.getByTestId('pricing-detail').locator('strong')).toHaveText('€28')

    // The hostile fragments are gone, not escaped into visible tag soup.
    await expect(description.locator('img')).toHaveCount(0)
    await expect(description.locator('script')).toHaveCount(0)
    await expect(description).not.toContainText('<img')
    await expect(description).not.toContainText('window.__pwned')

    expect(
      await page.evaluate(() => (window as never as Record<string, unknown>).__pwned)
    ).toBeUndefined()
  })

  test('flattens summary HTML on the list instead of showing tag soup', async ({ page }) => {
    await page.goto('/')
    const firstCard = page.getByTestId('event-list').getByRole('listitem').first()
    await expect(firstCard).toBeVisible()

    await expect(firstCard).toContainText('Summary for event 1.')
    // No markup leaks through, and the dangling truncated tag is cleaned up.
    await expect(firstCard).not.toContainText('<p>')
    await expect(firstCard).not.toContainText('href')
    await expect(firstCard).not.toContainText('window.__pwned')
    await expect(firstCard.locator('script')).toHaveCount(0)

    expect(
      await page.evaluate(() => (window as never as Record<string, unknown>).__pwned)
    ).toBeUndefined()
  })

  test('flow 5 — a shared detail URL loads on its own', async ({ page }) => {
    await page.goto('/events/evt-001')
    await expect(page.getByRole('heading', { level: 1, name: 'Event number 1' })).toBeVisible()
    // Falls back to discovery when there is no router state to restore.
    await expect(page.getByRole('link', { name: 'Back to discovery' })).toHaveAttribute('href', '/')
  })

  test('an unknown event id renders the unavailable page', async ({ page }) => {
    await page.goto('/events/does-not-exist')
    await expect(page.getByRole('heading', { name: 'Event unavailable' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Browse all events' })).toBeVisible()
  })

  test('flow 9 — an empty result set recovers when a filter is reset', async ({ page }) => {
    await stubCatalog(page, { emptyList: true })
    await page.goto('/?pricing=FREE&query=nothing')

    await expect(page.getByTestId('empty-results')).toBeVisible()
    await expect(page.getByText('No events found')).toBeVisible()

    await stubCatalog(page)
    await page.getByRole('button', { name: 'Clear the search text' }).click()
    await expect(page.getByTestId('event-list')).toBeVisible()
  })

  test('flow 10 — a temporary 503 recovers automatically', async ({ page }) => {
    await stubCatalog(page, { failListUntil: 1 })
    await page.goto('/')
    await expect(page.getByTestId('event-list')).toBeVisible({ timeout: 20_000 })
  })

  test('browser Back and Forward restore filter state', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('event-list')).toBeVisible()

    await page.getByRole('tab', { name: 'Today' }).click()
    await expect(page).toHaveURL(/period=TODAY/)

    await page.goBack()
    await expect(page).not.toHaveURL(/period=TODAY/)
    await expect(page.getByRole('tab', { name: 'This week' })).toHaveAttribute(
      'aria-selected',
      'true'
    )

    await page.goForward()
    await expect(page.getByRole('tab', { name: 'Today' })).toHaveAttribute('aria-selected', 'true')
  })

  test('an unknown route renders the not-found page', async ({ page }) => {
    await page.goto('/nope')
    await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible()
  })

  test('no authentication or account surface exists', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('event-list')).toBeVisible()

    for (const label of [/sign in/i, /log in/i, /saved/i, /favourites/i, /profile/i]) {
      await expect(page.getByRole('link', { name: label })).toHaveCount(0)
      await expect(page.getByRole('button', { name: label })).toHaveCount(0)
    }
  })

  test('the page never scrolls horizontally', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('event-list')).toBeVisible()

    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
    )
    expect(overflows).toBe(false)
  })
})
