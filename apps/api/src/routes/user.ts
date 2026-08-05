import { Polar } from '@polar-sh/sdk'
import {
  account as accountTable,
  createDb,
  invitation as invitationTable,
  member as memberTable,
  polarMembers,
  session as sessionTable,
  subscriptions,
  user as userTable,
  verification as verificationTable,
} from '@repo/db'
import type { OnboardingStatus } from '@repo/types'
import { and, eq, ne } from 'drizzle-orm'
import { Hono } from 'hono'
import { createAuth } from '../auth'
import type { Env } from '../env'
import { planForProduct } from '../products'

export const userRoutes = new Hono<{ Bindings: Env }>()

function mapStatus(status: string): 'active' | 'canceled' | 'past_due' {
  if (status === 'canceled') return 'canceled'
  if (status === 'active' || status === 'trialing') return 'active'
  return 'past_due'
}

function makePolar(env: Env) {
  return new Polar({ accessToken: env.POLAR_ACCESS_TOKEN, server: env.POLAR_SERVER ?? 'sandbox' })
}

type Db = ReturnType<typeof createDb>

// Find the owner's externalId for the team a given user belongs to (as a member).
// Only looks at role='member' rows — excludes the user's own 'owner' self-record that
// Polar creates when a new customer is registered.
// Falls back to email-based lookup when externalId hasn't been synced yet (e.g. webhook
// delay or race condition), and caches the resolved externalId for future calls.
async function getTeamOwnerExternalId(db: Db, userId: string): Promise<string | null> {
  // Primary: look up by externalId
  let memberCustomerId: string | null = null
  const [byId] = await db
    .select({ customerId: polarMembers.customerId })
    .from(polarMembers)
    .where(
      and(eq(polarMembers.externalId, userId), eq(polarMembers.role, 'member'), ne(polarMembers.status, 'revoked')),
    )
    .limit(1)
  memberCustomerId = byId?.customerId ?? null

  // Fallback: externalId may not be synced yet — look up by user email and cache the link
  if (!memberCustomerId) {
    const [u] = await db.select({ email: userTable.email }).from(userTable).where(eq(userTable.id, userId)).limit(1)
    if (u) {
      const [byEmail] = await db
        .select({ customerId: polarMembers.customerId, id: polarMembers.id })
        .from(polarMembers)
        .where(
          and(eq(polarMembers.email, u.email), eq(polarMembers.role, 'member'), ne(polarMembers.status, 'revoked')),
        )
        .limit(1)
      if (byEmail) {
        memberCustomerId = byEmail.customerId
        await db
          .update(polarMembers)
          .set({ externalId: userId, updatedAt: new Date() })
          .where(eq(polarMembers.id, byEmail.id))
      }
    }
  }

  if (!memberCustomerId) return null

  const [owner] = await db
    .select({ externalId: polarMembers.externalId, email: polarMembers.email })
    .from(polarMembers)
    .where(and(eq(polarMembers.customerId, memberCustomerId), eq(polarMembers.role, 'owner')))
    .limit(1)
  if (!owner) return null
  if (owner.externalId) return owner.externalId

  // Owner row exists but externalId wasn't synced yet — look up by email and cache it.
  const [ownerUser] = await db
    .select({ id: userTable.id })
    .from(userTable)
    .where(eq(userTable.email, owner.email))
    .limit(1)
  if (!ownerUser) return null

  await db
    .update(polarMembers)
    .set({ externalId: ownerUser.id, updatedAt: new Date() })
    .where(and(eq(polarMembers.customerId, memberCustomerId), eq(polarMembers.role, 'owner')))
  return ownerUser.id
}

// Return the team owner's subscription row if the user is an active team member.
async function getMemberTeamSubscription(db: Db, userId: string) {
  const ownerExternalId = await getTeamOwnerExternalId(db, userId)
  if (!ownerExternalId) return null
  const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.userId, ownerExternalId)).limit(1)
  return sub ?? null
}

async function getSessionOrFail(env: Env, headers: Headers) {
  const authInstance = createAuth(env)
  return authInstance.api.getSession({ headers })
}

