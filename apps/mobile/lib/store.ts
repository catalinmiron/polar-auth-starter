import { observable } from '@legendapp/state'
import { useSelector } from '@legendapp/state/react'
import type { AuthUser } from '@repo/types'

export const auth$ = observable<{
  user: AuthUser | null
  loading: boolean
}>({
  user: null,
  loading: true,
})

export function useAuth() {
  const user = useSelector(() => auth$.user.get())
  const loading = useSelector(() => auth$.loading.get())
  return {
    user,
    loading,
    setUser: (u: AuthUser | null) => auth$.user.set(u),
  }
}
