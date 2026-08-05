import type { Subscription } from '@repo/types'
import { authFetch } from './auth'

export type { Subscription }

export async function getSubscription(): Promise<Subscription> {
  const res = await authFetch('/api/user/subscription')
  if (!res.ok) return null
  const data = (await res.json()) as { subscription?: Subscription } | Subscription
  // Support both a raw payload and a { subscription } envelope
  if (data && typeof data === 'object' && 'subscription' in data) {
    return (data as { subscription?: Subscription }).subscription ?? null
  }
  return (data as Subscription) ?? null
}
