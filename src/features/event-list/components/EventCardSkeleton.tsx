import { Skeleton } from '@/components/ui/skeleton'

/**
 * Fixed dimensions approximating a real card, so the swap from skeleton to
 * content does not shift layout (PRD 14.2, CLS budget).
 */
export function EventCardSkeleton() {
  return (
    <li className="border-border bg-card rounded-xl border p-4" aria-hidden="true">
      <div className="flex items-center gap-1.5">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="ml-auto h-5 w-14 rounded-full" />
      </div>
      <Skeleton className="mt-3 h-5 w-4/5" />
      <Skeleton className="mt-2 h-4 w-full" />
      <Skeleton className="mt-1.5 h-4 w-2/3" />
      <Skeleton className="mt-3.5 h-4 w-40" />
      <Skeleton className="mt-1.5 h-4 w-52" />
    </li>
  )
}

export function EventListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <ul className="space-y-3" data-testid="event-list-skeleton">
      {Array.from({ length: count }, (_, index) => (
        <EventCardSkeleton key={index} />
      ))}
    </ul>
  )
}
