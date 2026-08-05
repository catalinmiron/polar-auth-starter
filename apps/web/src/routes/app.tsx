import { authClient } from '@/lib/auth-client'
import { queryKeys } from '@/lib/queries'
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

function AppPending() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background">
      <div className="size-5 rounded-full border-2 border-accent/30 border-t-accent animate-spin" />
    </div>
  )
}

export const Route = createFileRoute('/app')({
  beforeLoad: async ({ context: { queryClient }, location }) => {
    const { data: session } = await authClient.getSession()
    if (!session) {
      // Send the user back to the page they were trying to reach after login.
      throw redirect({ to: '/login', search: { redirect: location.href } })
    }
    queryClient.setQueryData(queryKeys.session(), session)
  },
  pendingComponent: AppPending,
  pendingMs: 200,
  component: () => <Outlet />,
})
