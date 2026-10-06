/**
 * Only same-origin paths may be used as a post-login destination. `?redirect=https://evil.com` or
 * `//evil.com` would otherwise send a freshly signed-in user to someone else's page.
 */
export function safeRedirectPath(value: string | undefined, fallback = '/app/profile'): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return fallback
  try {
    const url = new URL(value, window.location.origin)
    return url.origin === window.location.origin ? url.pathname + url.search + url.hash : fallback
  } catch {
    return fallback
  }
}
