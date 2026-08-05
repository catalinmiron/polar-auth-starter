import { authClient, getSessionCookie, type User } from './authClient'
import { API_URL } from './constants'

export type { User }

export async function getSession(): Promise<User | null> {
  try {
    const { data } = await authClient.getSession()
    return (data?.user as User) ?? null
  } catch {
    return null
  }
}

export async function signInWithEmail(email: string, password: string): Promise<User> {
  const { data, error } = await authClient.signIn.email({ email, password })
  if (error) {
    const msg = error.message ?? `Sign in failed (${error.status})`
    if (error.status === 403) {
      throw new Error(
        msg.toLowerCase().includes('verif')
          ? 'Please verify your email before signing in. Check your inbox for a verification link.'
          : 'Sign in failed. If you signed up with Google, use "Forgot password" on the web to set a password first.',
      )
    }
    throw new Error(msg)
  }
  return data!.user as User
}

export async function signUpWithEmail(name: string, email: string, password: string): Promise<void> {
  const { error } = await authClient.signUp.email({ name, email, password })
  if (error) throw new Error(error.message ?? `Sign up failed (${error.status})`)
}

export async function requestPasswordReset(email: string): Promise<void> {
  const { error } = await authClient.requestPasswordReset({ email })
  if (error) throw new Error(error.message ?? 'Something went wrong. Please try again.')
}

export async function signOut(): Promise<void> {
  try {
    await authClient.signOut()
  } catch {}
}

// For API requests — the expoClient plugin stores and replays the session cookie
export async function authFetch(path: string, options: RequestInit = {}, baseUrl?: string): Promise<Response> {
  const cookie = getSessionCookie()
  return fetch(`${baseUrl ?? API_URL}${path}`, {
    ...options,
    headers: {
      ...options.headers,
      ...(cookie ? { Cookie: cookie } : {}),
    },
    credentials: 'omit',
  })
}
