import { Search, X } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'

import { Input } from '@/components/ui/input'
import { useDebouncedValue } from '@/shared/hooks/use-debounced-value'

import { MAX_QUERY_LENGTH } from '../search-params'

interface SearchInputProps {
  /** The committed value, i.e. what is currently in the URL. */
  value: string
  onCommit: (value: string) => void
  className?: string
}

/**
 * PRD FR-FILTER-005: 200-character cap, trimmed before commit, 350 ms debounce,
 * Enter commits immediately, Escape clears while focused.
 */
export function SearchInput({ value, onCommit, className }: SearchInputProps) {
  const inputId = useId()
  const [draft, setDraft] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounced = useDebouncedValue(draft, 350)
  const lastCommitted = useRef(value)

  // Keep the field in sync when the URL changes from elsewhere (chips, Back).
  useEffect(() => {
    if (value !== lastCommitted.current) {
      lastCommitted.current = value
      setDraft(value)
    }
  }, [value])

  useEffect(() => {
    const trimmed = debounced.trim()
    if (trimmed === lastCommitted.current) return
    lastCommitted.current = trimmed
    onCommit(trimmed)
  }, [debounced, onCommit])

  const commitNow = (next: string) => {
    const trimmed = next.trim()
    setDraft(next)
    if (trimmed === lastCommitted.current) return
    lastCommitted.current = trimmed
    onCommit(trimmed)
  }

  return (
    <div className={className}>
      <label htmlFor={inputId} className="sr-only">
        Search events
      </label>
      <div className="relative">
        <Search
          aria-hidden="true"
          className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
        />
        <Input
          id={inputId}
          ref={inputRef}
          type="search"
          inputMode="search"
          autoComplete="off"
          maxLength={MAX_QUERY_LENGTH}
          placeholder="Search events, venues, keywords"
          value={draft}
          className="h-10 pr-9 pl-9"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              commitNow(draft)
            }
            if (event.key === 'Escape' && draft !== '') {
              // Clearing is the only Escape behaviour; it never closes an ancestor
              // dialog while there is text to clear, which stays predictable.
              event.stopPropagation()
              commitNow('')
            }
          }}
        />
        {draft !== '' ? (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => {
              commitNow('')
              inputRef.current?.focus()
            }}
            className="text-muted-foreground hover:text-foreground focus-visible:ring-ring absolute top-1/2 right-1.5 grid size-7 -translate-y-1/2 place-items-center rounded-md focus-visible:ring-2 focus-visible:outline-none"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        ) : null}
      </div>
    </div>
  )
}
