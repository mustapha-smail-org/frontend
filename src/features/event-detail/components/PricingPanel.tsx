import { Tag } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import type { EventPricingDetail } from '@/shared/api/types'

/** Mirrors the backend's own FREE/PAID/NOT_SPECIFIED derivation for display. */
function classify(type: string | null): 'FREE' | 'PAID' | 'NOT_SPECIFIED' {
  if (!type || type.trim() === '') return 'NOT_SPECIFIED'
  return ['free', 'gratuit', 'gratuite'].includes(type.trim().toLowerCase()) ? 'FREE' : 'PAID'
}

/**
 * PRD FR-DETAIL-004: the backend's price type and detail are preserved verbatim.
 * Nothing is parsed, converted or recalculated here.
 */
export function PricingPanel({ pricing }: { pricing: EventPricingDetail | null }) {
  const category = classify(pricing?.type ?? null)

  return (
    <div className="flex items-start gap-2.5">
      <Tag aria-hidden="true" className="text-muted-foreground mt-1 size-4 shrink-0" />
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge
            variant={category === 'FREE' ? 'free' : category === 'PAID' ? 'paid' : 'unspecified'}
          >
            {category === 'FREE' ? 'Free' : category === 'PAID' ? 'Paid' : 'Price not specified'}
          </Badge>
          {pricing?.accessType ? <Badge variant="outline">{pricing.accessType}</Badge> : null}
        </div>

        {pricing?.detail ? (
          <p className="text-muted-foreground mt-1.5 text-sm">{pricing.detail}</p>
        ) : category === 'NOT_SPECIFIED' ? (
          <p className="text-muted-foreground mt-1.5 text-sm">
            The organiser has not published price information. Check the official page before you
            go.
          </p>
        ) : null}
      </div>
    </div>
  )
}