// GET /api/user/subscription — resolve the user's plan from Polar, sync to DB.
// Falls back to the local subscriptions table (and team membership) when Polar
// is unreachable or not configured.
userRoutes.get('/subscription', async (c) => {
  const session = await getSessionOrFail(c.env, c.req.raw.headers)
  if (!session) return c.json({ error: 'Unauthorized' }, 401)

  const db = createDb(c.env.DB)
  const userId = session.user.id

  try {
    const polar = makePolar(c.env)
    const state = await polar.customers.getStateExternal({ externalId: userId })
    const activeSub = state.activeSubscriptions?.[0]

    if (!activeSub) {
      // Check if this user is a non-revoked team member — return the owner's subscription.
      const ownerSub = await getMemberTeamSubscription(db, userId)
      if (ownerSub) return c.json({ subscription: ownerSub })

      await db.delete(subscriptions).where(eq(subscriptions.userId, userId))
      return c.json({ subscription: null })
    }

    const plan = planForProduct(c.env, activeSub.productId)
    if (!plan) return c.json({ subscription: null })

    let seats = 1
    try {
      const fullSub = await polar.subscriptions.get({ id: activeSub.id })
      seats = fullSub.seats ?? 1
    } catch {}

    const row = {
      id: crypto.randomUUID(),
      userId,
      polarSubscriptionId: activeSub.id,
      plan,
      status: mapStatus(activeSub.status),
      seats,
      cancelAtPeriodEnd: activeSub.cancelAtPeriodEnd,
      currentPeriodEnd: activeSub.currentPeriodEnd,
      updatedAt: new Date(),
    }

    await db
      .insert(subscriptions)
      .values(row)
      .onConflictDoUpdate({
        target: subscriptions.polarSubscriptionId,
        set: {
          status: row.status,
          seats: row.seats,
          cancelAtPeriodEnd: row.cancelAtPeriodEnd,
          currentPeriodEnd: row.currentPeriodEnd,
          updatedAt: row.updatedAt,
        },
      })

    return c.json({ subscription: row })
  } catch {
    const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId)).limit(1)
    if (sub) return c.json({ subscription: sub })
    const ownerSub = await getMemberTeamSubscription(db, userId)
    return c.json({ subscription: ownerSub ?? null })
  }
})

// ─── Team management (Polar as source of truth) ──────────────────────────────

