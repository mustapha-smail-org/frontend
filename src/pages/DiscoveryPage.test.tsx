import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { AppRoutes } from '@/app/router'
import { createQueryClient } from '@/app/query-client'
import { errorHandlers, flakyListHandler } from '@/test/msw/handlers'
import { server } from '@/test/msw/server'
import { renderWithProviders } from '@/test/render'
import { setViewport } from '@/test/viewport'

/**
 * Integration coverage for discovery (PRD 17.3). jsdom reports no matches for
 * any media query, so these render the mobile/list-first layout — the desktop
 * split is covered by the Playwright suite.
 */

function renderDiscovery(route = '/') {
  return renderWithProviders(<AppRoutes />, { route })
}

async function waitForList() {
  return waitFor(() => expect(screen.getByTestId('event-list')).toBeInTheDocument(), {
    timeout: 4000,
  })
}

describe('DiscoveryPage', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('renders the first page of results without an account', async () => {
    renderDiscovery()
    await waitForList()

    expect(screen.getByText('Jazz at Le Bataclan')).toBeInTheDocument()
    expect(screen.getByText('Free open-air cinema')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /sign in|log in/i })).not.toBeInTheDocument()
  })

  it('shows skeletons before results arrive', () => {
    renderDiscovery()
    expect(screen.getByTestId('event-list-skeleton')).toBeInTheDocument()
  })

  it('never displays a total result count', async () => {
    renderDiscovery()
    await waitForList()
    expect(screen.queryByText(/\d+\s+results?\b/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: /pagination/i })).not.toBeInTheDocument()
  })

  it('appends the next page and de-duplicates repeated ids', async () => {
    const user = userEvent.setup()
    renderDiscovery()
    await waitForList()

    await user.click(screen.getByTestId('load-more-events'))

    await waitFor(() => {
      expect(screen.getByText('Exposition photographique')).toBeInTheDocument()
    })

    // evt-003 appears in both fixture pages but must render exactly once.
    expect(screen.getAllByText('Atelier céramique')).toHaveLength(1)
    expect(within(screen.getByTestId('event-list')).getAllByRole('listitem')).toHaveLength(4)
    expect(screen.queryByTestId('load-more-events')).not.toBeInTheDocument()
  })

  it('writes committed filters to the URL and resets pagination', async () => {
    const user = userEvent.setup()
    renderDiscovery()
    await waitForList()

    await user.click(screen.getByTestId('load-more-events'))
    await waitFor(() => expect(screen.getByText('Exposition photographique')).toBeInTheDocument())

    await user.click(screen.getByRole('tab', { name: 'Today' }))

    await waitFor(() => {
      expect(screen.getByTestId('active-filter-chips')).toBeInTheDocument()
    })
    // Pagination restarted: the second page's event is gone again.
    await waitFor(() => {
      expect(screen.queryByText('Exposition photographique')).not.toBeInTheDocument()
    })
  })

  it('reconstructs filter state from a shared URL', async () => {
    renderDiscovery('/?period=TODAY&pricing=FREE&arrondissement=11&query=jazz')
    await waitForList()

    expect(screen.getByRole('tab', { name: 'Today', selected: true })).toBeInTheDocument()
    expect(screen.getByDisplayValue('jazz')).toBeInTheDocument()

    const chips = screen.getByTestId('active-filter-chips')
    expect(within(chips).getByText('Free')).toBeInTheDocument()
    expect(within(chips).getByText('11th arrondissement')).toBeInTheDocument()
    expect(within(chips).getByRole('button', { name: /clear all/i })).toBeInTheDocument()
  })

  it('removing one chip leaves the other filters untouched', async () => {
    const user = userEvent.setup()
    renderDiscovery('/?period=TODAY&pricing=FREE')
    await waitForList()

    const chips = screen.getByTestId('active-filter-chips')
    await user.click(within(chips).getByText('Free').closest('button') as HTMLElement)

    await waitFor(() => {
      // The pricing chip is gone; a card's own "Free" badge is unaffected.
      expect(
        within(screen.getByTestId('active-filter-chips')).queryByText('Free')
      ).not.toBeInTheDocument()
    })
    expect(screen.getByRole('tab', { name: 'Today', selected: true })).toBeInTheDocument()
  })

  it('debounces the search query rather than firing per keystroke', async () => {
    const user = userEvent.setup()
    const requests: string[] = []
    server.events.on('request:start', ({ request }) => {
      if (request.url.includes('/api/v1/events?')) requests.push(request.url)
    })

    renderDiscovery()
    await waitForList()
    const baseline = requests.length

    await user.type(screen.getByRole('searchbox', { name: /search events/i }), 'jazz')

    await waitFor(
      () => {
        expect(requests.length).toBeGreaterThan(baseline)
      },
      { timeout: 3000 }
    )
    // Four keystrokes must not produce four requests.
    expect(requests.length - baseline).toBeLessThan(4)
    expect(requests.at(-1)).toContain('query=jazz')
  })

  it('shows an actionable empty state, not an error', async () => {
    server.use(errorHandlers.emptyList)
    renderDiscovery('/?query=nothing-matches&pricing=FREE')

    await waitFor(() => expect(screen.getByTestId('empty-results')).toBeInTheDocument())
    expect(screen.getByText('No events found')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /clear the search text/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /show all prices/i })).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('recovers from an empty state when a filter is reset', async () => {
    const user = userEvent.setup()
    server.use(errorHandlers.emptyList)
    renderDiscovery('/?pricing=FREE')
    await waitFor(() => expect(screen.getByTestId('empty-results')).toBeInTheDocument())

    server.resetHandlers()
    await user.click(screen.getByRole('button', { name: /show all prices/i }))

    await waitForList()
    expect(screen.getByText('Jazz at Le Bataclan')).toBeInTheDocument()
  })

  it('surfaces a 500 as a retriable panel with a correlation reference', async () => {
    const user = userEvent.setup()
    server.use(errorHandlers.listServerError)
    renderDiscovery()

    const alert = await screen.findByRole('alert')
    expect(within(alert).getByText('Something went wrong')).toBeInTheDocument()

    await user.click(within(alert).getByRole('button', { name: /technical details/i }))
    expect(screen.getByText(/test-correlation-id/)).toBeInTheDocument()
  })

  it('retries a 503 automatically and then succeeds', async () => {
    server.use(flakyListHandler())
    // The production client is used here on purpose: retry policy is the subject.
    renderWithProviders(<AppRoutes />, { route: '/', queryClient: createQueryClient() })

    await waitFor(() => expect(screen.getByText('Jazz at Le Bataclan')).toBeInTheDocument(), {
      timeout: 10000,
    })
  }, 20000)

  it('does not retry a deterministic 400', async () => {
    let calls = 0
    server.use(
      http.get('*/api/v1/events', () => {
        calls += 1
        return HttpResponse.json(
          { title: 'Validation failed', detail: 'Invalid', code: 'VALIDATION_FAILED', status: 400 },
          { status: 400 }
        )
      })
    )
    renderWithProviders(<AppRoutes />, { route: '/', queryClient: createQueryClient() })

    await screen.findByRole('alert')
    await new Promise((resolve) => setTimeout(resolve, 300))
    expect(calls).toBe(1)
  })

  it('recovers from a rejected cursor by restarting at page one', async () => {
    const user = userEvent.setup()
    server.use(errorHandlers.listInvalidCursor)
    renderDiscovery()
    await waitForList()

    await user.click(screen.getByTestId('load-more-events'))

    // Page one content survives; the client does not loop on the bad cursor.
    await waitFor(() => expect(screen.getByText('Jazz at Le Bataclan')).toBeInTheDocument(), {
      timeout: 5000,
    })
    expect(screen.getAllByText('Jazz at Le Bataclan')).toHaveLength(1)
  })

  it('offers a list/map toggle on mobile that defaults to List', async () => {
    renderDiscovery()
    await waitForList()

    expect(screen.getByRole('tab', { name: /list/i, selected: true })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /map/i })).toBeInTheDocument()
  })

  it('does not mount the map bundle until Map is opened', async () => {
    const user = userEvent.setup()
    renderDiscovery()
    await waitForList()

    expect(screen.queryByTestId('mobile-map-panel')).not.toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: /map/i }))
    await waitFor(() => expect(screen.getByTestId('mobile-map-panel')).toBeInTheDocument())
  })

  it('shows the active filter count on the mobile filter trigger', async () => {
    renderDiscovery('/?pricing=FREE&arrondissement=11')
    await waitForList()

    const trigger = screen.getByTestId('mobile-filter-trigger')
    expect(trigger).toHaveAccessibleName(/2 active/)
  })

  it('opens the mobile filter sheet and returns focus to its trigger on close', async () => {
    const user = userEvent.setup()
    renderDiscovery()
    await waitForList()

    const trigger = screen.getByTestId('mobile-filter-trigger')
    await user.click(trigger)

    const sheet = await screen.findByTestId('mobile-filter-sheet')
    expect(within(sheet).getByText('Filters')).toBeInTheDocument()
    expect(sheet).toHaveAttribute('role', 'dialog')
    // Focus containment itself depends on animation events jsdom does not fire;
    // it is asserted for real in e2e/discovery.spec.ts.

    await user.keyboard('{Escape}')

    await waitFor(() => {
      expect(screen.queryByTestId('mobile-filter-sheet')).not.toBeInTheDocument()
    })
    await waitFor(() => expect(trigger).toHaveFocus())
  })

  it('keeps filters applied from the sheet after it closes', async () => {
    const user = userEvent.setup()
    // Arrive with a filter already applied, then confirm the sheet round-trip
    // does not discard it.
    renderDiscovery('/?pricing=FREE')
    await waitForList()

    await user.click(screen.getByTestId('mobile-filter-trigger'))
    await screen.findByTestId('mobile-filter-sheet')
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByTestId('mobile-filter-sheet')).not.toBeInTheDocument())

    expect(within(screen.getByTestId('active-filter-chips')).getByText('Free')).toBeInTheDocument()
  })

  it('shows an offline banner and keeps rendered data', async () => {
    renderDiscovery()
    await waitForList()

    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    window.dispatchEvent(new Event('offline'))

    await waitFor(() => expect(screen.getByTestId('offline-banner')).toBeInTheDocument())
    expect(screen.getByText('Jazz at Le Bataclan')).toBeInTheDocument()
    vi.restoreAllMocks()
  })
})

