import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

// ─── better-auth core tables ────────────────────────────────────────────────
// Column names must match the migration exactly (better-auth uses camelCase).

export const user = sqliteTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: integer('emailVerified', { mode: 'boolean' }).notNull().default(false),
  image: text('image'),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
  onboardingStatus: text('onboardingStatus')
    .$type<'none' | 'started' | 'dropped' | 'finished'>()
    .notNull()
    .default('none'),
})

export const session = sqliteTable('session', {
  id: text('id').primaryKey(),
  expiresAt: integer('expiresAt', { mode: 'timestamp' }).notNull(),
  token: text('token').notNull().unique(),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  userId: text('userId')
    .notNull()
    .references(() => user.id),
})

export const account = sqliteTable('account', {
  id: text('id').primaryKey(),
  accountId: text('accountId').notNull(),
  providerId: text('providerId').notNull(),
  userId: text('userId')
    .notNull()
    .references(() => user.id),
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  idToken: text('idToken'),
  accessTokenExpiresAt: integer('accessTokenExpiresAt', { mode: 'timestamp' }),
  refreshTokenExpiresAt: integer('refreshTokenExpiresAt', { mode: 'timestamp' }),
  scope: text('scope'),
  password: text('password'),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
})

export const verification = sqliteTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: integer('expiresAt', { mode: 'timestamp' }).notNull(),
  createdAt: integer('createdAt', { mode: 'timestamp' }),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }),
})

// ─── Organization plugin tables ──────────────────────────────────────────────

export const organization = sqliteTable('organization', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').unique(),
  logo: text('logo'),
  metadata: text('metadata'),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
})

export const member = sqliteTable('member', {
  id: text('id').primaryKey(),
  organizationId: text('organizationId')
    .notNull()
    .references(() => organization.id),
  userId: text('userId')
    .notNull()
    .references(() => user.id),
  role: text('role').notNull().default('member'),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
})

export const invitation = sqliteTable('invitation', {
  id: text('id').primaryKey(),
  organizationId: text('organizationId')
    .notNull()
    .references(() => organization.id),
  email: text('email').notNull(),
  role: text('role'),
  status: text('status').notNull().default('pending'),
  expiresAt: integer('expiresAt', { mode: 'timestamp' }).notNull(),
  inviterId: text('inviterId')
    .notNull()
    .references(() => member.id),
})

// ─── Billing tables ──────────────────────────────────────────────────────────

// Local mirror of the user's active Polar subscription. Kept in sync by the
// Polar webhooks in apps/api/src/auth.ts and refreshed opportunistically by
// GET /api/user/subscription.
export const subscriptions = sqliteTable('subscriptions', {
  id: text('id').primaryKey(),
  userId: text('userId')
    .notNull()
    .references(() => user.id),
  polarSubscriptionId: text('polarSubscriptionId').notNull().unique(),
  plan: text('plan', { enum: ['pro', 'team'] }).notNull(),
  status: text('status', { enum: ['active', 'canceled', 'past_due'] }).notNull(),
  seats: integer('seats').notNull().default(1),
  cancelAtPeriodEnd: integer('cancelAtPeriodEnd', { mode: 'boolean' }).notNull().default(false),
  currentPeriodEnd: integer('currentPeriodEnd', { mode: 'timestamp' }),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
})

// Local mirror of Polar team members/seats (seat-based team plan). Polar is
// the source of truth for membership; seat webhooks own the `status` field.
export const polarMembers = sqliteTable('polar_members', {
  id: text('id').primaryKey(), // Polar member ID
  customerId: text('customer_id').notNull(), // Polar team customer ID
  email: text('email').notNull(),
  name: text('name'),
  role: text('role').notNull().default('member'),
  externalId: text('external_id'), // our user.id (set when we create the member)
  status: text('status', { enum: ['pending', 'claimed', 'revoked'] })
    .notNull()
    .default('pending'),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})
