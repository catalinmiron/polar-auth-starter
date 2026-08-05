import { polarClient } from '@polar-sh/better-auth/client'
import { organizationClient } from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react'
import { API_URL } from './config'

export const authClient = createAuthClient({
  baseURL: API_URL,
  plugins: [polarClient(), organizationClient()],
})

export type Session = typeof authClient.$Infer.Session
export type User = typeof authClient.$Infer.Session.user

export async function redirectToCheckout(slug: string) {
  const res = await fetch(`${API_URL}/api/auth/checkout`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      slug,
      successUrl: `${window.location.origin}/app/profile?upgraded=true`,
    }),
  })
  if (res.redirected) {
    window.location.href = res.url
    return
  }
  const data = await res.json().catch(() => null)
  if (data?.url) window.location.href = data.url
}
