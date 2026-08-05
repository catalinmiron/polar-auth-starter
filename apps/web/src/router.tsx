import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import { ErrorFallback } from './components/ErrorFallback'
import { queryClient } from './lib/query-client'
import { routeTree } from './routeTree.gen'

export function getRouter() {
  const router = createTanStackRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
    // Without this, any thrown render error unmounts the tree and leaves a
    // blank white page — no message and no reload affordance.
    defaultErrorComponent: ({ error, reset }) => <ErrorFallback error={error} reset={reset} />,
    context: { queryClient },
  })

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
