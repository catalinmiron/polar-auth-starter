import { Hono } from 'hono'
import { cors } from 'hono/cors'

import type { Env } from './env'
import { allowedOrigins, auth } from './routes/auth'
import { pricing } from './routes/pricing'
import { userRoutes } from './routes/user'

const app = new Hono<{ Bindings: Env }>()

// Auth routes handle their own CORS (better-auth returns a native Response with
// immutable headers that Hono's cors middleware can't modify after the fact).
// Apply Hono CORS only to non-auth app routes.
const appCors = cors({
  origin: (origin, c) => (allowedOrigins(c.env as Env).includes(origin) ? origin : undefined),
  credentials: true,
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
})
app.use('/api/user/*', appCors)
app.use('/api/pricing', appCors)

app.get('/', (c) => c.json({ status: 'ok', version: '1.0.0' }))

// Auth + Polar webhooks — better-auth handles /api/auth/polar/webhooks internally
app.route('/api/auth', auth)
app.route('/api/pricing', pricing)
app.route('/api/user', userRoutes)

export default app
