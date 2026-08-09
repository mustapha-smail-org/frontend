import { List, MapIcon } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EventList } from '@/features/event-list/components/EventList'
import { useEventList } from '@/features/event-list/hooks/use-event-list'
import { LazyEventMap } from '@/features/event-map/components/LazyEventMap'
import { useMapEvents } from '@/features/event-map/hooks/use-map-events'
import { useViewPreference } from '@/features/event-map/hooks/use-view-preference'
import { FilterBar } from '@/features/event-search/components/FilterBar'
import { useEventFilters } from '@/features/event-search/hooks/use-event-filters'
import type { EventFilters } from '@/shared/api/types'
import { useDocumentMetadata } from '@/shared/hooks/use-document-metadata'
import { useIsDesktop } from '@/shared/hooks/use-media-query'

export function DiscoveryPage() {
  const { filters, key, setFilters, clearAll } = useEventFilters()
  const isDesktop = useIsDesktop()
  const [view, setView] = useViewPreference()

  // Ephemeral UI state stays local (PRD 8.3) and never enters the URL (PRD 5.2).
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [hoveredEventId, setHoveredEventId] = useState<string | null>(null)
  // The map bundle is fetched on first use and then kept mounted so switching
  // back is instant and loaded markers survive (FR-MOBILE-001).
  const [mapEverShown, setMapEverShown] = useState(false)

  const list = useEventList(filters)
  const mapIsVisible = isDesktop || view === 'map'
  const map = useMapEvents(filters, mapIsVisible || mapEverShown)

  useDocumentMetadata({ canonicalPath: '/' })

  useEffect(() => {
    if (mapIsVisible) setMapEverShown(true)
  }, [mapIsVisible])

  // FR-LIST-005: a committed filter change returns the results panel to the top.
  const listPanelRef = useRef<HTMLDivElement>(null)
  const firstRender = useRef(true)
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    setSelectedEventId(null)
    listPanelRef.current?.scrollTo({ top: 0 })
  }, [key])

  const handleFiltersChange = useCallback(
    (patch: Partial<EventFilters>) => setFilters(patch),
    [setFilters]
  )

  const listProps = {
    events: list.events,
    filters,
    isInitialLoading: list.isInitialLoading,
    isRefreshing: list.isRefreshing,
    isError: list.isError,
    error: list.error,
    hasNextPage: list.hasNextPage,
    isFetchingNextPage: list.isFetchingNextPage,
    nextPageError: list.nextPageError,
    onLoadMore: list.loadMore,
    onRetry: list.retry,
    onFiltersChange: handleFiltersChange,
    onClearAll: clearAll,
    selectedEventId,
    onHoverChange: setHoveredEventId,
  }

  const mapProps = {
    markers: map.markers,
    isInitialLoading: map.isInitialLoading,
    isError: map.isError,
    error: map.error,
    hasMore: map.hasMore,
    isLoadingMore: map.isLoadingMore,
    nextPageError: map.nextPageError,
    onLoadMore: map.loadMore,
    onRetry: map.retry,
    selectedEventId,
    onSelect: setSelectedEventId,
    highlightedEventId: hoveredEventId,
    listHasResults: list.events.length > 0,
    onSwitchToList: isDesktop ? undefined : () => setView('list'),
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-border bg-background border-b">
        <div className="mx-auto w-full max-w-[1600px] px-4 py-3 sm:px-6">
          <h1 className="sr-only">Discover events in Paris</h1>
          <FilterBar
            filters={filters}
            onChange={handleFiltersChange}
            onClearAll={clearAll}
            isDesktop={isDesktop}
          />
        </div>
      </div>

      {isDesktop ? (
        /* Desktop: list and map are visible simultaneously (FR-GLOBAL-002). */
        <div className="mx-auto grid w-full max-w-[1600px] flex-1 grid-cols-[minmax(24rem,38%)_1fr] gap-0">
          <div
            ref={listPanelRef}
            className="border-border h-[calc(100dvh-3.5rem-5.75rem)] overflow-y-auto border-r px-4 py-4 sm:px-6"
          >
            <h2 className="sr-only">Results</h2>
            <EventList {...listProps} />
          </div>
          <aside aria-label="Map of events" className="h-[calc(100dvh-3.5rem-5.75rem)]">
            <LazyEventMap {...mapProps} />
          </aside>
        </div>
      ) : (
        /* Mobile: one primary view at a time, with a segmented toggle. */
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="border-border bg-background sticky top-14 z-20 border-b px-4 py-2">
            <Tabs value={view} onValueChange={(next) => setView(next as 'list' | 'map')}>
              <TabsList aria-label="Result view" className="w-full">
                <TabsTrigger value="list" className="min-h-9 flex-1">
                  <List aria-hidden="true" className="size-4" />
                  List
                </TabsTrigger>
                <TabsTrigger value="map" className="min-h-9 flex-1">
                  <MapIcon aria-hidden="true" className="size-4" />
                  Map
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div
            ref={listPanelRef}
            hidden={view !== 'list'}
            className="flex-1 px-4 py-4"
            data-testid="mobile-list-panel"
          >
            <h2 className="sr-only">Results</h2>
            <EventList {...listProps} />
          </div>

          {mapEverShown ? (
            <div
              hidden={view !== 'map'}
              className="h-[calc(100dvh-3.5rem-3.25rem)]"
              data-testid="mobile-map-panel"
            >
              <h2 className="sr-only">Map of events</h2>
              <LazyEventMap {...mapProps} />
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
