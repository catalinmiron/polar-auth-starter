import { SocialAuthButtons } from '@/components/auth/SocialAuthButtons'
import { BrandLogo } from '@/components/BrandLogo'
import { authClient } from '@/lib/auth-client'
import { Button, Input, Label, TextField } from '@heroui/react'
import { createFileRoute, Link, useSearch } from '@tanstack/react-router'
import { useState } from 'react'
import { z } from 'zod'

const searchSchema = z.object({
  checkout: z.string().optional(),
})

export const Route = createFileRoute('/signup')({
  validateSearch: searchSchema,
  component: SignupPage,
})

function SignupPage() {
  const { checkout } = useSearch({ from: '/signup' })

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [verificationSent, setVerificationSent] = useState(false)

  const socialCallbackURL = checkout
    ? `${window.location.origin}/checkout?slug=${encodeURIComponent(checkout)}`
    : `${window.location.origin}/app/profile`

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error: err } = await authClient.signUp.email({
      name,
      email,
      password,
      callbackURL: socialCallbackURL,
    })
    if (err) {
      setError(err.message ?? 'Something went wrong. Please try again.')
      setLoading(false)
      return
    }
    setVerificationSent(true)
    setLoading(false)
  }

  if (verificationSent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm text-center">
          <Link to="/" className="inline-flex justify-center mb-6">
            <BrandLogo />
          </Link>
          <div className="mb-4 flex items-center justify-center">
            <span className="text-5xl">📬</span>
          </div>
          <h1 className="mb-3 text-xl font-semibold text-foreground tracking-[-0.02em]">Check your email</h1>
          <p className="mb-6 text-sm leading-relaxed" style={{ color: 'var(--color-muted)' }}>
            We sent a verification link to <strong className="text-foreground">{email}</strong>. Click it to activate
            your account.
          </p>
          <p className="text-xs" style={{ color: 'var(--color-faint)' }}>
            Already verified?{' '}
            <Link to="/login" className="underline hover:text-foreground transition-colors">
              Sign in
            </Link>
          </p>
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
          <h1 className="text-xl font-semibold text-foreground tracking-[-0.02em]">Create your account</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-muted)' }}>
            Already have an account?{' '}
            <Link to="/login" className="underline hover:text-foreground transition-colors">
              Sign in
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
              role="alert"
              className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm"
              style={{ color: 'var(--color-danger)' }}
            >
              {error}
            </div>
          )}

          <TextField isRequired name="name" className="flex flex-col gap-1.5">
            <Label className="text-sm font-medium text-foreground-2">Name</Label>
            <Input
              autoFocus
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              variant="secondary"
            />
          </TextField>

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
            <Label className="text-sm font-medium text-foreground-2">Password</Label>
            <Input
              type="password"
              autoComplete="new-password"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              variant="secondary"
            />
          </TextField>

          <Button
            type="submit"
            variant="primary"
            isDisabled={loading}
            className="mt-1 w-full rounded-xl py-2.5 text-sm font-semibold"
          >
            {loading ? 'Creating account…' : 'Create account'}
          </Button>

          <p className="text-center text-xs" style={{ color: 'var(--color-faint)' }}>
            By signing up, you agree to our Terms of Service.
          </p>
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
