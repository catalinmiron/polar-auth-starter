import { expo } from '@better-auth/expo'
import { checkout, polar, portal, webhooks } from '@polar-sh/better-auth'
import { Polar } from '@polar-sh/sdk'
import {
  account,
  createDb,
  invitation,
  member,
  organization,
  polarMembers,
  session,
  subscriptions,
  user,
  verification,
} from '@repo/db'
import { APIError, betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { organization as organizationPlugin } from 'better-auth/plugins/organization'
import { and, eq, isNull, ne } from 'drizzle-orm'
import type { Env } from './env'
import { onOrderPaid } from './hooks'
import { checkoutProducts, planForProduct } from './products'

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]!)

function mapStatus(status: string): 'active' | 'canceled' | 'past_due' {
  if (status === 'canceled') return 'canceled'
  if (status === 'active' || status === 'trialing') return 'active'
  return 'past_due'
}

export function createAuth(env: Env) {
  const db = createDb(env.DB)

  const fromName = env.EMAIL_FROM_NAME || 'Acme'
  const fromEmail = env.EMAIL_FROM || 'noreply@example.com'

  // Minimal, unbranded transactional email shell. Swap for your own template.
  const emailHtml = (opts: { heading: string; body: string; ctaLabel: string; ctaUrl: string; footer: string }) =>
    `<!DOCTYPE html><html><body style="font-family:sans-serif;background:#f5f5f5;color:#1a1a1a;padding:40px 20px;margin:0"><div style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;padding:32px"><p style="font-size:18px;font-weight:700;margin:0 0 32px;letter-spacing:-0.01em">${escapeHtml(fromName)}</p><h1 style="font-size:22px;font-weight:600;margin:0 0 12px">${opts.heading}</h1><p style="color:#555;margin:0 0 28px">${opts.body}</p><a href="${opts.ctaUrl}" style="display:inline-block;background:#1a1a1a;color:#fff;text-decoration:none;padding:12px 28px;border-radius:10px;font-size:14px;font-weight:600">${opts.ctaLabel}</a><p style="color:#999;font-size:12px;margin:24px 0 0">${opts.footer}</p></div></body></html>`

  async function checkSeatLimit(organizationId: string) {
    const [owner] = await db
      .select()
      .from(member)
      .where(and(eq(member.organizationId, organizationId), eq(member.role, 'owner')))
      .limit(1)
    if (!owner) return

    const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.userId, owner.userId)).limit(1)
    if (!sub || sub.status !== 'active') {
      throw new APIError('FORBIDDEN', { message: 'No active subscription.' })
    }

    const currentMembers = await db
      .select({ id: member.id })
      .from(member)
      .where(eq(member.organizationId, organizationId))
    if (currentMembers.length >= sub.seats) {
      throw new APIError('FORBIDDEN', {
        message: `Seat limit reached (${sub.seats} seat${sub.seats !== 1 ? 's' : ''}). Upgrade your plan to add more members.`,
      })
    }
  }

  const polarClient = new Polar({
    accessToken: env.POLAR_ACCESS_TOKEN,
    server: env.POLAR_SERVER ?? 'sandbox',
  })

  const mobileScheme = env.MOBILE_APP_SCHEME || 'polarstarter'

  return betterAuth({
    // BETTER_AUTH_SECRET and BETTER_AUTH_URL are read from env automatically,
    // but Cloudflare Workers don't expose process.env — pass them explicitly.
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,

    database: drizzleAdapter(db, {
      provider: 'sqlite',
      schema: { user, session, account, verification, organization, member, invitation },
    }),

    trustedOrigins: [
      env.WEB_URL,
      // Mobile app deep-link scheme (standalone builds)
      `${mobileScheme}://`,
      // Local web dev servers and Expo Go (exp:// with the LAN IP): never trusted in production.
      ...(env.NODE_ENV === 'production' ? [] : ['http://localhost:3000', 'http://localhost:3001', 'exp://**']),
    ],

    user: {
      additionalFields: {
        onboardingStatus: {
          type: 'string',
          defaultValue: 'none',
          input: false,
        },
      },
    },

    emailAndPassword: {
      enabled: true,
      requireEmailVerification: env.REQUIRE_EMAIL_VERIFICATION !== 'false',
      sendResetPassword: async ({ user, url }) => {
        if (!env.EMAIL) {
          console.log(`[email] reset link for ${user.email}: ${url}`)
          return
        }
        await env.EMAIL.send({
          from: { name: fromName, email: fromEmail },
          to: user.email,
          subject: 'Reset your password',
          html: emailHtml({
            heading: 'Reset your password',
            body: `Hi ${escapeHtml(user.name || user.email)},<br><br>Click the button below to reset your password. The link expires in 1 hour.`,
            ctaLabel: 'Reset password',
            ctaUrl: url,
            footer: "If you didn't request a password reset, you can safely ignore this email.",
          }),
        })
      },
    },

    account: {
      accountLinking: {
        enabled: true,
        // A trusted provider links even when it does not vouch for the email. Google always verifies
        // it; GitHub can return an unverified address, so GitHub links only when it says verified.
        trustedProviders: ['google'],
      },
    },

    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user, url }) => {
        if (!env.EMAIL) {
          console.log(`[email] verify link for ${user.email}: ${url}`)
          return
        }
        await env.EMAIL.send({
          from: { name: fromName, email: fromEmail },
          to: user.email,
          subject: 'Verify your email',
          html: emailHtml({
            heading: 'Verify your email',
            body: `Hi ${escapeHtml(user.name || user.email)},<br><br>Click the button below to verify your email address and activate your account.`,
            ctaLabel: 'Verify email',
            ctaUrl: url,
            footer: "If you didn't create an account, you can safely ignore this email.",
          }),
        })
      },
    },

    databaseHooks: {
      user: {
        create: {
          // When a new user registers:
          // 1. Link ALL polar_members rows with matching email (seat invites + owner rows).
          // 2. For OAuth users (emailVerified=true from provider), create Polar customer immediately.
          //    For email/password users, customer is created after email verification via checkout.
          //    If a customer with that email already exists in Polar, catch the error and continue.
          // No-ops on the Polar side when POLAR_ACCESS_TOKEN is unset (local dev without Polar).
          after: async (newUser) => {
            // Seats are matched by email, so only an address the user has proven they own may claim
            // one. Unverified users are linked lazily once verified (see getTeamOwnerExternalId).
            if (!newUser.emailVerified) return
            await db
              .update(polarMembers)
              .set({ externalId: newUser.id, updatedAt: new Date() })
              .where(and(eq(polarMembers.email, newUser.email), isNull(polarMembers.externalId)))

            if (newUser.emailVerified && env.POLAR_ACCESS_TOKEN) {
              try {
                await polarClient.customers.create({
                  email: newUser.email,
                  name: newUser.name ?? undefined,
                  externalId: newUser.id,
                })
              } catch {
                // Customer already exists in Polar — continue.
              }
            }
          },
        },
      },
    },

    socialProviders: {
      ...(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET
        ? {
            github: { clientId: env.GITHUB_CLIENT_ID, clientSecret: env.GITHUB_CLIENT_SECRET },
          }
        : {}),
      ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
        ? {
            google: { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET },
          }
        : {}),
    },

    plugins: [
      expo(),
      organizationPlugin({
        // Team orgs are created by the subscription webhook; clients cannot mint their own.
        allowUserToCreateOrganization: false,
        organizationHooks: {
          beforeAddMember: async ({ organization: orgData }) => {
            await checkSeatLimit(orgData.id)
          },
          beforeCreateInvitation: async ({ organization: orgData }) => {
            await checkSeatLimit(orgData.id)
          },
        },
      }),
      polar({
        client: polarClient,
        createCustomerOnSignUp: false,
        use: [
          checkout({
            // All plan ↔ product mapping lives in src/products.ts.
            products: checkoutProducts(env),
            // Client overrides this per-request via body.successUrl; this is the fallback.
            // Must be absolute — Polar rejects relative URLs.
            successUrl: `${env.WEB_URL}/app/profile?upgraded=true`,
            authenticatedUsersOnly: true,
          }),
          portal(),
          webhooks({
            secret: env.POLAR_WEBHOOK_SECRET,
            // Generic handler — fires for every event. Used for member sync since
            // better-auth doesn't expose dedicated member.* callbacks.
            onPayload: async (payload) => {
              const now = new Date()

              // One-time purchases / order fulfillment — product-specific, so the
              // starter only exposes an extension point (see src/hooks.ts).
              if (payload.type === 'order.paid') {
                await onOrderPaid(env, payload)
                return
              }

              // Member lifecycle — sync basic member data
              if (payload.type === 'member.created' || payload.type === 'member.updated') {
                const m = payload.data
                // Resolve externalId: prefer what Polar sends, fall back to a DB lookup
                // by email so rows are linked even when the user already exists on platform.
                let resolvedExternalId: string | null = m.externalId ?? null
                if (!resolvedExternalId) {
                  const [existingUser] = await db
                    .select({ id: user.id })
                    .from(user)
                    .where(and(eq(user.email, m.email), eq(user.emailVerified, true)))
                    .limit(1)
                  resolvedExternalId = existingUser?.id ?? null
                }
                await db
                  .insert(polarMembers)
                  .values({
                    id: m.id,
                    customerId: m.customerId,
                    email: m.email,
                    name: m.name ?? null,
                    role: m.role ?? 'member',
                    externalId: resolvedExternalId,
                    status: 'pending',
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
              if (payload.type === 'member.deleted') {
                await db.delete(polarMembers).where(eq(polarMembers.id, payload.data.id))
              }

              // Seat lifecycle — source of truth for status.
              // Also resolve externalId from email so pre-existing users get linked.
              if (
                payload.type === 'customer_seat.assigned' ||
                payload.type === 'customer_seat.claimed' ||
                payload.type === 'customer_seat.revoked'
              ) {
                const seat = payload.data
                const status = seat.status as 'pending' | 'claimed' | 'revoked'
                const memberId = seat.memberId ?? seat.member?.id
                const seatEmail = seat.email ?? seat.member?.email

                // Resolve externalId from the seat's email if available.
                let resolvedExternalId: string | null = null
                if (seatEmail) {
                  const [existingUser] = await db
                    .select({ id: user.id })
                    .from(user)
                    .where(and(eq(user.email, seatEmail), eq(user.emailVerified, true)))
                    .limit(1)
                  resolvedExternalId = existingUser?.id ?? null
                }

                const updateFields = {
                  status,
                  updatedAt: now,
                  ...(resolvedExternalId ? { externalId: resolvedExternalId } : {}),
                }

                if (memberId) {
                  await db.update(polarMembers).set(updateFields).where(eq(polarMembers.id, memberId))
                } else if (seatEmail) {
                  await db.update(polarMembers).set(updateFields).where(eq(polarMembers.email, seatEmail))
                }

                // Sync better-auth org membership so team members share an organization.
                // claimed → add to org; revoked → remove from org.
                if ((status === 'claimed' || status === 'revoked') && resolvedExternalId && memberId) {
                  const [pmRow] = await db
                    .select({ customerId: polarMembers.customerId })
                    .from(polarMembers)
                    .where(eq(polarMembers.id, memberId))
                    .limit(1)
                  if (pmRow?.customerId) {
                    const [ownerRow] = await db
                      .select({ externalId: polarMembers.externalId })
                      .from(polarMembers)
                      .where(and(eq(polarMembers.customerId, pmRow.customerId), eq(polarMembers.role, 'owner')))
                      .limit(1)
                    if (ownerRow?.externalId) {
                      const [ownerOrg] = await db
                        .select({ organizationId: member.organizationId })
                        .from(member)
                        .where(and(eq(member.userId, ownerRow.externalId), eq(member.role, 'owner')))
                        .limit(1)
                      if (ownerOrg) {
                        if (status === 'claimed') {
                          const [existing] = await db
                            .select({ id: member.id })
                            .from(member)
                            .where(
                              and(
                                eq(member.userId, resolvedExternalId),
                                eq(member.organizationId, ownerOrg.organizationId),
                              ),
                            )
                            .limit(1)
                          if (!existing) {
                            await db.insert(member).values({
                              id: crypto.randomUUID(),
                              organizationId: ownerOrg.organizationId,
                              userId: resolvedExternalId,
                              role: 'member',
                              createdAt: now,
                            })
                          }
                        } else {
                          await db
                            .delete(member)
                            .where(
                              and(
                                eq(member.userId, resolvedExternalId),
                                eq(member.organizationId, ownerOrg.organizationId),
                                ne(member.role, 'owner'),
                              ),
                            )
                        }
                      }
                    }
                  }
                }
              }
            },
            onSubscriptionCreated: async (payload) => {
              const sub = payload.data
              const userId = sub.customer.externalId
              if (!userId) return

              const plan = planForProduct(env, sub.productId)
              if (!plan) return

              await db
                .insert(subscriptions)
                .values({
                  id: crypto.randomUUID(),
                  userId,
                  polarSubscriptionId: sub.id,
                  plan,
                  status: mapStatus(sub.status),
                  seats: sub.seats ?? 1,
                  cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
                  currentPeriodEnd: sub.currentPeriodEnd,
                  updatedAt: new Date(),
                })
                .onConflictDoUpdate({
                  target: subscriptions.polarSubscriptionId,
                  set: {
                    status: mapStatus(sub.status),
                    seats: sub.seats ?? 1,
                    cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
                    currentPeriodEnd: sub.currentPeriodEnd,
                    updatedAt: new Date(),
                  },
                })

              // Auto-create an organization for team plan purchasers if they don't have one.
              if (plan === 'team') {
                const existing = await db
                  .select()
                  .from(member)
                  .where(and(eq(member.userId, userId), eq(member.role, 'owner')))
                  .limit(1)
                if (!existing[0]) {
                  const [userRecord] = await db.select().from(user).where(eq(user.id, userId)).limit(1)
                  const orgId = crypto.randomUUID()
                  const now = new Date()
                  await db.insert(organization).values({
                    id: orgId,
                    name: `${userRecord?.name ?? 'My'} Team`,
                    slug: `team-${orgId.slice(0, 8)}`,
                    createdAt: now,
                  })
                  await db.insert(member).values({
                    id: crypto.randomUUID(),
                    organizationId: orgId,
                    userId,
                    role: 'owner',
                    createdAt: now,
                  })
                }
              }
            },
            onSubscriptionUpdated: async (payload) => {
              const sub = payload.data
              await db
                .update(subscriptions)
                .set({
                  status: mapStatus(sub.status),
                  seats: sub.seats ?? 1,
                  cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
                  currentPeriodEnd: sub.currentPeriodEnd,
                  updatedAt: new Date(),
                })
                .where(eq(subscriptions.polarSubscriptionId, sub.id))
            },
            onSubscriptionCanceled: async (payload) => {
              const sub = payload.data
              await db
                .update(subscriptions)
                .set({ status: 'canceled', updatedAt: new Date() })
                .where(eq(subscriptions.polarSubscriptionId, sub.id))
            },
            // Fired on any customer change: subscription updates, benefit grants, etc.
            // Use as a catch-all to keep our subscriptions table in sync.
            onCustomerStateChanged: async (payload) => {
              const state = payload.data
              const userId = state.externalId
              if (!userId) return

              const activeSub = state.activeSubscriptions?.[0]
              if (!activeSub) {
                await db.delete(subscriptions).where(eq(subscriptions.userId, userId))
                return
              }

              const plan = planForProduct(env, activeSub.productId)
              if (!plan) return

              // CustomerStateSubscription doesn't include seats — we preserve the existing value.
              await db
                .insert(subscriptions)
                .values({
                  id: crypto.randomUUID(),
                  userId,
                  polarSubscriptionId: activeSub.id,
                  plan,
                  status: mapStatus(activeSub.status),
                  seats: 1,
                  cancelAtPeriodEnd: activeSub.cancelAtPeriodEnd,
                  currentPeriodEnd: activeSub.currentPeriodEnd ?? null,
                  updatedAt: new Date(),
                })
                .onConflictDoUpdate({
                  target: subscriptions.polarSubscriptionId,
                  set: {
                    status: mapStatus(activeSub.status),
                    cancelAtPeriodEnd: activeSub.cancelAtPeriodEnd,
                    currentPeriodEnd: activeSub.currentPeriodEnd ?? null,
                    updatedAt: new Date(),
                  },
                })
            },
          }),
        ],
      }),
    ],
  })
}

export type Auth = ReturnType<typeof createAuth>
