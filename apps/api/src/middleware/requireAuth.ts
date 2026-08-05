import type { Context, Next } from 'hono'
import { createMiddleware } from 'hono/factory'
import { createAuth } from '../auth'
import type { Env } from '../env'

export type AuthVariables = {
  userId: string
  sessionId: string
}

export const requireAuth = createMiddleware<{ Bindings: Env; Variables: AuthVariables }>(
  async (c: Context<{ Bindings: Env; Variables: AuthVariables }>, next: Next) => {
    const auth = createAuth(c.env)
    const session = await auth.api.getSession({ headers: c.req.raw.headers })
    if (!session) return c.json({ error: 'Unauthorized' }, 401)
    c.set('userId', session.user.id)
    c.set('sessionId', session.session.id)
    await next()
  },
)
