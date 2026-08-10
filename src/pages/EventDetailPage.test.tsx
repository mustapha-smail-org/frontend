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
    expect(screen.getByTestId('open-in-maps')).toHaveAttribute(
      'href',
      expect.stringContaining('google.com/maps')
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
    // Coordinates are still valid, so both maps affordances survive.
    expect(screen.getByTestId('open-in-maps')).toBeInTheDocument()
    expect(screen.getByTestId('location-maps-link')).toBeInTheDocument()
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

  it('makes the "Where it is" section open the configured maps provider', async () => {
    renderDetail()
    await screen.findByRole('heading', { level: 1 })

    const section = screen.getByRole('region', { name: /where it is/i })
    const link = screen.getByTestId('location-maps-link')

    expect(section).toContainElement(link)
    expect(link).toHaveTextContent('Open in Google Maps')
    expect(link).toHaveAttribute('href', expect.stringContaining('google.com/maps'))
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    expect(link).toHaveAttribute('target', '_blank')
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

  it('renders description HTML safely rather than as raw markup', async () => {
    server.use(
      http.get('*/api/v1/events/:eventId', () =>
        HttpResponse.json({
          ...detailFixture,
          description:
            '<p>An <b>excellent</b> evening.</p><img src=x onerror="alert(1)">' +
            '<script>alert(2)</script><p>See <a href="https://example.org/x">details</a>.</p>',
        })
      )
    )
    const { container } = renderDetail()
    await screen.findByRole('heading', { level: 1 })

    const description = screen.getByTestId('event-description')
    // Real markup is honoured...
    expect(description.querySelector('strong')).toHaveTextContent('excellent')
    expect(description.querySelectorAll('p')).toHaveLength(2)
    expect(screen.getByRole('link', { name: 'details' })).toHaveAttribute(
      'href',
      'https://example.org/x'
    )
    // ...while anything executable is removed, not escaped and displayed.
    // Scoped to the description: the mini-map legitimately renders tile <img>s.
    expect(description.querySelector('img')).toBeNull()
    expect(container.querySelector('script')).toBeNull()
    expect(container.innerHTML).not.toContain('onerror')
    expect(description.textContent).not.toContain('<img')
    expect(description.textContent).not.toContain('alert(')
  })

  it('renders paid price detail HTML safely', async () => {
    server.use(
      http.get('*/api/v1/events/:eventId', () =>
        HttpResponse.json({
          ...detailFixture,
          pricing: {
            ...detailFixture.pricing,
            detail: '<p>Full price <strong>€28</strong></p><script>alert(1)</script>',
          },
        })
      )
    )
    const { container } = renderDetail()
    await screen.findByRole('heading', { level: 1 })

    const pricing = screen.getByTestId('pricing-detail')
    expect(pricing.querySelector('strong')).toHaveTextContent('€28')
    expect(container.querySelector('script')).toBeNull()
    expect(pricing.textContent).not.toContain('alert(')
  })

  it('uses a plain-text meta description even when the source is HTML', async () => {
    server.use(
      http.get('*/api/v1/events/:eventId', () =>
        HttpResponse.json({ ...detailFixture, description: '<p>Jazz  <b>trio</b> night</p>' })
      )
    )
    renderDetail()
    await screen.findByRole('heading', { level: 1 })

    const meta = document.querySelector('meta[name="description"]')?.getAttribute('content')
    expect(meta).toBe('Jazz trio night')
    expect(meta).not.toContain('<')
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

    it('omits the whole location section when there is nothing to point at', async () => {
      renderDetail('evt-sparse')
      await screen.findByRole('heading', { level: 1 })
      expect(screen.queryByRole('region', { name: /where it is/i })).not.toBeInTheDocument()
      expect(screen.queryByTestId('location-maps-link')).not.toBeInTheDocument()
    })

    it('still offers a maps link when only an address is known', async () => {
      server.use(
        http.get('*/api/v1/events/:eventId', () =>
          HttpResponse.json({
            ...detailFixture,
            location: {
              name: 'Salle Pleyel',
              street: '252 Rue du Faubourg Saint-Honoré',
              zipcode: '75008',
              city: 'Paris',
              arrondissement: 8,
              latitude: null,
              longitude: null,
            },
          })
        )
      )
      renderDetail()
      await screen.findByRole('heading', { level: 1 })

      const link = screen.getByTestId('location-maps-link')
      expect(link).toHaveAttribute('href', expect.stringContaining('Salle%20Pleyel'))
      // No coordinates means no mini-map, but the section still exists.
      expect(screen.queryByTestId('detail-mini-map')).not.toBeInTheDocument()
    })

    it('renders no external actions at all when nothing is linkable', async () => {
      renderDetail('evt-sparse')
      await screen.findByRole('heading', { level: 1 })
      expect(screen.queryByRole('link', { name: /Open in Google Maps/ })).not.toBeInTheDocument()
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