// GET /api/user/team — fetch members from Polar, sync to polar_members table.
userRoutes.get('/team', async (c) => {
  const session = await getSessionOrFail(c.env, c.req.raw.headers)
  if (!session) return c.json({ error: 'Unauthorized' }, 401)

  const userId = session.user.id
  const polar = makePolar(c.env)
  const db = createDb(c.env.DB)

  try {
    // May throw for email/password users who haven't gone through checkout yet
    // (no Polar customer created for them). Fall through to the team-member path in that case.
    let state: Awaited<ReturnType<typeof polar.customers.getStateExternal>> | null = null
    try {
      state = await polar.customers.getStateExternal({ externalId: userId })
    } catch {}

    // Guard by subscription product, not state.type — customers who bought a team
    // plan from an individual account have type null but still need member management.
    const activeSub = state?.activeSubscriptions?.[0]
    const hasTeamSub = planForProduct(c.env, activeSub?.productId) === 'team'

    // If not a team owner, check if this user is a member of someone else's team.
    let effectiveOwnerId = userId
    if (!hasTeamSub) {
      const ownerExternalId = await getTeamOwnerExternalId(db, userId)
      if (!ownerExternalId) return c.json({ members: [], seats: 1 })
      effectiveOwnerId = ownerExternalId
    }

    const page = await polar.members.listMembers({ externalCustomerId: effectiveOwnerId })
    const polarMemberList = page.result.items

    // Load existing DB values — status is webhook-driven, externalId may be locally resolved.
    const dbRows = await db
      .select({
        id: polarMembers.id,
        status: polarMembers.status,
        externalId: polarMembers.externalId,
      })
      .from(polarMembers)
    const dbMap = new Map(dbRows.map((r) => [r.id, r]))

    // Sync member data into our DB.
    // - Never overwrite status (only seat webhooks own that field).
    // - Never overwrite a non-null externalId with null — Polar may not have it, but we do.
    //   If both Polar and our DB have null, try to resolve from the user table by email.
    const now = new Date()
    for (const m of polarMemberList) {
      const existing = dbMap.get(m.id)
      const resolvedExternalId =
        m.externalId ?? // Polar has it
        existing?.externalId ?? // We already resolved it
        (await (async () => {
          // Last resort: look up by email
          const [u] = await db.select({ id: userTable.id }).from(userTable).where(eq(userTable.email, m.email)).limit(1)
          return u?.id ?? null
        })())

      await db
        .insert(polarMembers)
        .values({
          id: m.id,
          customerId: m.customerId,
          email: m.email,
          name: m.name ?? null,
          role: m.role ?? 'member',
          externalId: resolvedExternalId,
          status: existing?.status ?? 'pending',
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: polarMembers.id,
          set: {
            email: m.email,
            name: m.name ?? null,
            role: m.role ?? 'member',
            ...(resolvedExternalId ? { externalId: resolvedExternalId } : {}),
            updatedAt: now,
          },
        })
    }

    // Merge DB status and externalId into the response (DB is source of truth).
    const members = polarMemberList.map((m) => {
      const existing = dbMap.get(m.id)
      return {
        ...m,
        status: existing?.status ?? 'pending',
        externalId: m.externalId ?? existing?.externalId ?? null,
      }
    })

    // Catch-up: sync claimed/revoked Polar members into the better-auth org so
    // org membership reflects the current seat state.
    const [ownerOrgRow] = await db
      .select({ organizationId: memberTable.organizationId })
      .from(memberTable)
      .where(and(eq(memberTable.userId, effectiveOwnerId), eq(memberTable.role, 'owner')))
      .limit(1)
    if (ownerOrgRow) {
      const orgId = ownerOrgRow.organizationId
      const currentOrgMembers = await db
        .select({ userId: memberTable.userId })
        .from(memberTable)
        .where(eq(memberTable.organizationId, orgId))
      const orgMemberSet = new Set(currentOrgMembers.map((m) => m.userId))

      for (const pm of polarMemberList) {
        if (pm.role === 'owner') continue
        const dbRow = dbMap.get(pm.id)
        const resolvedId = pm.externalId ?? dbRow?.externalId ?? null
        const pmStatus = dbRow?.status ?? 'pending'
        if (!resolvedId) continue

        if (pmStatus === 'claimed' && !orgMemberSet.has(resolvedId)) {
          await db.insert(memberTable).values({
            id: crypto.randomUUID(),
            organizationId: orgId,
            userId: resolvedId,
            role: 'member',
            createdAt: now,
          })
          orgMemberSet.add(resolvedId)
        } else if (pmStatus === 'revoked' && orgMemberSet.has(resolvedId)) {
          await db
            .delete(memberTable)
            .where(
              and(
                eq(memberTable.userId, resolvedId),
                eq(memberTable.organizationId, orgId),
                ne(memberTable.role, 'owner'),
              ),
            )
          orgMemberSet.delete(resolvedId)
        }
      }
    }

    let seats = 1
    try {
      const subId = activeSub?.id ?? (await getMemberTeamSubscription(db, userId))?.polarSubscriptionId
      if (subId) {
        const full = await polar.subscriptions.get({ id: subId })
        seats = full.seats ?? 1
      }
    } catch {}

    return c.json({ members, seats, customerId: state?.id ?? null })
  } catch (e: any) {
    return c.json({ error: e.message ?? 'Failed to fetch team' }, 500)
  }
})

