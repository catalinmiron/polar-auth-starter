import type { PaidPlan, PricingInterval } from '@repo/types'
import type { Env } from './env'

// ─── Product catalog ─────────────────────────────────────────────────────────
// THE single source of truth for plan ↔ Polar product mapping.
//
// To add a product: add the env var, add one entry here.
//
// Everything else derives from this catalog — checkout slugs (better-auth
// Polar plugin), webhook plan resolution (auth.ts), the subscription endpoint
// and the public pricing endpoint (routes/). Never compare productIds against
// env vars anywhere else.

export type CatalogEntry = {
  /** Checkout slug — the client starts checkout with { slug } via the Polar plugin. */
  slug: string
  plan: PaidPlan
  interval: PricingInterval
  /** Polar product ID (from the Polar dashboard, per environment). */
  productId: string
  /** Seat-based products bill per seat and unlock team member management. */
  seatBased: boolean
}

export function getCatalog(env: Env): CatalogEntry[] {
  const entries = [
    {
      slug: 'pro-monthly',
      plan: 'pro' as const,
      interval: 'month' as const,
      productId: env.POLAR_PRO_MONTHLY_PRODUCT_ID,
      seatBased: false,
    },
    {
      slug: 'pro-annual',
      plan: 'pro' as const,
      interval: 'year' as const,
      productId: env.POLAR_PRO_ANNUAL_PRODUCT_ID,
      seatBased: false,
    },
    {
      slug: 'team-monthly',
      plan: 'team' as const,
      interval: 'month' as const,
      productId: env.POLAR_TEAM_MONTHLY_PRODUCT_ID,
      seatBased: true,
    },
    {
      slug: 'team-annual',
      plan: 'team' as const,
      interval: 'year' as const,
      productId: env.POLAR_TEAM_ANNUAL_PRODUCT_ID,
      seatBased: true,
    },
  ]
  // Products whose env var is unset simply don't exist in this deployment.
  return entries.filter((e): e is CatalogEntry => Boolean(e.productId))
}

/** Resolve a Polar productId to a plan, or null when it's not in the catalog. */
export function planForProduct(env: Env, productId: string | null | undefined): PaidPlan | null {
  if (!productId) return null
  return getCatalog(env).find((e) => e.productId === productId)?.plan ?? null
}

/** True when the product is a seat-based (team) product. */
export function isSeatBasedProduct(env: Env, productId: string | null | undefined): boolean {
  if (!productId) return false
  return getCatalog(env).find((e) => e.productId === productId)?.seatBased ?? false
}

/** Product list for the better-auth Polar checkout plugin. */
export function checkoutProducts(env: Env): Array<{ productId: string; slug: string }> {
  return getCatalog(env).map((e) => ({ productId: e.productId, slug: e.slug }))
}
