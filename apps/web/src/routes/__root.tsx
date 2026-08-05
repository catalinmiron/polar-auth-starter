import { fetchSession, queryKeys } from '@/lib/queries'
import type { QueryClient } from '@tanstack/react-query'
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import { Toaster } from 'sonner'

import '../styles.css'

type RouterContext = { queryClient: QueryClient }

export const Route = createRootRouteWithContext<RouterContext>()({
  loader: ({ context: { queryClient } }) => {
    queryClient.prefetchQuery({ queryKey: queryKeys.session(), queryFn: fetchSession })
  },
  component: () => (
    <>
      <Outlet />
      <Toaster
        position="bottom-right"
        richColors
        theme="dark"
        toastOptions={{
          style: {
            background: 'var(--color-surface)',
            color: 'var(--color-foreground)',
            border: '1px solid var(--color-line)',
          },
        }}
      />
    </>
  ),
})