// POST /api/user/team/invite — assign a seat via Polar (Polar sends the invite email).
userRoutes.post('/team/invite', async (c) => {
  const session = await getSessionOrFail(c.env, c.req.raw.headers)
  if (!session) return c.json({ error: 'Unauthorized' }, 401)

  const { email } = await c.req.json<{ email: string }>()
  if (!email) return c.json({ error: 'Email required' }, 400)

  const polar = makePolar(c.env)

  try {
    const state = await polar.customers.getStateExternal({ externalId: session.user.id })
    const activeSub = state.activeSubscriptions?.[0]
    if (planForProduct(c.env, activeSub?.productId) !== 'team') return c.json({ error: 'No team subscription' }, 403)

    // If the invited email already has a platform account, link the seat to them immediately.
    const db = createDb(c.env.DB)
    const [existingUser] = await db
      .select({ id: userTable.id })
      .from(userTable)
      .where(eq(userTable.email, email))
      .limit(1)

    const seat = await polar.customerSeats.assignSeat({
      subscriptionId: activeSub!.id,
      email,
      ...(existingUser ? { externalMemberId: existingUser.id } : {}),
    })

    // Sync the seat/member into our DB. The webhook will also fire but this
    // ensures immediate consistency before the webhook arrives.
    if (seat.member) {
      const m = seat.member
      await db
        .insert(polarMembers)
        .values({
          id: m.id,
          customerId: m.customerId,
          email: m.email,
          name: m.name ?? null,
          role: m.role ?? 'member',
          externalId: existingUser?.id ?? m.externalId ?? null,
          status: seat.status as 'pending' | 'claimed' | 'revoked',
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: polarMembers.id,
          set: {
            email: m.email,
            name: m.name ?? null,
            role: m.role ?? 'member',
            externalId: existingUser?.id ?? m.externalId ?? null,
            status: seat.status as 'pending' | 'claimed' | 'revoked',
            updatedAt: new Date(),
          },
        })
    }

    return c.json({ seat })
  } catch (e: any) {
    console.error('[invite] error:', e)
    return c.json({ error: e.message ?? 'Failed to invite member' }, 500)
  }
})

// DELETE /api/user/team/member/:id — revoke the seat and remove the Polar member.
userRoutes.delete('/team/member/:id', async (c) => {
  const session = await getSessionOrFail(c.env, c.req.raw.headers)
  if (!session) return c.json({ error: 'Unauthorized' }, 401)

  const memberId = c.req.param('id')
  const polar = makePolar(c.env)

  try {
    // Revoke the seat first so Polar reflects the removal immediately.
    const state = await polar.customers.getStateExternal({ externalId: session.user.id })
    const activeSub = state.activeSubscriptions?.[0]
    if (activeSub) {
      const seatsList = await polar.customerSeats.listSeats({ subscriptionId: activeSub.id })
      const seat = seatsList.seats.find((s) => s.memberId === memberId)
      if (seat) {
        await polar.customerSeats.revokeSeat({ seatId: seat.id })
      }
    }

    await polar.members.deleteMember({ id: memberId })

    const db = createDb(c.env.DB)
    await db.delete(polarMembers).where(eq(polarMembers.id, memberId))

    return c.json({ ok: true })
  } catch (e: any) {
    return c.json({ error: e.message ?? 'Failed to remove member' }, 500)
  }
})

// ─── Account deletion ────────────────────────────────────────────────────────

