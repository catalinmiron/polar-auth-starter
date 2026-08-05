import { BrandLogo } from '@/components/BrandLogo'
import { ProfileMenu } from '@/components/ProfileMenu'
import { ThemeToggle } from '@/components/ThemeToggle'
import { authClient, redirectToCheckout } from '@/lib/auth-client'
import { usePricingQuery, useSessionQuery } from '@/lib/queries'
import { CircleCheck } from '@gravity-ui/icons'
import { Button, Skeleton } from '@heroui/react'
import { PLAN_LABELS, type PricingInterval, type PricingProduct } from '@repo/types'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

export const Route = createFileRoute('/pricing')({
  component: PricingPage,
})

const FEATURES: Record<'free' | 'pro' | 'team', string[]> = {
  free: ['Email/password + social auth', 'Full account management', 'Community support'],
  pro: ['Everything in Free', 'All Pro features unlocked', 'Billing portal + invoices', 'Priority support'],
  team: ['Everything in Pro', 'Invite teammates by email', 'Seat-based billing', 'Shared team workspace'],
}

function formatPrice(product: PricingProduct) {
  const amount = product.priceCents / 100
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: product.currency || 'USD',
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount)
}

function PricingPage() {
  const { data: session } = useSessionQuery()
  const { data: pricing, isLoading } = usePricingQuery()
  const navigate = useNavigate()
  const [interval, setBillingInterval] = useState<PricingInterval>('month')
  const [pendingSlug, setPendingSlug] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const productFor = (plan: 'pro' | 'team') =>
    pricing?.products.find((p) => p.plan === plan && p.interval === interval) ?? null

  const startCheckout = async (slug: string) => {
    setPendingSlug(slug)
    setError(null)
    try {
      const { data } = await authClient.getSession()
      if (!data) {
        // Not signed in — bounce through login, which resumes the checkout.
        navigate({ to: '/login', search: { checkout: slug } })
        return
      }
      await redirectToCheckout(slug)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setPendingSlug(null)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b border-line bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center gap-6 px-4 py-3">
          <Link to="/" className="shrink-0">
            <BrandLogo />
          </Link>
          <div className="flex-1" />
          <ThemeToggle iconSize={15} />
          {session?.user ? (
            <ProfileMenu user={session.user} placement="bottom end" />
          ) : (
            <>
              <Link to="/login" className="text-sm transition-colors" style={{ color: 'var(--color-muted)' }}>
                Log in
              </Link>
              <Link
                to="/signup"
                className="rounded-lg px-4 py-2 text-sm font-semibold transition-all hover:opacity-90"
                style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-accent-ink)' }}
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-14">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-semibold tracking-[-0.02em]">Simple pricing</h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--color-muted)' }}>
            Start free. Upgrade when you need more.
          </p>

          {/* Interval toggle */}
          <div
            className="mt-6 inline-flex items-center gap-1 rounded-full border border-line p-1"
            style={{ backgroundColor: 'var(--color-surface)' }}
            role="group"
            aria-label="Billing interval"
          >
            {(['month', 'year'] as const).map((i) => (
              <button
                key={i}
                onClick={() => setBillingInterval(i)}
                aria-pressed={interval === i}
                className="rounded-full px-4 py-1.5 text-sm font-medium transition-colors"
                style={
                  interval === i
                    ? { backgroundColor: 'var(--color-accent)', color: 'var(--color-accent-ink)' }
                    : { color: 'var(--color-muted)' }
                }
              >
                {i === 'month' ? 'Monthly' : 'Annual'}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p
            className="mb-6 text-center text-sm font-medium px-3 py-2 rounded-lg"
            style={{
              color: 'var(--color-danger)',
              backgroundColor: 'color-mix(in oklch, var(--color-danger) 10%, transparent)',
            }}
          >
            {error}
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
          {/* Free */}
          <PlanCard
            name={PLAN_LABELS.free}
            price="$0"
            priceNote="forever"
            features={FEATURES.free}
            cta={
              session?.user ? (
                <Link to="/app/profile" className="w-full">
                  <Button variant="tertiary" className="w-full">
                    Go to your account
                  </Button>
                </Link>
              ) : (
                <Link to="/signup" className="w-full">
                  <Button variant="tertiary" className="w-full">
                    Get started
                  </Button>
                </Link>
              )
            }
          />

          {/* Pro */}
          <PlanCard
            name={PLAN_LABELS.pro}
            highlighted
            price={isLoading ? null : productFor('pro') ? formatPrice(productFor('pro')!) : '—'}
            priceNote={interval === 'month' ? 'per month' : 'per year'}
            features={FEATURES.pro}
            cta={
              <Button
                variant="primary"
                className="w-full"
                isDisabled={!productFor('pro')}
                isPending={pendingSlug === productFor('pro')?.slug}
                onPress={() => {
                  const product = productFor('pro')
                  if (product) startCheckout(product.slug)
                }}
              >
                Upgrade to Pro
              </Button>
            }
          />

          {/* Team */}
          <PlanCard
            name={PLAN_LABELS.team}
            price={isLoading ? null : productFor('team') ? formatPrice(productFor('team')!) : '—'}
            priceNote={interval === 'month' ? 'per seat / month' : 'per seat / year'}
            features={FEATURES.team}
            cta={
              <Button
                variant="tertiary"
                className="w-full"
                isDisabled={!productFor('team')}
                isPending={pendingSlug === productFor('team')?.slug}
                onPress={() => {
                  const product = productFor('team')
                  if (product) startCheckout(product.slug)
                }}
              >
                Upgrade to Team
              </Button>
            }
          />
        </div>

        <p className="mt-8 text-center text-xs" style={{ color: 'var(--color-faint)' }}>
          Payments and invoices are handled by Polar. Cancel anytime from the billing portal.
        </p>
      </main>
    </div>
  )
}

function PlanCard({
  name,
  price,
  priceNote,
  features,
  cta,
  highlighted = false,
}: {
  name: string
  price: string | null
  priceNote: string
  features: string[]
  cta: React.ReactNode
  highlighted?: boolean
}) {
  return (
    <div
      className="flex flex-col gap-5 rounded-xl border p-6"
      style={{
        backgroundColor: 'var(--color-surface)',
        borderColor: highlighted ? 'var(--color-accent)' : 'var(--color-line)',
      }}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">{name}</h2>
        {highlighted && (
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: 'var(--color-accent-soft)',
              color: 'var(--color-accent-soft-foreground)',
            }}
          >
            Popular
          </span>
        )}
      </div>

      <div>
        {price === null ? (
          <Skeleton className="h-8 w-20 rounded" />
        ) : (
          <p className="text-3xl font-semibold tracking-[-0.02em]">{price}</p>
        )}
        <p className="mt-1 text-xs" style={{ color: 'var(--color-muted)' }}>
          {priceNote}
        </p>
      </div>

      <ul className="flex flex-col gap-2.5 flex-1">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm" style={{ color: 'var(--color-foreground-2)' }}>
            <CircleCheck width={14} height={14} className="mt-0.5 shrink-0" style={{ color: 'var(--color-accent)' }} />
            {f}
          </li>
        ))}
      </ul>

      {cta}
    </div>
  )
}
