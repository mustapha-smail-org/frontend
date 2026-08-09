import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { AppRoutes } from '@/app/router'
import { detailFixture, problemDetail } from '@/test/fixtures/events'
import { server } from '@/test/msw/server'
import { renderWithProviders } from '@/test/render'

function renderDetail(
  eventId = 'evt-001',
  initialEntries?: Array<string | { pathname: string; state?: unknown }>
) {
  return renderWithProviders(<AppRoutes />, {
    initialEntries: initialEntries ?? [`/events/${eventId}`],
  })
}

describe('EventDetailPage', () => {
  it('shows a layout-approximating skeleton first', () => {
    renderDetail()
    expect(screen.getByTestId('detail-skeleton')).toBeInTheDocument()
  })

  it('renders a complete event', async () => {
    renderDetail()

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Jazz at Le Bataclan' })
    ).toBeInTheDocument()
    expect(screen.getByText('Le Bataclan')).toBeInTheDocument()
    expect(screen.getByText('50 Boulevard Voltaire, 75011, Paris')).toBeInTheDocument()
    expect(screen.getByText('From €28')).toBeInTheDocument()
    expect(screen.getByText('Ticket required')).toBeInTheDocument()
    expect(screen.getByText(/Doors open at 19:30/)).toBeInTheDocument()
  })

  it('sets the document title and canonical path', async () => {
    renderDetail()
    await screen.findByRole('heading', { level: 1, name: 'Jazz at Le Bataclan' })

    expect(document.title).toBe('Jazz at Le Bataclan — CityPulse')
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toContain(
      '/events/evt-001'
    )
    expect(document.querySelector('meta[name="description"]')?.getAttribute('content')).toContain(
      'contemporary jazz'
    )
  })

  it('moves focus to the page heading', async () => {
    renderDetail()
    const heading = await screen.findByRole('heading', { level: 1 })
    await waitFor(() => expect(heading).toHaveFocus())
  })

  it('renders external actions with safe rel attributes and the supplied link text', async () => {
    renderDetail()
    await screen.findByRole('heading', { level: 1 })

    const booking = screen.getByRole('link', { name: /Buy tickets/ })
    expect(booking).toHaveAttribute('href', 'https://example.org/jazz/book')
    expect(booking).toHaveAttribute('rel', 'noopener noreferrer')
    expect(booking).toHaveAttribute('target', '_blank')

    expect(screen.getByRole('link', { name: /Official website/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Open in Maps/ })).toHaveAttribute(
      'href',
      expect.stringContaining('mlat=48.8631')
    )
  })

  it('omits actions whose URLs are unsafe rather than rendering dead controls', async () => {
    server.use(
      http.get('*/api/v1/events/:eventId', () =>
        HttpResponse.json({
          ...detailFixture,
          officialUrl: 'javascript:alert(1)',
          pricing: { ...detailFixture.pricing, bookingUrl: 'data:text/html,<script>' },
        })
      )
    )
    renderDetail()
    await screen.findByRole('heading', { level: 1 })

    expect(screen.queryByRole('link', { name: /Buy tickets/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Official website/ })).not.toBeInTheDocument()
    // Coordinates are still valid, so the maps action survives.
    expect(screen.getByRole('link', { name: /Open in Maps/ })).toBeInTheDocument()
  })

  it('lists occurrences in the order supplied by the API', async () => {
    renderDetail()
    await screen.findByRole('heading', { level: 1 })

    const section = screen.getByRole('region', { name: /occurrences/i })
    const items = within(section).getAllByRole('listitem')
    expect(items).toHaveLength(2)
    expect(items[0]).toHaveTextContent('12 September 2026')
    expect(items[1]).toHaveTextContent('13 September 2026')
  })

  it('reports accessibility honestly', async () => {
    renderDetail()
    await screen.findByRole('heading', { level: 1 })

    const section = screen.getByRole('region', { name: /accessibility/i })
    expect(within(section).getByText('Wheelchair accessible')).toBeInTheDocument()
    // `false` becomes "not indicated", never "Not accessible".
    expect(within(section).getByText(/Not indicated by the organiser/)).toBeInTheDocument()
    expect(within(section).queryByText(/^Not accessible/)).not.toBeInTheDocument()
  })

  it('renders the description as text, never as HTML', async () => {
    server.use(
      http.get('*/api/v1/events/:eventId', () =>
        HttpResponse.json({
          ...detailFixture,
          description: '<img src=x onerror="alert(1)"> <b>bold</b>',
        })
      )
    )
    const { container } = renderDetail()
    await screen.findByRole('heading', { level: 1 })

    expect(container.querySelector('img')).toBeNull()
    expect(container.querySelector('b')).toBeNull()
    expect(screen.getByText(/<img src=x onerror=/)).toBeInTheDocument()
  })

  describe('with missing data', () => {
    it('never crashes and states every gap explicitly', async () => {
      renderDetail('evt-sparse')

      expect(
        await screen.findByRole('heading', { level: 1, name: 'Untitled happening' })
      ).toBeInTheDocument()
      expect(screen.getByText('Date not provided')).toBeInTheDocument()
      expect(screen.getByText('Location not provided')).toBeInTheDocument()
      expect(screen.getByText('Price not specified')).toBeInTheDocument()
      expect(screen.getByText('Accessibility information not provided.')).toBeInTheDocument()
    })

    it('omits the occurrences section entirely when there are none', async () => {
      renderDetail('evt-sparse')
      await screen.findByRole('heading', { level: 1 })
      expect(screen.queryByRole('region', { name: /occurrence/i })).not.toBeInTheDocument()
    })

    it('omits the mini-map when coordinates are absent', async () => {
      renderDetail('evt-sparse')
      await screen.findByRole('heading', { level: 1 })
      expect(screen.queryByRole('region', { name: /where it is/i })).not.toBeInTheDocument()
    })

    it('renders no external actions at all when nothing is linkable', async () => {
      renderDetail('evt-sparse')
      await screen.findByRole('heading', { level: 1 })
      expect(screen.queryByRole('link', { name: /Open in Maps/ })).not.toBeInTheDocument()
      expect(screen.queryByRole('link', { name: /Book/ })).not.toBeInTheDocument()
    })
  })

  describe('error states', () => {
    it('renders a dedicated unavailable page for a 404 and never retries it', async () => {
      let calls = 0
      server.use(
        http.get('*/api/v1/events/:eventId', () => {
          calls += 1
          return HttpResponse.json(
            problemDetail(404, 'EVENT_NOT_FOUND', 'Event not found', 'Missing'),
            { status: 404 }
          )
        })
      )
      renderDetail('evt-missing')

      expect(await screen.findByRole('heading', { name: 'Event unavailable' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /Back to results/ })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /Browse all events/ })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /try again/i })).not.toBeInTheDocument()

      await new Promise((resolve) => setTimeout(resolve, 300))
      expect(calls).toBe(1)
    })

    it('offers a retry for a 503', async () => {
      server.use(
        http.get('*/api/v1/events/:eventId', () =>
          HttpResponse.json(problemDetail(503, 'SERVICE_UNAVAILABLE', 'Unavailable', 'Try later'), {
            status: 503,
          })
        )
      )
      renderDetail()

      // The detail query retries 503 twice with backoff before giving up.
      const alert = await screen.findByRole('alert', {}, { timeout: 10000 })
      expect(within(alert).getByRole('button', { name: /try again/i })).toBeInTheDocument()
    }, 15000)
  })

  describe('back to results', () => {
    it('returns to the discovery URL carried in router state', async () => {
      renderDetail('evt-001', [
        { pathname: '/events/evt-001', state: { from: '/?period=TODAY&pricing=FREE' } },
      ])
      await screen.findByRole('heading', { level: 1 })

      expect(screen.getByRole('link', { name: /Back to results/ })).toHaveAttribute(
        'href',
        '/?period=TODAY&pricing=FREE'
      )
    })

    it('falls back to discovery for a directly opened link', async () => {
      renderDetail()
      await screen.findByRole('heading', { level: 1 })
      expect(screen.getByRole('link', { name: /Back to discovery/ })).toHaveAttribute('href', '/')
    })

    it('ignores an off-origin value in router state', async () => {
      renderDetail('evt-001', [
        { pathname: '/events/evt-001', state: { from: '//evil.example.com/phish' } },
      ])
      await screen.findByRole('heading', { level: 1 })
      expect(screen.getByRole('link', { name: /Back to discovery/ })).toHaveAttribute('href', '/')
    })
  })

  it('opens directly from a shared URL and returns to results', async () => {
    const user = userEvent.setup()
    renderDetail()
    await screen.findByRole('heading', { level: 1, name: 'Jazz at Le Bataclan' })

    await user.click(screen.getByRole('link', { name: /Back to discovery/ }))
    await waitFor(() => expect(screen.getByTestId('event-list')).toBeInTheDocument())
  })
})