describe('DiscoveryPage on desktop', () => {
  beforeEach(() => {
    window.localStorage.clear()
    setViewport('desktop')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders the list and the map at the same time', async () => {
    renderDiscovery()
    await waitForList()

    expect(screen.getByRole('complementary', { name: /map of events/i })).toBeInTheDocument()
    // No mobile view switch on desktop.
    expect(screen.queryByRole('tablist', { name: /result view/i })).not.toBeInTheDocument()
    expect(screen.queryByTestId('mobile-filter-trigger')).not.toBeInTheDocument()
  })

  it('exposes the secondary filters inline', async () => {
    renderDiscovery()
    await waitForList()

    expect(screen.getByTestId('category-select')).toBeInTheDocument()
    expect(screen.getByTestId('pricing-select')).toBeInTheDocument()
    expect(screen.getByTestId('arrondissement-select')).toBeInTheDocument()
  })

  it('applies a filter chosen from an inline select and reflects it in a chip', async () => {
    const user = userEvent.setup()
    renderDiscovery()
    await waitForList()

    await user.click(screen.getByTestId('pricing-select'))
    await user.click(await screen.findByRole('option', { name: 'Free' }))

    await waitFor(() => {
      expect(
        within(screen.getByTestId('active-filter-chips')).getByText('Free')
      ).toBeInTheDocument()
    })
  })

  it('keeps discovery usable when the category list fails and offers an inline retry', async () => {
    server.use(errorHandlers.categoriesFailure)
    renderDiscovery()
    await waitForList()

    expect(screen.getByText('Jazz at Le Bataclan')).toBeInTheDocument()
    expect(await screen.findByText('Categories unavailable')).toBeInTheDocument()
    // The retry lives inside the category control, not in a global error state.
    const retry = screen.getByRole('button', { name: /retry/i })
    expect(retry).toHaveAccessibleName(/loading categories/i)
  })

  it('loads list and map pages independently', async () => {
    const user = userEvent.setup()
    const mapRequests: string[] = []
    server.events.on('request:start', ({ request }) => {
      if (request.url.includes('/api/v1/events/map')) mapRequests.push(request.url)
    })

    renderDiscovery()
    await waitForList()
    await waitFor(() => expect(mapRequests.length).toBeGreaterThan(0))
    const mapCallsBefore = mapRequests.length

    await user.click(screen.getByTestId('load-more-events'))
    await waitFor(() => expect(screen.getByText('Exposition photographique')).toBeInTheDocument())

    // Advancing the list cursor must not advance the map cursor.
    expect(mapRequests.length).toBe(mapCallsBefore)
  })

  it('sends identical semantic filters to the list and the map', async () => {
    const listUrls: string[] = []
    const mapUrls: string[] = []
    server.events.on('request:start', ({ request }) => {
      if (request.url.includes('/api/v1/events/map')) mapUrls.push(request.url)
      else if (request.url.includes('/api/v1/events?')) listUrls.push(request.url)
    })

    renderDiscovery('/?period=TODAY&pricing=FREE&arrondissement=11&query=jazz')
    await waitForList()
    await waitFor(() => expect(mapUrls.length).toBeGreaterThan(0))

    const semantic = (raw: string) => {
      const params = new URL(raw).searchParams
      params.delete('limit')
      params.sort()
      return params.toString()
    }

    expect(semantic(listUrls.at(-1) as string)).toBe(semantic(mapUrls.at(-1) as string))
    // Recommended, and deliberately different, page sizes (PRD FR-LIST-001/FR-MAP-001).
    expect(new URL(listUrls.at(-1) as string).searchParams.get('limit')).toBe('20')
    expect(new URL(mapUrls.at(-1) as string).searchParams.get('limit')).toBe('100')
  })

  it('never sends geographic bounds in V1', async () => {
    const urls: string[] = []
    server.events.on('request:start', ({ request }) => urls.push(request.url))

    renderDiscovery()
    await waitForList()

    for (const url of urls) {
      expect(url).not.toMatch(/[?&](north|south|east|west|bbox)=/)
    }
  })
})
