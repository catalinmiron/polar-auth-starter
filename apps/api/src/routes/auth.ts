import { Hono } from 'hono'
import { createAuth } from '../auth'
import type { Env } from '../env'

export const auth = new Hono<{ Bindings: Env }>()

export const isProduction = (env: Env) => env.NODE_ENV === 'production'

// Browser origins allowed to call the API with credentials. Localhost only outside production:
// otherwise any page served from a visitor's own machine could make credentialed calls.
export function allowedOrigins(env: Env): string[] {
  const dev = isProduction(env) ? [] : ['http://localhost:3000', 'http://localhost:3001']
  return [env.WEB_URL, ...dev].filter(Boolean)
}

function addCorsHeaders(response: Response, origin: string): Response {
  const headers = new Headers(response.headers)
  headers.set('Access-Control-Allow-Origin', origin)
  headers.set('Access-Control-Allow-Credentials', 'true')
  headers.set('Vary', 'Origin')
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

// Handle CORS preflight manually — better-auth returns a native Response with
// immutable headers, so Hono's cors middleware can't append to it after the fact.
auth.options('/*', (c) => {
  const origin = c.req.header('Origin') ?? ''
  if (!allowedOrigins(c.env).includes(origin)) return c.text('Forbidden', 403)
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cookie',
      'Access-Control-Max-Age': '86400',
      Vary: 'Origin',
    },
  })
})

auth.all('/*', async (c) => {
  const origin = c.req.header('Origin') ?? ''
  let response: Response
  try {
    const authInstance = createAuth(c.env)
    response = await authInstance.handler(c.req.raw)
  } catch (err) {
    console.error('[auth] handler error:', err)
    const msg = isProduction(c.env) ? 'Internal error' : err instanceof Error ? err.message : String(err)
    response = Response.json({ error: msg }, { status: 500 })
  }
  if (allowedOrigins(c.env).includes(origin)) return addCorsHeaders(response, origin)
  return response
})
