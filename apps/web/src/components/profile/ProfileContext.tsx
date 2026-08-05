import { authClient } from '@/lib/auth-client'
import { queryKeys, useSubscriptionQuery, useTeamQuery } from '@/lib/queries'
import type { Subscription, Team, TeamMember } from '@repo/types'
import { useQueryClient } from '@tanstack/react-query'
import { createContext, useCallback, useContext, type ReactNode } from 'react'
import { PLAN_LABELS } from './types'

type User = { id: string; name: string; email: string; image?: string | null }

type ProfileContextValue = {
  user: User
  subscription: Subscription
  team: Team
  planLabel: string
  isTeam: boolean
  isOwner: boolean
  teamOwner: TeamMember | null
  canManageBilling: boolean
  members: TeamMember[]
  refreshPlan: () => Promise<void>
}

export const ProfileContext = createContext<ProfileContextValue | null>(null)

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { data: session } = authClient.useSession()
  const { data: subscription } = useSubscriptionQuery()
  const { data: team } = useTeamQuery()
  const queryClient = useQueryClient()

  const refreshPlan = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.subscription() }),
      queryClient.invalidateQueries({ queryKey: queryKeys.team() }),
    ])
  }, [queryClient])

  if (!session) return null

  const user = session.user as User
  const members = team?.members ?? []
  const planLabel = subscription ? (PLAN_LABELS[subscription.plan] ?? subscription.plan) : 'Free'
  const isTeam = subscription?.plan === 'team'
  const currentMember = members.find(
    (m) => m.externalId === user.id || m.email?.toLowerCase() === user.email?.toLowerCase(),
  )
  const isOwner = currentMember?.role === 'owner' || (!currentMember && isTeam)
  const teamOwner = !isOwner ? (members.find((m) => m.role === 'owner') ?? null) : null
  const canManageBilling = !!subscription && (subscription.plan !== 'team' || isOwner)

  return (
    <ProfileContext.Provider
      value={{
        user,
        subscription,
        team,
        planLabel,
        isTeam,
        isOwner,
        teamOwner,
        canManageBilling,
        members,
        refreshPlan,
      }}
    >
      {children}
    </ProfileContext.Provider>
  )
}

export function useProfile() {
  const ctx = useContext(ProfileContext)
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider')
  return ctx
}
