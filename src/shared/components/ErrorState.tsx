import { AlertTriangle, RefreshCw } from 'lucide-react'
import { useId, useState } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import { describeError } from './describe-error'

interface ErrorStateProps {
  error: unknown
  onRetry?: () => void
  /** Overrides the heading derived from the error. */
  title?: string
  className?: string
  compact?: boolean
}

export function ErrorState({ error, onRetry, title, className, compact = false }: ErrorStateProps) {
  const presentation = describeError(error)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const detailsId = useId()

  return (
    <div
      role="alert"
      className={cn(
        'border-border bg-card rounded-xl border p-5 text-sm',
        compact && 'p-4',
        className
      )}
    >
      <div className="flex gap-3">
        <AlertTriangle aria-hidden="true" className="text-destructive mt-0.5 size-4.5 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-foreground font-semibold">{title ?? presentation.title}</p>
          <p className="text-muted-foreground mt-1">{presentation.detail}</p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {onRetry ? (
              <Button size="sm" variant="outline" onClick={onRetry}>
                <RefreshCw aria-hidden="true" className="size-3.5" />
                Try again
              </Button>
            ) : null}

            {presentation.correlationId ? (
              <Button
                size="sm"
                variant="ghost"
                aria-expanded={detailsOpen}
                aria-controls={detailsId}
                onClick={() => setDetailsOpen((open) => !open)}
                className="text-muted-foreground"
              >
                {detailsOpen ? 'Hide technical details' : 'Technical details'}
              </Button>
            ) : null}
          </div>

          {presentation.correlationId && detailsOpen ? (
            <p id={detailsId} className="text-muted-foreground mt-2 font-mono text-xs break-all">
              Reference: {presentation.correlationId}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
