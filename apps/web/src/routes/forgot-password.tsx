import { BrandLogo } from '@/components/BrandLogo'
import { authClient } from '@/lib/auth-client'
import { Button, Input, Label, TextField } from '@heroui/react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'

export const Route = createFileRoute('/forgot-password')({
  component: ForgotPasswordPage,
})

function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error: err } = await authClient.requestPasswordReset({
      email,
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (err) {
      setError(err.message ?? 'Something went wrong. Please try again.')
      setLoading(false)
      return
    }
    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm text-center">
          <Link to="/" className="inline-flex justify-center mb-8">
            <BrandLogo />
          </Link>
          <div className="mb-4 flex items-center justify-center">
            <span className="text-5xl">📬</span>
          </div>
          <h1 className="mb-3 text-xl font-semibold text-foreground tracking-[-0.02em]">Check your email</h1>
          <p className="mb-6 text-sm leading-relaxed" style={{ color: 'var(--color-muted)' }}>
            If an account exists for <strong className="text-foreground">{email}</strong>, we sent a password reset
            link. Check your inbox.
          </p>
          <Link
            to="/login"
            className="text-sm underline hover:text-foreground transition-colors"
            style={{ color: 'var(--color-muted)' }}
          >
            Back to sign in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex justify-center mb-6">
            <BrandLogo />
          </Link>
          <h1 className="text-xl font-semibold text-foreground tracking-[-0.02em]">Forgot your password?</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-muted)' }}>
            Enter your email and we'll send you a reset link.
          </p>
        </div>

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

          <Button
            type="submit"
            variant="primary"
            isDisabled={loading}
            className="mt-1 w-full rounded-xl py-2.5 text-sm font-semibold"
          >
            {loading ? 'Sending…' : 'Send reset link'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="text-sm underline hover:text-foreground transition-colors"
            style={{ color: 'var(--color-muted)' }}
          >
            ← Back to sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
