import { CalendarClock } from 'lucide-react'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import type { EventOccurrence } from '@/shared/api/types'
import { formatOccurrence } from '@/shared/formatters/date'

/** Beyond this many, the list collapses behind an accessible disclosure. */
const INLINE_LIMIT = 6

/**
 * PRD FR-DETAIL-005: occurrences appear in the order supplied by the API, are
 * never merged or de-duplicated on appearance, and the section is omitted
 * entirely when there are none.
 */
export function OccurrenceList({ occurrences }: { occurrences: EventOccurrence[] }) {
  if (occurrences.length === 0) return null

  const rendered = occurrences.map((occurrence, index) => {
    const { label, machineValue } = formatOccurrence(occurrence.start, occurrence.end)
    return (
      <li key={`${machineValue ?? 'unknown'}-${index}`} className="flex items-start gap-2 text-sm">
        <CalendarClock
          aria-hidden="true"
          className="text-muted-foreground mt-0.5 size-3.5 shrink-0"
        />
        {machineValue ? <time dateTime={machineValue}>{label}</time> : <span>{label}</span>}
      </li>
    )
  })

  return (
    <section aria-labelledby="occurrences-heading" className="border-border border-t pt-6">
      <h2 id="occurrences-heading" className="text-lg font-semibold">
        {occurrences.length === 1 ? 'Occurrence' : `All ${occurrences.length} occurrences`}
      </h2>

      {occurrences.length <= INLINE_LIMIT ? (
        <ul className="mt-3 space-y-2">{rendered}</ul>
      ) : (
        <>
          <ul className="mt-3 space-y-2">{rendered.slice(0, INLINE_LIMIT)}</ul>
          <Accordion type="single" collapsible className="mt-1">
            <AccordionItem value="more" className="border-b-0">
              <AccordionTrigger className="text-sm">
                Show {occurrences.length - INLINE_LIMIT} more
              </AccordionTrigger>
              <AccordionContent>
                <ul className="space-y-2">{rendered.slice(INLINE_LIMIT)}</ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </>
      )}
    </section>
  )
}
