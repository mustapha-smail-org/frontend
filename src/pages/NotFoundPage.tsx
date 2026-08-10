import { Compass } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { useDocumentMetadata } from '@/shared/hooks/use-document-metadata'

export function NotFoundPage() {
  useDocumentMetadata({ title: 'Page not found' })

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-16 text-center sm:px-6">
      <Compass aria-hidden="true" className="text-muted-foreground mx-auto size-8" />
      <h1 className="route-focus mt-4 text-2xl font-semibold" tabIndex={-1}>
        Page not found
      </h1>
      <p className="text-muted-foreground mt-2">
        We could not find that page. It may have moved, or the address may be mistyped.
      </p>
      <Button asChild className="mt-6 h-11">
        <Link to="/">Discover events in Paris</Link>
      </Button>
    </div>
  )
}
