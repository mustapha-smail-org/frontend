import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { renderWithProviders } from '@/test/render'
import type { EventSummary } from '@/shared/api/types'

import { EventCard } from './EventCard'

const complete: EventSummary = {
  id: 'evt-001',
  title: 'Jazz at Le Bataclan',
  summary: 'An evening of contemporary jazz.',
  categories: ['Concert', 'Musique', 'Festival'],
  pricingCategory: 'PAID',
  arrondissement: 11,
  venueName: 'Le Bataclan',
  startAt: '2026-09-12T20:30:00+02:00',
  endAt: '2026-09-12T23:00:00+02:00',
  officialUrl: 'https://example.org',
}

const sparse: EventSummary = {
  id: 'evt-002',
  title: 'Untitled happening',
  summary: null,
  categories: [],
  pricingCategory: 'NOT_SPECIFIED',
  arrondissement: null,
  venueName: null,
  startAt: null,
  endAt: null,
  officialUrl: null,
}

function renderCard(event: EventSummary, extra: Record<string, unknown> = {}) {
  return renderWithProviders(
    <ul>
      <EventCard event={event} {...extra} />
    </ul>
  )
}

describe('EventCard', () => {
  it('renders complete data', () => {
    renderCard(complete)

    expect(screen.getByRole('heading', { name: /Jazz at Le Bataclan/ })).toBeInTheDocument()
    expect(screen.getByText('An evening of contemporary jazz.')).toBeInTheDocument()
    expect(screen.getByText('Le Bataclan · Paris 11th')).toBeInTheDocument()
    expect(screen.getByText('Paid')).toBeInTheDocument()
  })

  it('links to the detail route', () => {
    renderCard(complete)
    expect(screen.getByRole('link', { name: /Jazz at Le Bataclan/ })).toHaveAttribute(
      'href',
      '/events/evt-001'
    )
  })

  it('summarises overflowing categories instead of wrapping endlessly', () => {
    renderCard(complete)
    expect(screen.getByText('Concert')).toBeInTheDocument()
    expect(screen.getByText('Musique')).toBeInTheDocument()
    expect(screen.getByText('+1')).toBeInTheDocument()
  })

  it('states missing data honestly and never invents a price or date', () => {
    renderCard(sparse)

    expect(screen.getByText('Price not specified')).toBeInTheDocument()
    expect(screen.queryByText('Free')).not.toBeInTheDocument()
    expect(screen.getByText('Date not provided')).toBeInTheDocument()
    expect(screen.getByText('Location not provided')).toBeInTheDocument()
  })

  describe('summary sanitisation', () => {
    it('flattens HTML instead of showing tag soup', () => {
      renderCard({ ...complete, summary: '<p>An <b>excellent</b> evening of jazz.</p>' })

      expect(screen.getByText('An excellent evening of jazz.')).toBeInTheDocument()
      expect(screen.queryByText(/<p>/)).not.toBeInTheDocument()
      expect(screen.getByRole('listitem').querySelector('b')).toBeNull()
    })

    it('never executes anything from the summary', () => {
      const { container } = renderCard({
        ...complete,
        summary: '<img src=x onerror="window.__pwned = 1"> Jazz<script>alert(1)</script>',
      })

      expect(container.querySelector('img')).toBeNull()
      expect(container.querySelector('script')).toBeNull()
      expect(container.innerHTML).not.toContain('onerror')
      expect((window as unknown as Record<string, unknown>).__pwned).toBeUndefined()
    })

    it('cleans up a tag left dangling by the backend truncation', () => {
      renderCard({ ...complete, summary: 'Doors at 19:30. Book at <a href="https://exa' })
      expect(screen.getByText('Doors at 19:30. Book at')).toBeInTheDocument()
      expect(screen.queryByText(/href/)).not.toBeInTheDocument()
    })

    it('omits the paragraph when nothing readable survives', () => {
      renderCard({ ...complete, summary: '<p></p>' })
      // Only the venue/date lines remain; no empty summary paragraph.
      expect(screen.getByRole('listitem').querySelectorAll('p')).toHaveLength(0)
    })
  })

  it('never renders an image placeholder', () => {
    const { container } = renderCard(complete)
    expect(container.querySelector('img')).toBeNull()
  })

  it('exposes an unambiguous accessible date alongside the short label', () => {
    renderCard(complete)
    const time = screen.getByText(/12 September 2026/)
    expect(time).toBeInTheDocument()
    expect(within(screen.getByRole('listitem')).getByRole('link')).toBeInTheDocument()
  })

  it('marks the selected card for the map cross-highlight', () => {
    renderCard(complete, { isSelected: true })
    expect(screen.getByRole('listitem')).toHaveAttribute('data-selected', 'true')
  })
})
