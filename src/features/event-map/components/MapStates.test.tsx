import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { normaliseProblemDetail } from '@/shared/api/errors'
import type { EventMapMarker } from '@/shared/api/types'
import { renderWithProviders } from '@/test/render'

import { LazyEventMap } from './LazyEventMap'
import { MarkerPopup } from './MarkerPopup'

const marker: EventMapMarker = {
  id: 'evt-001',
  title: 'Jazz at Le Bataclan',
  latitude: 48.8631,
  longitude: 2.3708,
  category: 'Concert',
  pricingCategory: 'FREE',
  arrondissement: 11,
  startAt: '2026-09-12T20:30:00+02:00',
}

const baseProps = {
  markers: [] as EventMapMarker[],
  isInitialLoading: false,
  isError: false,
  error: null as unknown,
  hasMore: false,
  isLoadingMore: false,
  nextPageError: null as unknown,
  onLoadMore: vi.fn(),
  onRetry: vi.fn(),
  selectedEventId: null,
  onSelect: vi.fn(),
  highlightedEventId: null,
  listHasResults: false,
  onSwitchToList: undefined,
}

describe('LazyEventMap', () => {
  it('shows a placeholder while the map bundle loads', () => {
    renderWithProviders(<LazyEventMap {...baseProps} />)
    expect(screen.getByTestId('map-skeleton')).toBeInTheDocument()
  })

  it('renders a map-specific error that points back to the list', async () => {
    const error = normaliseProblemDetail(500, { code: 'INTERNAL_ERROR' }, null)
    const onSwitchToList = vi.fn()
    renderWithProviders(
      <LazyEventMap {...baseProps} isError error={error} onSwitchToList={onSwitchToList} />
    )

    const alert = await screen.findByTestId('map-error')
    expect(alert).toHaveTextContent(/event list is still available/i)

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /back to list/i }))
    expect(onSwitchToList).toHaveBeenCalled()
  })

  it('explains that matching events have no coordinates', async () => {
    renderWithProviders(<LazyEventMap {...baseProps} listHasResults />)
    await waitFor(() => expect(screen.getByTestId('map-empty')).toBeInTheDocument())
    expect(screen.getByTestId('map-empty')).toHaveTextContent(/do not have map coordinates/i)
  })

  it('distinguishes "no matches at all" from "no coordinates"', async () => {
    renderWithProviders(<LazyEventMap {...baseProps} listHasResults={false} />)
    await waitFor(() => expect(screen.getByTestId('map-empty')).toBeInTheDocument())
    expect(screen.getByTestId('map-empty')).toHaveTextContent(/No events match these filters/i)
  })

  it('offers Load more markers only when another page exists', async () => {
    const { rerender } = renderWithProviders(<LazyEventMap {...baseProps} markers={[marker]} />)
    await waitFor(() => expect(screen.queryByTestId('map-skeleton')).not.toBeInTheDocument())
    expect(screen.queryByTestId('load-more-markers')).not.toBeInTheDocument()
    expect(screen.getByText(/Showing all 1 mapped events/)).toBeInTheDocument()

    rerender(<LazyEventMap {...baseProps} markers={[marker]} hasMore />)
    expect(await screen.findByTestId('load-more-markers')).toBeInTheDocument()
    // Never claims exhaustiveness while more pages exist.
    expect(screen.queryByText(/Showing all/)).not.toBeInTheDocument()
  })

  it('keeps markers and offers a retry when a marker page fails', async () => {
    const error = normaliseProblemDetail(503, { code: 'SERVICE_UNAVAILABLE' }, null)
    renderWithProviders(
      <LazyEventMap {...baseProps} markers={[marker]} hasMore nextPageError={error} />
    )
    expect(
      await screen.findByRole('button', { name: /retry loading markers/i })
    ).toBeInTheDocument()
    expect(screen.getByText('1 shown')).toBeInTheDocument()
  })
})

describe('MarkerPopup', () => {
  it('shows title, date, category, price and a details link', () => {
    renderWithProviders(<MarkerPopup marker={marker} />)

    expect(screen.getByRole('heading', { name: 'Jazz at Le Bataclan' })).toBeInTheDocument()
    expect(screen.getByText('Concert')).toBeInTheDocument()
    expect(screen.getByText('Free')).toBeInTheDocument()
    expect(screen.getByText(/12 Sept/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /View details/ })).toHaveAttribute(
      'href',
      '/events/evt-001'
    )
  })

  it('states a missing date rather than inventing one', () => {
    renderWithProviders(<MarkerPopup marker={{ ...marker, startAt: null, category: null }} />)
    expect(screen.getByText('Date not provided')).toBeInTheDocument()
  })
})
