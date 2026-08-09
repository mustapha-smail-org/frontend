import { Accessibility, Check, Info } from 'lucide-react'

import type { EventAccessibility } from '@/shared/api/types'

interface AccessibilityPanelProps {
  accessibility: EventAccessibility | null
}

const AFFIRMATIVE_LABELS: Array<{
  key: 'wheelchairAccessible' | 'blindAccessible' | 'deafAccessible'
  label: string
}> = [
  { key: 'wheelchairAccessible', label: 'Wheelchair accessible' },
  { key: 'blindAccessible', label: 'Accessible for blind and partially sighted visitors' },
  { key: 'deafAccessible', label: 'Accessible for deaf and hard-of-hearing visitors' },
]

/**
 * PRD FR-DETAIL-006.
 *
 * Only affirmative or explicitly described information is presented as a fact.
 * A `false` value is reported as "not indicated" — the source data records what
 * an organiser declared, so absence of a claim is not evidence of inaccessibility.
 * Entirely missing data says so, and never says "Not accessible".
 */
export function AccessibilityPanel({ accessibility }: AccessibilityPanelProps) {
  const affirmed = accessibility
    ? AFFIRMATIVE_LABELS.filter((entry) => accessibility[entry.key] === true)
    : []
  const notIndicated = accessibility
    ? AFFIRMATIVE_LABELS.filter((entry) => accessibility[entry.key] === false)
    : []

  const signLanguage = accessibility?.signLanguage ?? null
  const mental = accessibility?.mentalAccessibility ?? null

  const hasAnything =
    affirmed.length > 0 || notIndicated.length > 0 || Boolean(signLanguage) || Boolean(mental)

  return (
    <section aria-labelledby="accessibility-heading" className="border-border border-t pt-6">
      <h2 id="accessibility-heading" className="flex items-center gap-2 text-lg font-semibold">
        <Accessibility aria-hidden="true" className="size-4.5" />
        Accessibility
      </h2>

      {!hasAnything ? (
        <p className="text-muted-foreground mt-2 text-sm">
          Accessibility information not provided.
        </p>
      ) : (
        <div className="mt-3 space-y-3 text-sm">
          {affirmed.length > 0 ? (
            <ul className="space-y-1.5">
              {affirmed.map((entry) => (
                <li key={entry.key} className="flex items-start gap-2">
                  <Check aria-hidden="true" className="text-free mt-0.5 size-4 shrink-0" />
                  <span>{entry.label}</span>
                </li>
              ))}
            </ul>
          ) : null}

          {signLanguage ? (
            <p>
              <span className="font-medium">Sign language: </span>
              <span className="text-muted-foreground">{signLanguage}</span>
            </p>
          ) : null}

          {mental ? (
            <p>
              <span className="font-medium">Mental and cognitive accessibility: </span>
              <span className="text-muted-foreground">{mental}</span>
            </p>
          ) : null}

          {notIndicated.length > 0 ? (
            <p className="text-muted-foreground flex items-start gap-2">
              <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              <span>
                Not indicated by the organiser:{' '}
                {notIndicated.map((entry) => entry.label.toLowerCase()).join('; ')}. Contact the
                venue to confirm.
              </span>
            </p>
          ) : null}
        </div>
      )}
    </section>
  )
}
