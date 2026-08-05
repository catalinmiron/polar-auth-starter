import { BrandLogo } from '@/components/BrandLogo'
import { authClient } from '@/lib/auth-client'
import { CircleCheckFill } from '@gravity-ui/icons'
import { Button, Input, Label, TextField } from '@heroui/react'
import { createFileRoute, Link, useSearch } from '@tanstack/react-router'
import { useState } from 'react'
import { z } from 'zod'

const searchSchema = z.object({
  token: z.string().optional(),
  error: z.string().optional(),
})

export const Route = createFileRoute('/reset-password')({
  validateSearch: searchSchema,
  component: ResetPasswordPage,
})

function ResetPasswordPage() {
  const { token, error: urlError } = useSearch({ from: '/reset-password' })

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(urlError ?? null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    if (!token) {
      setError('Invalid or missing reset token.')
      return
    }
    setLoading(true)
    setError(null)
    const { error: err } = await authClient.resetPassword({ newPassword: password, token })
    if (err) {
      setError(err.message ?? 'Something went wrong. Please try again.')
      setLoading(false)
      return
    }
    setDone(true)
    setLoading(false)
  }

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm text-center">
          <Link to="/" className="inline-flex justify-center mb-8">
            <BrandLogo />
          </Link>
          <h1 className="mb-3 text-xl font-semibold text-foreground tracking-[-0.02em]">Invalid link</h1>
          <p className="mb-6 text-sm" style={{ color: 'var(--color-muted)' }}>
            This password reset link is invalid or has expired.
          </p>
          <Link
            to="/forgot-password"
            className="text-sm underline hover:text-foreground transition-colors"
            style={{ color: 'var(--color-muted)' }}
          >
            Request a new link
          </Link>
        </div>
      </div>
    )
  }

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <style>{`
          @keyframes pa-icon-enter {
            from { opacity: 0; transform: scale(0.4); }
            to   { opacity: 1; transform: scale(1); }
          }
          @keyframes pa-ring-burst {
            0%   { opacity: 0.55; transform: scale(1); }
            100% { opacity: 0;    transform: scale(2.9); }
          }
          @keyframes pa-glow-in {
            from { opacity: 0; transform: scale(0.5); }
            to   { opacity: 1; transform: scale(1); }
          }
          @keyframes pa-breathe {
            0%, 100% { transform: scale(1); }
            50%       { transform: scale(1.045); }
          }
          @keyframes pa-slide-up {
            from { opacity: 0; transform: translateY(16px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @media (prefers-reduced-motion: reduce) {
            * { animation: none !important; opacity: 1 !important; transform: none !important; }
          }
        `}</style>

        <div className="w-full max-w-sm text-center">
          <Link
            to="/"
            className="inline-flex justify-center mb-10"
            style={{ animation: 'pa-slide-up 0.35s cubic-bezier(0.16,1,0.3,1) both' }}
          >
            <BrandLogo />
          </Link>

          <div className="relative flex items-center justify-center mb-7" style={{ height: 88 }}>
            {/* Soft glow behind icon */}
            <div
              style={{
                position: 'absolute',
                width: 80,
                height: 80,
                borderRadius: '50%',
                background:
                  'radial-gradient(circle, color-mix(in oklch, var(--color-success) 22%, transparent) 0%, transparent 70%)',
                animation: 'pa-glow-in 0.6s cubic-bezier(0.16,1,0.3,1) 0.2s both',
              }}
            />
            {/* First ring burst */}
            <div
              style={{
                position: 'absolute',
                width: 58,
                height: 58,
                borderRadius: '50%',
                border: '1.5px solid var(--color-success)',
                animation: 'pa-ring-burst 0.75s cubic-bezier(0.16,1,0.3,1) 0.12s both',
              }}
            />
            {/* Second ring burst — delayed */}
            <div
              style={{
                position: 'absolute',
                width: 58,
                height: 58,
                borderRadius: '50%',
                border: '1px solid var(--color-success)',
                animation: 'pa-ring-burst 0.85s cubic-bezier(0.16,1,0.3,1) 0.48s both',
              }}
            />
            {/* Icon — enters then breathes */}
            <div
              style={{
                animation:
                  'pa-icon-enter 0.42s cubic-bezier(0.16,1,0.3,1) both, pa-breathe 2.8s ease-in-out 0.9s infinite',
              }}
            >
              <CircleCheckFill width={54} height={54} style={{ color: 'var(--color-success)', display: 'block' }} />
            </div>
          </div>

          <h1
            className="mb-2 text-xl font-semibold text-foreground tracking-[-0.02em]"
            style={{ animation: 'pa-slide-up 0.4s cubic-bezier(0.16,1,0.3,1) 0.28s both' }}
          >
            Password updated
          </h1>
          <p
            className="mb-8 text-sm leading-relaxed"
            style={{ color: 'var(--color-muted)', animation: 'pa-slide-up 0.4s cubic-bezier(0.16,1,0.3,1) 0.38s both' }}
          >
            Sign in with your new password whenever you're ready.
          </p>
          <div style={{ animation: 'pa-slide-up 0.4s cubic-bezier(0.16,1,0.3,1) 0.48s both' }}>
            <Link to="/login">
              <Button variant="primary" className="rounded-xl px-6 py-2.5 text-sm font-semibold">
                Sign in
              </Button>
            </Link>
          </div>
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
          <h1 className="text-xl font-semibold text-foreground tracking-[-0.02em]">Set a new password</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-muted)' }}>
            Choose a strong password for your account.
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

          <TextField isRequired name="password" className="flex flex-col gap-1.5">
            <Label className="text-sm font-medium text-foreground-2">New password</Label>
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

          <TextField isRequired name="confirm" className="flex flex-col gap-1.5">
            <Label className="text-sm font-medium text-foreground-2">Confirm password</Label>
            <Input
              type="password"
              autoComplete="new-password"
              minLength={8}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repeat your password"
              variant="secondary"
            />
          </TextField>

          <Button
            type="submit"
            variant="primary"
            isDisabled={loading}
            className="mt-1 w-full rounded-xl py-2.5 text-sm font-semibold"
          >
            {loading ? 'Updating…' : 'Update password'}
          </Button>
        </form>
      </div>
    </div>
  )
}
