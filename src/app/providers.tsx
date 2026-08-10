import { QueryClientProvider, type QueryClient } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'
import { Tooltip } from 'radix-ui'

import { Toaster } from '@/components/ui/sonner'
import { ThemeProvider } from '@/shared/theme/ThemeProvider'

import { createQueryClient } from './query-client'

interface AppProvidersProps {
  children: ReactNode
  /** Injected by tests so each test gets an isolated cache. */
  queryClient?: QueryClient
}

export function AppProviders({ children, queryClient }: AppProvidersProps) {
  const [client] = useState(() => queryClient ?? createQueryClient())

  return (
    <QueryClientProvider client={client}>
      <ThemeProvider>
        <Tooltip.Provider delayDuration={200}>
          {children}
          <Toaster position="bottom-center" />
        </Tooltip.Provider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