userRoutes.delete('/account', async (c) => {
  const session = await getSessionOrFail(c.env, c.req.raw.headers)
  if (!session) return c.json({ error: 'Unauthorized' }, 401)

  const userId = session.user.id
  const polar = makePolar(c.env)
  const db = createDb(c.env.DB)

  try {
    const ownerExternalId = await getTeamOwnerExternalId(db, userId)

    if (ownerExternalId) {
      // User is a team member — revoke their seat and remove the member record.
      const [membership] = await db
        .select({ id: polarMembers.id })
        .from(polarMembers)
        .where(eq(polarMembers.externalId, userId))
        .limit(1)

      if (membership) {
        try {
          const ownerState = await polar.customers.getStateExternal({ externalId: ownerExternalId })
          const ownerSub = ownerState.activeSubscriptions?.[0]
          if (ownerSub) {
            const seatsList = await polar.customerSeats.listSeats({ subscriptionId: ownerSub.id })
            const seat = seatsList.seats.find((s) => s.memberId === membership.id)
            if (seat) await polar.customerSeats.revokeSeat({ seatId: seat.id })
          }
          await polar.members.deleteMember({ id: membership.id })
        } catch {}
        await db.delete(polarMembers).where(eq(polarMembers.id, membership.id))
      }
    } else {
      // User is a solo customer or team owner — delete the Polar customer entirely.
      // This cancels all active subscriptions and removes all members on their team.
      try {
        await polar.customers.deleteExternal({ externalId: userId })
      } catch {}
      await db.delete(subscriptions).where(eq(subscriptions.userId, userId))
      await db.delete(polarMembers).where(eq(polarMembers.externalId, userId))
    }

    // Delete all better-auth records in FK-safe order.
    const userMembers = await db.select({ id: memberTable.id }).from(memberTable).where(eq(memberTable.userId, userId))
    for (const m of userMembers) {
      await db.delete(invitationTable).where(eq(invitationTable.inviterId, m.id))
    }
    await db.delete(memberTable).where(eq(memberTable.userId, userId))
    await db.delete(sessionTable).where(eq(sessionTable.userId, userId))
    await db.delete(accountTable).where(eq(accountTable.userId, userId))
    await db.delete(verificationTable).where(eq(verificationTable.identifier, session.user.email))
    await db.delete(userTable).where(eq(userTable.id, userId))

    return c.json({ ok: true })
  } catch (e: any) {
    console.error('[delete-account] error:', e)
    return c.json({ error: e.message ?? 'Failed to delete account' }, 500)
  }
})

// ─── Onboarding status ───────────────────────────────────────────────────────

userRoutes.patch('/onboarding', async (c) => {
  const session = await getSessionOrFail(c.env, c.req.raw.headers)
  if (!session) return c.json({ error: 'Unauthorized' }, 401)

  const body = await c.req.json<{ status: Exclude<OnboardingStatus, 'none'> }>().catch(() => null)
  if (!body?.status) return c.json({ error: 'Missing status' }, 400)

  const { status } = body
  const db = createDb(c.env.DB)

  const [current] = await db
    .select({ onboardingStatus: userTable.onboardingStatus })
    .from(userTable)
    .where(eq(userTable.id, session.user.id))
    .limit(1)

  if (current?.onboardingStatus === 'finished' && status !== 'finished') {
    return c.json({ firstCompletion: false })
  }

  const firstCompletion = status === 'finished' && current?.onboardingStatus !== 'finished'

  await db.update(userTable).set({ onboardingStatus: status }).where(eq(userTable.id, session.user.id))

  return c.json({ firstCompletion })
})

// ─── Portal ───────────────────────────────────────────────────────────────────

userRoutes.get('/portal', async (c) => {
  const session = await getSessionOrFail(c.env, c.req.raw.headers)
  if (!session) return c.json({ error: 'Unauthorized' }, 401)

  const userId = session.user.id
  const polar = makePolar(c.env)

  try {
    const state = await polar.customers.getStateExternal({ externalId: userId })

    let customerSession
    if (state.type === 'team') {
      const page = await polar.members.listMembers({ externalCustomerId: userId })
      let teamMember = page.result.items.find(
        (m) => m.externalId === userId || m.email?.toLowerCase() === session.user.email.toLowerCase(),
      )
      if (!teamMember) {
        teamMember = await polar.members.createMember({
          customerId: state.id,
          email: session.user.email,
          externalId: userId,
        })
      }
      customerSession = await polar.customerSessions.create({ externalCustomerId: userId, memberId: teamMember.id })
    } else {
      customerSession = await polar.customerSessions.create({ externalCustomerId: userId })
    }

    return c.json({ url: customerSession.customerPortalUrl })
  } catch (e: any) {
    return c.json({ error: e.message ?? 'Failed to create billing portal' }, 500)
  }
})
