import { SocialAuthButtons } from '@/components/auth/SocialAuthButtons'
import { BrandLogo } from '@/components/BrandLogo'
import { authClient, redirectToCheckout } from '@/lib/auth-client'
import { Button, Input, Label, TextField } from '@heroui/react'
import { createFileRoute, Link, useSearch } from '@tanstack/react-router'
import { useState } from 'react'
import { z } from 'zod'

const searchSchema = z.object({
  redirect: z.string().optional(),
  checkout: z.string().optional(),
})

export const Route = createFileRoute('/login')({
  validateSearch: searchSchema,
  component: LoginPage,
})

function LoginPage() {
  const { redirect: redirectTo, checkout } = useSearch({ from: '/login' })

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [needsVerification, setNeedsVerification] = useState(false)
  const [resendSent, setResendSent] = useState(false)
  const [resending, setResending] = useState(false)

  const socialCallbackURL = checkout
    ? `${window.location.origin}/checkout?slug=${checkout}`
    : redirectTo
      ? redirectTo.startsWith('http')
        ? redirectTo
        : `${window.location.origin}${redirectTo}`
      : `${window.location.origin}/app/profile`

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setNeedsVerification(false)
    const { error: err } = await authClient.signIn.email({ email, password })
    if (err) {
      if (err.status === 403 || err.message?.toLowerCase().includes('verif')) {
        setNeedsVerification(true)
      } else {
        setError(err.message ?? 'Invalid email or password.')
      }
      setLoading(false)
      return
    }
    if (checkout) {
      await redirectToCheckout(checkout)
    } else {
      window.location.href = redirectTo ?? '/app/profile'
    }
  }

  const handleResend = async () => {
    setResending(true)
    await authClient.sendVerificationEmail({ email, callbackURL: socialCallbackURL })
    setResendSent(true)
    setResending(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex justify-center mb-6">
            <BrandLogo />
          </Link>
          <h1 className="text-xl font-semibold text-foreground tracking-[-0.02em]">Sign in to your account</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-muted)' }}>
            Don't have an account?{' '}
            <Link to="/signup" className="underline hover:text-foreground transition-colors">
              Sign up
            </Link>
          </p>
        </div>

        <SocialAuthButtons callbackURL={socialCallbackURL} />

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 rounded-xl border border-line p-6"
          style={{ backgroundColor: 'var(--color-surface)' }}
        >
          {error && (
            <div
              className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm"
              style={{ color: 'var(--color-danger)' }}
            >
              {error}
            </div>
          )}

          {needsVerification && (
            <div className="rounded-lg border border-line bg-surface px-3 py-2.5 text-sm flex flex-col gap-1.5">
              <span className="font-medium text-foreground">Email not verified</span>
              <span style={{ color: 'var(--color-muted)' }}>Check your inbox for the verification link.</span>
              {resendSent ? (
                <span className="text-xs" style={{ color: 'var(--color-accent)' }}>
                  Verification email resent!
                </span>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  isDisabled={resending}
                  onPress={handleResend}
                  className="self-start h-auto p-0 text-xs underline data-[hover]:no-underline"
                  style={{ color: 'var(--color-accent)' }}
                >
                  {resending ? 'Sending…' : 'Resend verification email'}
                </Button>
              )}
            </div>
          )}

          <TextField isRequired name="email" className="flex flex-col gap-1.5">
            <Label className="text-sm font-medium text-foreground-2">Email</Label>
            <Input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              variant="secondary"
            />
          </TextField>

          <TextField isRequired name="password" className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-foreground-2">Password</Label>
              <Link
                to="/forgot-password"
                className="text-xs underline hover:text-foreground transition-colors"
                style={{ color: 'var(--color-muted)' }}
              >
                Forgot password?
              </Link>
            </div>
            <Input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              variant="secondary"
            />
          </TextField>

          <Button
            type="submit"
            variant="primary"
            isDisabled={loading}
            className="mt-1 w-full rounded-xl py-2.5 text-sm font-semibold"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>

        <div className="mt-6 flex justify-center">
          <Link to="/" className="text-xs hover:text-muted transition-colors" style={{ color: 'var(--color-faint)' }}>
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
