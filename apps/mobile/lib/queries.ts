import { useQuery } from '@tanstack/react-query'
import { getSubscription } from './api'
import { useAuth } from './store'

export function useSubscription() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['subscription'],
    queryFn: getSubscription,
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  })
}
