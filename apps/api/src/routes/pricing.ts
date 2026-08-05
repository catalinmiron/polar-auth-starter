import { Polar } from '@polar-sh/sdk'
import type { PricingProduct, PricingResponse } from '@repo/types'
import { Hono } from 'hono'
import type { Env } from '../env'
import { getCatalog } from '../products'

export const pricing = new Hono<{ Bindings: Env }>()

// Public pricing — driven entirely by the product catalog (src/products.ts).
// Fetches live prices from Polar so the pricing page never goes stale.
pricing.get('/', async (c) => {
  const polar = new Polar({
    accessToken: c.env.POLAR_ACCESS_TOKEN,
    server: c.env.POLAR_SERVER ?? 'sandbox',
  })

  const catalog = getCatalog(c.env)
  const fetched = await Promise.all(
    catalog.map((entry) => polar.products.get({ id: entry.productId }).catch(() => null)),
  )

  const products: PricingProduct[] = []
  for (let i = 0; i < catalog.length; i++) {
    const entry = catalog[i]
    const product = fetched[i]
    if (!product) continue

    let priceCents: number | null = null
    let currency = 'usd'
    for (const p of product.prices) {
      if (p.amountType === 'fixed') {
        priceCents = p.priceAmount
      } else if (p.amountType === 'seat_based') {
        // Per-seat price of the first tier.
        priceCents = p.seatTiers.tiers[0]?.pricePerSeat ?? null
      } else {
        continue
      }
      if ('priceCurrency' in p && typeof p.priceCurrency === 'string') currency = p.priceCurrency
      break
    }
    if (priceCents == null) continue

    products.push({
      slug: entry.slug,
      plan: entry.plan,
      interval: entry.interval,
      priceCents,
      currency,
      seatBased: entry.seatBased,
    })
  }

  c.header('Cache-Control', 'public, s-maxage=300')
  return c.json({ products } satisfies PricingResponse)
})
