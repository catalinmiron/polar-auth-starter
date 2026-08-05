import type { Env } from './env'

/**
 * Extension point — called for every Polar `order.paid` webhook event.
 *
 * Wire product-specific fulfillment here (credits, license keys, usage
 * top-ups, one-time purchases, ...). Subscription lifecycle sync is already
 * handled by the dedicated handlers in src/auth.ts, so this hook only needs
 * to care about what a paid order should *grant*.
 *
 * `payload.data` is the Polar Order — useful fields include `productId`,
 * `customer.externalId` (our user.id) and `metadata`.
 */
export async function onOrderPaid(_env: Env, payload: { type: 'order.paid'; data: unknown }): Promise<void> {
  // no-op — wire product-specific fulfillment here (credits, license keys, ...)
  console.log('[order.paid] received order — no fulfillment configured', JSON.stringify(payload.data).slice(0, 200))
}
