import { RefreshCw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCategories } from '../hooks/use-categories'

const ALL_VALUE = '__ALL__'

interface CategorySelectProps {
  value: string | null
  onChange: (value: string | null) => void
  className?: string
}

/**
 * PRD FR-FILTER-002: one category at a time (the API accepts one value), an
 * "All categories" option, and a retry that lives inside the control so a
 * category failure never blocks the rest of discovery.
 */
export function CategorySelect({ value, onChange, className }: CategorySelectProps) {
  const { data, isPending, isError, refetch, isFetching } = useCategories()

  if (isError) {
    return (
      <div className={className}>
        <div className="border-border bg-card flex h-10 items-center justify-between gap-2 rounded-md border px-2.5">
          <span className="text-muted-foreground truncate text-sm">Categories unavailable</span>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2"
            onClick={() => void refetch()}
            disabled={isFetching}
          >
            <RefreshCw
              aria-hidden="true"
              className={isFetching ? 'size-3.5 animate-spin' : 'size-3.5'}
            />
            Retry
            <span className="sr-only"> loading categories</span>
          </Button>
        </div>
      </div>
    )
  }

  const categories = data ?? []
  // A category from a shared URL may not be in the loaded list; keep it selectable
  // so the control never silently drops the user's filter.
  const options =
    value && !categories.includes(value)
      ? [value, ...categories].sort((a, b) => a.localeCompare(b))
      : categories

  return (
    <Select
      value={value ?? ALL_VALUE}
      onValueChange={(next) => onChange(next === ALL_VALUE ? null : next)}
      disabled={isPending}
    >
      <SelectTrigger aria-label="Category" className={className} data-testid="category-select">
        <SelectValue placeholder={isPending ? 'Loading categories…' : 'All categories'} />
      </SelectTrigger>
      <SelectContent className="max-h-72">
        <SelectItem value={ALL_VALUE}>All categories</SelectItem>
        {options.map((category) => (
          <SelectItem key={category} value={category}>
            {category}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
