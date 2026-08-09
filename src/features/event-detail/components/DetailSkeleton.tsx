import { Skeleton } from '@/components/ui/skeleton'

/** PRD FR-DETAIL-001: the skeleton approximates the final layout. */
export function DetailSkeleton() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6" data-testid="detail-skeleton">
      <p className="sr-only" role="status">
        Loading event
      </p>
      <Skeleton className="h-8 w-36" />

      <div className="mt-6 flex gap-2">
        <Skeleton className="h-5 w-24 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>

      <Skeleton className="mt-4 h-9 w-11/12" />
      <Skeleton className="mt-2 h-9 w-2/3" />

      <div className="mt-6 space-y-3">
        <Skeleton className="h-5 w-72" />
        <Skeleton className="h-5 w-60" />
        <Skeleton className="h-5 w-40" />
      </div>

      <div className="mt-6 flex gap-2">
        <Skeleton className="h-11 w-32 rounded-md" />
        <Skeleton className="h-11 w-40 rounded-md" />
      </div>

      <div className="mt-8 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-10/12" />
        <Skeleton className="h-4 w-9/12" />
      </div>
    </div>
  )
}
