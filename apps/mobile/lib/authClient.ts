import { expoClient } from '@better-auth/expo/client'
import type { AuthUser } from '@repo/types'
import type { BetterAuthClientPlugin } from 'better-auth'
import { createAuthClient } from 'better-auth/react'
import * as SecureStore from 'expo-secure-store'
import { API_URL } from './constants'

export type User = AuthUser

// The `as BetterAuthClientPlugin` cast works around a declaration mismatch in
// @better-auth/expo (its .d.ts references a bundled copy of @better-fetch's types,
// which TypeScript treats as incompatible with better-auth's own). Runtime is fine.
export const authClient = createAuthClient({
  baseURL: API_URL,
  plugins: [
    expoClient({
      // Must match the `scheme` in app.json — the API trusts `polarstarter://`.
      scheme: 'polarstarter',
      storage: SecureStore,
    }) as BetterAuthClientPlugin,
  ],
})

// The cast above erases the expo plugin's action typings, so re-surface the one
// action this app uses: the stored session cookie for authenticated fetches.
export function getSessionCookie(): string {
  return (authClient as unknown as { getCookie: () => string }).getCookie()
}
