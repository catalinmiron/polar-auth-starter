// ─── Plans ──────────────────────────────────────────────────────────────
// The example lineup is Free / Pro / Team. Paid plans map to Polar products
// in apps/api/src/products.ts — adding a plan means extending these unions,
// adding the product(s) to the catalog, and (if seat-based) handling seats.

export type Plan = 'free' | 'pro' | 'team'
export type PaidPlan = Exclude<Plan, 'free'>

export const PLAN_LABELS: Record<Plan, string> = {
  free: 'Free',
  pro: 'Pro',
  team: 'Team',
}

// ─── Auth / user ────────────────────────────────────────────────────────

export type OnboardingStatus = 'none' | 'started' | 'dropped' | 'finished'

/**
 * The user shape shared by web and mobile clients. Matches better-auth's
 * user table plus the `onboardingStatus` additional field configured in
 * apps/api/src/auth.ts.
 */
export type AuthUser = {
  id: string
  name: string
  email: string
  emailVerified: boolean
  image?: string | null
  onboardingStatus?: OnboardingStatus
}

// ─── Billing / subscription ────────────────────────────────────────────

export type SubscriptionStatus = 'active' | 'canceled' | 'past_due'

export type Subscription = {
  id: string
  plan: PaidPlan
  status: SubscriptionStatus
  seats: number
  cancelAtPeriodEnd: boolean
  currentPeriodEnd: string | null
} | null

// ─── Team (seat-based plan) ────────────────────────────────────────────

export type TeamMemberStatus = 'pending' | 'claimed' | 'revoked'

export type TeamMember = {
  id: string
  email: string
  name: string | null
  role: string
  externalId: string | null
  customerId: string
  status: TeamMemberStatus
}

export type Team = {
  members: TeamMember[]
  seats: number
  customerId: string
} | null

// ─── Pricing (public /api/pricing payload) ─────────────────────────────

export type PricingInterval = 'month' | 'year'

export type PricingProduct = {
  /** Checkout slug — passed to the Polar checkout endpoint. */
  slug: string
  plan: PaidPlan
  interval: PricingInterval
  /** Price in cents for the base product (per seat when seatBased). */
  priceCents: number
  currency: string
  seatBased: boolean
}

export type PricingResponse = {
  products: PricingProduct[]
}

// ─── UI ─────────────────────────────────────────────────────────────────

export type ProfileTab = 'profile' | 'settings'
