export type { ProfileTab as Tab, Subscription, Team, TeamMember } from '@repo/types'
export { PLAN_LABELS } from '@repo/types'
export { API_URL } from '@/lib/config'

export const STATUS_DOT: Record<string, string> = {
  active: 'bg-success',
  canceling: 'bg-warning',
  past_due: 'bg-warning',
  canceled: 'bg-danger',
}
