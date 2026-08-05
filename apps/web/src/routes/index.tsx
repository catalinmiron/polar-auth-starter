import { BrandLogo } from '@/components/BrandLogo'
import { ProfileMenu } from '@/components/ProfileMenu'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useSessionQuery } from '@/lib/queries'
import { CreditCard, LockOpen, Persons, ShieldCheck } from '@gravity-ui/icons'
import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: LandingPage,
})

const FEATURES = [
  {
    Icon: LockOpen,
    title: 'Auth done right',
    body: 'Email/password with verification, Google and GitHub social sign-in, password reset — all on better-auth.',
  },
  {
    Icon: CreditCard,
    title: 'Polar billing built in',
    body: 'Checkout, subscriptions, customer portal, and webhooks wired end to end with Polar.',
  },
  {
    Icon: Persons,
    title: 'Teams with seats',
    body: 'Seat-based team plans: invite by email, claim a seat, manage members from the billing portal.',
  },
  {
    Icon: ShieldCheck,
    title: 'Edge-native backend',
    body: 'Hono API on Cloudflare Workers with D1 (SQLite) via Drizzle — fast, cheap, and simple to deploy.',
  },
]

function LandingPage() {
  const { data: session } = useSessionQuery()
  const user = session?.user

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="sticky top-0 z-10 border-b border-line bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-4xl items-center gap-6 px-4 py-3">
          <Link to="/" className="shrink-0">
            <BrandLogo />
          </Link>
          <nav className="flex items-center gap-6 flex-1">
            <Link to="/pricing" className="text-sm transition-colors" style={{ color: 'var(--color-muted)' }}>
              Pricing
            </Link>
          </nav>
          <ThemeToggle iconSize={15} />
          {user ? (
            <>
              <Link
                to="/app/profile"
                className="hidden sm:block text-sm transition-colors"
                style={{ color: 'var(--color-muted)' }}
              >
                My account
              </Link>
              <ProfileMenu user={user} placement="bottom end" />
            </>
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

      <main className="mx-auto w-full max-w-4xl px-4 flex-1">
        {/* Hero */}
        <section className="py-20 text-center">
          <p
            className="inline-block text-xs font-mono font-medium uppercase tracking-widest mb-4 px-3 py-1 rounded-full"
            style={{ color: 'var(--color-accent-soft-foreground)', backgroundColor: 'var(--color-accent-soft)' }}
          >
            Open-source starter
          </p>
          <h1 className="text-4xl font-semibold tracking-[-0.02em] max-w-2xl mx-auto">
            Auth, billing, and teams — already wired.
          </h1>
          <p className="mt-4 text-base leading-relaxed max-w-xl mx-auto" style={{ color: 'var(--color-muted)' }}>
            Production-ready better-auth + Polar starter: email/password + social auth, teams with seat-based billing,
            and subscriptions on Cloudflare Workers + D1. Clone it, add your product, ship.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link
              to={user ? '/app/profile' : '/signup'}
              className="rounded-xl px-6 py-2.5 text-sm font-semibold transition-all hover:opacity-90 active:scale-95"
              style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-accent-ink)' }}
            >
              {user ? 'Go to your account' : 'Get started free'}
            </Link>
            <Link
              to="/pricing"
              className="rounded-xl border border-line px-6 py-2.5 text-sm font-medium transition-colors hover:bg-surface"
              style={{ color: 'var(--color-foreground-2)' }}
            >
              View pricing
            </Link>
          </div>
        </section>

        {/* Features */}
        <section className="pb-20 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {FEATURES.map(({ Icon, title, body }) => (
            <div
              key={title}
              className="rounded-xl border border-line p-5"
              style={{ backgroundColor: 'var(--color-surface)' }}
            >
              <div
                className="mb-3 flex items-center justify-center rounded-lg size-9"
                style={{ backgroundColor: 'var(--color-accent-soft)' }}
              >
                <Icon width={16} height={16} style={{ color: 'var(--color-accent-soft-foreground)' }} />
              </div>
              <h2 className="text-sm font-semibold">{title}</h2>
              <p className="mt-1 text-sm leading-relaxed" style={{ color: 'var(--color-muted)' }}>
                {body}
              </p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between px-4 py-6">
          <p className="text-xs" style={{ color: 'var(--color-faint)' }}>
            Polar Auth Starter — MIT licensed
          </p>
          <div className="flex items-center gap-4">
            <Link to="/pricing" className="text-xs transition-colors" style={{ color: 'var(--color-faint)' }}>
              Pricing
            </Link>
            <Link to="/login" className="text-xs transition-colors" style={{ color: 'var(--color-faint)' }}>
              Log in
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
