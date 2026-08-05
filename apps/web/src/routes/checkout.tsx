import { redirectToCheckout } from '@/lib/auth-client'
import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { z } from 'zod'

const searchSchema = z.object({
  slug: z.string(),
})

export const Route = createFileRoute('/checkout')({
  validateSearch: searchSchema,
  component: CheckoutRedirectPage,
})

function CheckoutRedirectPage() {
  const { slug } = Route.useSearch()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    redirectToCheckout(slug).catch(() => {
      setError('Failed to start checkout. Please try again.')
    })
  }, [slug])

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="text-center">
          <p className="mb-4 text-sm" style={{ color: 'var(--color-danger)' }}>
            {error}
          </p>
          <a href="/pricing" className="text-sm underline" style={{ color: 'var(--color-accent)' }}>
            Back to pricing
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
        Redirecting to checkout…
      </p>
    </div>
  )
}
