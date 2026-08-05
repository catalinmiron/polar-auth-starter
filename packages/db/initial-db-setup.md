# Initial DB Setup

Stack: Drizzle ORM + Cloudflare D1 (SQLite). Schema lives in `packages/db`, migrations are applied via Wrangler from `apps/api`.

## 1. Create the D1 database

```bash
wrangler d1 create polar-auth-starter
```

Copy the `database_id` from the output and paste it into `apps/api/wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "polar-auth-starter"
database_id = "<paste-id-here>"
```

## 2. Apply migrations

```bash
# Local dev (Miniflare)
cd apps/api
bun db:migrate:local

# Production
bun db:migrate:remote
```

Migrations are in `packages/db/migrations/`. `0000_init.sql` creates all tables:

- better-auth core: `user` (with `onboardingStatus`), `session`, `account`, `verification`
- Organization plugin: `organization`, `member`, `invitation`
- Billing: `subscriptions`, `polar_members`

## 3. Set secrets

```bash
wrangler secret put BETTER_AUTH_SECRET       # openssl rand -base64 32
wrangler secret put GITHUB_CLIENT_ID
wrangler secret put GITHUB_CLIENT_SECRET
wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_SECRET
wrangler secret put POLAR_ACCESS_TOKEN       # Organization Access Token from Polar settings
wrangler secret put POLAR_WEBHOOK_SECRET     # from Polar webhook dashboard
```

For local dev, copy `apps/api/.dev.vars.example` to `apps/api/.dev.vars` (gitignored) and fill in the values.

## 4. Configure Polar webhook

In the Polar dashboard, add a webhook pointing to:

```
https://<your-worker>.workers.dev/api/auth/polar/webhooks
```

The Polar plugin in better-auth handles signature verification and event routing automatically.

## 5. Generate migrations (after schema changes)

```bash
cd packages/db
bun generate        # runs drizzle-kit generate
```

Commit the new migration file, then re-run step 2. Wrangler applies `.sql` files in name order — keep the numeric prefix convention (`0001_*.sql`, `0002_*.sql`, ...).

## Inspect the local database

```bash
cd packages/db
bun studio:local    # drizzle-kit studio against the Miniflare sqlite file
```

## Schema overview

```
packages/db/src/schema.ts     — Drizzle table definitions
packages/db/src/client.ts     — createDb(d1) factory
packages/db/migrations/       — SQL migration files (apply via Wrangler)
packages/db/drizzle.config.ts — Drizzle Kit config
```
