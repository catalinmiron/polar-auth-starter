# Polar Auth Starter

Production-ready **better-auth + [Polar](https://polar.sh) billing** starter for the full stack:

- **`apps/api`** — [Hono](https://hono.dev) on Cloudflare Workers + D1 (Drizzle ORM), better-auth v1.6 with email/password, email verification, password reset, GitHub/Google social login, account linking, organizations (teams), and the Polar plugin: checkout, customer portal, subscription webhooks, and seat-based team billing.
- **`apps/web`** — Vite SPA with TanStack Router (file-based), Tailwind v4, HeroUI v3. Login/signup/forgot/reset flows, pricing page driven by the API, and an account area (profile, plan & billing portal, team members & invites, change password, delete account).
- **`apps/mobile`** — Expo (expo-router) app with the same auth: email/password + social sign-in, signup, forgot password, and a settings screen with plan info. Plain React Native styled with uniwind (Tailwind) — **no Reanimated, no Gesture Handler**.
- **`packages/types`** — shared types (`Plan`, `Subscription`, `Team`, `AuthUser`, pricing payloads).
- **`packages/db`** — Drizzle schema + a single clean migration (better-auth core, organization plugin, subscriptions, Polar seat mirror).

The example plan lineup is **Free / Pro / Team** (monthly + annual). Team is seat-based: Polar seat webhooks sync members into better-auth organizations, and the org plugin's invite/add hooks enforce the seat limit.

## Adding a product is two steps

The entire plan ↔ product mapping lives in **one file**: [`apps/api/src/products.ts`](apps/api/src/products.ts).

1. Create the product in Polar, set its ID as an env var (`wrangler.toml` var or secret).
2. Add one entry to the catalog in `products.ts` (slug, plan, interval, seatBased).

Pricing page, checkout, webhook plan resolution, and seat logic all read from the catalog. Product-specific fulfillment on `order.paid` (credits, license keys, …) goes in [`apps/api/src/hooks.ts`](apps/api/src/hooks.ts) — a deliberate extension point.

## Prerequisites

- [Bun](https://bun.sh) ≥ 1.3 (`packageManager` is pinned in `package.json`)
- A Cloudflare account (Workers + D1) and `wrangler` (installed as a dev dep)
- A [Polar](https://polar.sh) organization (sandbox works — `POLAR_SERVER=sandbox`)
- Optional: GitHub / Google OAuth apps for social login

## Setup

```bash
bun install
```

### 1. Database (D1)

```bash
cd apps/api
bunx wrangler d1 create polar-auth-starter   # paste the id into wrangler.toml
bun db:migrate:local                          # local dev DB
bun db:migrate:remote                         # production DB
```

See [`packages/db/initial-db-setup.md`](packages/db/initial-db-setup.md) for the full walkthrough.

### 2. API secrets

Copy `apps/api/.dev.vars.example` → `apps/api/.dev.vars` for local dev. For production:

```bash
wrangler secret put BETTER_AUTH_SECRET     # openssl rand -base64 32
wrangler secret put POLAR_ACCESS_TOKEN     # Polar → Settings → Access Tokens
wrangler secret put POLAR_WEBHOOK_SECRET   # Polar → Webhooks (point at /api/auth/polar/webhooks)
wrangler secret put GITHUB_CLIENT_ID       # optional — social login
wrangler secret put GITHUB_CLIENT_SECRET
wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_SECRET
```

Social providers are conditionally registered — leave the secrets unset and the buttons simply won't work until you add them.

### 3. Polar products

Create four products (or fewer — unset catalog entries are skipped): Pro monthly, Pro annual, Team monthly (seat-based), Team annual (seat-based). Put their IDs in `apps/api/wrangler.toml`:

```
POLAR_PRO_MONTHLY_PRODUCT_ID / POLAR_PRO_ANNUAL_PRODUCT_ID
POLAR_TEAM_MONTHLY_PRODUCT_ID / POLAR_TEAM_ANNUAL_PRODUCT_ID
```

### 4. Email

Verification and reset emails go out through Cloudflare's [`send_email` binding](https://developers.cloudflare.com/email-routing/email-workers/send-email-workers/) (already declared in `wrangler.toml`). Enable **Email Routing** on the zone that owns your sender address and set `EMAIL_FROM` / `EMAIL_FROM_NAME` — the from address must belong to that zone. In local dev there is no binding, so the email (with its verification/reset link) is printed to the wrangler console instead.

If you prefer a different provider, the whole integration is one small `sendEmail` helper in `apps/api/src/auth.ts`.

## Development

```bash
bun dev            # api (wrangler dev :8787) + web (vite :3000)
bun dev:api        # api only
bun dev:web        # web only
bun dev:mobile     # expo start
bun typecheck      # all packages
bun lint
bun db:studio      # drizzle studio against the local D1 sqlite
```

Web reads `VITE_API_URL` (defaults to `http://localhost:8787`). Mobile derives the dev API host from Metro and can be overridden with `EXPO_PUBLIC_API_URL`; the app scheme is `polarstarter` and must match `MOBILE_APP_SCHEME` on the API (it's in the auth server's `trustedOrigins`).

## Deploy

```bash
bun deploy:api     # wrangler deploy — set BETTER_AUTH_URL + WEB_URL vars first
bun deploy:web     # or host apps/web/dist on any static host
```

For mobile builds, run `npx expo prebuild` in `apps/mobile` (native folders are gitignored) and use EAS or Xcode/Gradle as you prefer.

## Architecture notes

- **One auth server, three clients.** better-auth runs on the Worker at `/api/auth/*`. Web uses `better-auth/react` + `polarClient()` + `organizationClient()`; mobile uses `@better-auth/expo` with SecureStore cookie storage.
- **Seat-based teams.** Buying a Team plan auto-creates a better-auth organization. Polar seat webhooks mirror members into `polar_members` and sync better-auth `member` rows; `checkSeatLimit` blocks invites/adds past the purchased seat count.
- **`bunfig.toml` matters.** The hoisted linker is required for the Expo app — Bun's default isolated linker duplicates native-module JS copies and breaks React Native.
- **Workers constraint.** `createAuth(env)` is built per-request (no process-global env on Workers).

## License

[MIT](LICENSE)
