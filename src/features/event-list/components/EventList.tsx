import { Loader2 } from 'lucide-react'
import { useEffect, useRef } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { EventFilters, EventSummary } from '@/shared/api/types'
import { ErrorState } from '@/shared/components/ErrorState'

import { EmptyResults } from './EmptyResults'
import { EventCard } from './EventCard'
import { EventListSkeleton } from './EventCardSkeleton'

interface EventListProps {
  events: EventSummary[]
  filters: EventFilters
  isInitialLoading: boolean
  isRefreshing: boolean
  isError: boolean
  error: unknown
  hasNextPage: boolean
  isFetchingNextPage: boolean
  nextPageError: unknown
  onLoadMore: () => void
  onRetry: () => void
  onFiltersChange: (patch: Partial<EventFilters>) => void
  onClearAll: () => void
  selectedEventId?: string | null
  onHoverChange?: (eventId: string | null) => void
}

/**
 * The canonical, keyboard-accessible representation of the results
 * (PRD FR-LIST-004, 13.2, 13.3, 13.5).
 */
export function EventList({
  events,
  filters,
  isInitialLoading,
  isRefreshing,
  isError,
  error,
  hasNextPage,
  isFetchingNextPage,
  nextPageError,
  onLoadMore,
  onRetry,
  onFiltersChange,
  onClearAll,
  selectedEventId,
  onHoverChange,
}: EventListProps) {
  const cardRefs = useRef(new Map<string, HTMLLIElement>())
  const previousSelected = useRef<string | null>(null)

  /*
   * FR-MAP-004: selecting a marker brings its card into view. `block: 'nearest'`
   * keeps the scroll inside the results panel instead of jumping the page.
   */
  useEffect(() => {
    if (!selectedEventId || selectedEventId === previousSelected.current) return
    previousSelected.current = selectedEventId
    cardRefs.current.get(selectedEventId)?.scrollIntoView({ block: 'nearest' })
  }, [selectedEventId])

  if (isInitialLoading) {
    return (
      <>
        <p className="sr-only" role="status">
          Loading events
        </p>
        <EventListSkeleton />
      </>
    )
  }

  if (isError) {
    return <ErrorState error={error} onRetry={onRetry} />
  }

  if (events.length === 0) {
    return <EmptyResults filters={filters} onChange={onFiltersChange} onClearAll={onClearAll} />
  }

  return (
    <div className="space-y-3">
      {/*
        Announce the outcome, never the contents of every card (PRD 13.3).
        The count is deliberately phrased as "loaded", not as a total (FR-LIST-004).
      */}
      <p className="sr-only" role="status" aria-live="polite">
        {isRefreshing
          ? 'Updating results'
          : `${events.length} event${events.length === 1 ? '' : 's'} loaded${
              hasNextPage ? ', more available' : ''
            }`}
      </p>

      <ul
        className={cn('space-y-3 transition-opacity duration-150', isRefreshing && 'opacity-60')}
        aria-busy={isRefreshing || undefined}
        data-testid="event-list"
      >
        {events.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            isSelected={event.id === selectedEventId}
            onHoverChange={onHoverChange}
            ref={(node) => {
              if (node) cardRefs.current.set(event.id, node)
              else cardRefs.current.delete(event.id)
            }}
          />
        ))}
      </ul>

      {nextPageError ? (
        <ErrorState
          compact
          error={nextPageError}
          title="Could not load more events"
          onRetry={onLoadMore}
        />
      ) : null}

      {hasNextPage && !nextPageError ? (
        <div className="pt-1 pb-2">
          <Button
            variant="outline"
            className="h-11 w-full"
            onClick={onLoadMore}
            disabled={isFetchingNextPage}
            data-testid="load-more-events"
          >
            {isFetchingNextPage ? (
              <>
                <Loader2 aria-hidden="true" className="size-4 animate-spin" />
                Loading more…
              </>
            ) : (
              'Load more'
            )}
          </Button>
        </div>
      ) : null}

      {!hasNextPage && !nextPageError ? (
        <p className="text-muted-foreground py-2 text-center text-xs">
          You have reached the end of these results.
        </p>
      ) : null}
    </div>
  )
}
