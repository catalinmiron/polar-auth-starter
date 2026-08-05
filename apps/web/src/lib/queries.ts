import type { PricingResponse, Subscription, Team } from '@repo/types'
import { useQuery, useSuspenseQuery } from '@tanstack/react-query'
import { API_URL } from './config'

// ─── Query keys ───────────────────────────────────────────────────────────────
export const queryKeys = {
  subscription: () => ['subscription'] as const,
  team: () => ['team'] as const,
  pricing: () => ['pricing'] as const,
  accounts: () => ['accounts'] as const,
  session: () => ['session'] as const,
}

// ─── Fetch functions ──────────────────────────────────────────────────────────
export async function fetchSubscription(): Promise<Subscription> {
  const res = await fetch(`${API_URL}/api/user/subscription`, { credentials: 'include' })
  const data = (await res.json().catch(() => null)) as { subscription?: Subscription } | null
  return data?.subscription ?? null
}

export async function fetchTeam(): Promise<Team> {
  const res = await fetch(`${API_URL}/api/user/team`, { credentials: 'include' })
  const data = await res.json().catch(() => null)
  return data?.members ? data : null
}

export async function fetchPricing(): Promise<PricingResponse | null> {
  const res = await fetch(`${API_URL}/api/pricing`)
  if (!res.ok) return null
  return res.json().catch(() => null)
}

export async function fetchAccounts() {
  const { authClient } = await import('./auth-client')
  const result = await authClient.listAccounts().catch(() => ({ data: null }))
  return result.data ?? null
}

export async function fetchSession() {
  const { authClient } = await import('./auth-client')
  const { data } = await authClient.getSession()
  return data ?? null
}

// ─── Hooks ────────────────────────────────────────────────────────────────────
export function useSubscriptionQuery() {
  return useSuspenseQuery({
    queryKey: queryKeys.subscription(),
    queryFn: fetchSubscription,
  })
}

export function useTeamQuery() {
  return useSuspenseQuery({
    queryKey: queryKeys.team(),
    queryFn: fetchTeam,
  })
}

export function usePricingQuery() {
  return useQuery({
    queryKey: queryKeys.pricing(),
    queryFn: fetchPricing,
    staleTime: 5 * 60_000,
  })
}

export function useAccountsQuery() {
  return useQuery({
    queryKey: queryKeys.accounts(),
    queryFn: fetchAccounts,
    staleTime: 5 * 60_000,
  })
}

export function useSessionQuery() {
  return useQuery({
    queryKey: queryKeys.session(),
    queryFn: fetchSession,
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
  })
}

export function useSessionSuspenseQuery() {
  return useSuspenseQuery({
    queryKey: queryKeys.session(),
    queryFn: fetchSession,
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
  })
}
