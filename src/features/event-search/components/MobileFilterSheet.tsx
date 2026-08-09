import { SlidersHorizontal } from 'lucide-react'
import { useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import type { EventFilters } from '@/shared/api/types'

import { ArrondissementSelect } from './ArrondissementSelect'
import { CategorySelect } from './CategorySelect'
import { PricingSelect } from './PricingSelect'

interface MobileFilterSheetProps {
  filters: EventFilters
  onChange: (patch: Partial<EventFilters>) => void
  onClearAll: () => void
  /** Number of active non-default secondary filters, shown on the trigger. */
  activeCount: number
}

/**
 * PRD FR-FILTER-007. Filters apply immediately — there is no pending/applied
 * ambiguity to resolve — and the sheet only confirms and closes.
 * Focus is trapped by the underlying Vaul/Radix dialog and returned to the
 * trigger on close.
 */
export function MobileFilterSheet({
  filters,
  onChange,
  onClearAll,
  activeCount,
}: MobileFilterSheetProps) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button
          ref={triggerRef}
          variant="outline"
          className="h-10 shrink-0"
          data-testid="mobile-filter-trigger"
        >
          <SlidersHorizontal aria-hidden="true" className="size-4" />
          Filters
          {activeCount > 0 ? (
            <span
              aria-hidden="true"
              className="bg-primary text-primary-foreground ml-0.5 grid min-w-5 place-items-center rounded-full px-1.5 py-0.5 text-[0.6875rem] leading-none font-semibold"
            >
              {activeCount}
            </span>
          ) : null}
          <span className="sr-only">
            {activeCount > 0 ? `, ${activeCount} active` : ', none active'}
          </span>
        </Button>
      </DrawerTrigger>

      <DrawerContent data-testid="mobile-filter-sheet">
        <DrawerHeader className="text-left">
          <DrawerTitle>Filters</DrawerTitle>
          <DrawerDescription>Changes apply to your results straight away.</DrawerDescription>
        </DrawerHeader>

        <div className="space-y-4 px-4 pb-2">
          <div className="space-y-1.5">
            <span id="sheet-category-label" className="text-sm font-medium">
              Category
            </span>
            <CategorySelect
              value={filters.category}
              onChange={(category) => onChange({ category })}
              className="h-11 w-full"
            />
          </div>

          <div className="space-y-1.5">
            <span className="text-sm font-medium">Price</span>
            <PricingSelect
              value={filters.pricing}
              onChange={(pricing) => onChange({ pricing })}
              className="h-11 w-full"
            />
          </div>

          <div className="space-y-1.5">
            <span className="text-sm font-medium">Location</span>
            <ArrondissementSelect
              value={filters.arrondissement}
              onChange={(arrondissement) => onChange({ arrondissement })}
              className="h-11 w-full"
            />
          </div>
        </div>

        <DrawerFooter className="flex-row gap-2">
          <Button
            variant="outline"
            className="h-11 flex-1"
            onClick={onClearAll}
            disabled={activeCount === 0}
          >
            Clear all
          </Button>
          <DrawerClose asChild>
            <Button className="h-11 flex-1">Show results</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
