// Worker bindings + vars/secrets. Kept in its own module so auth.ts, routes
// and index.ts can all import it without a cycle.
export type Env = {
  // Cloudflare bindings
  DB: D1Database
  // Email (Cloudflare Email Routing send_email binding) — optional in local
  // dev; when undefined, emails are logged to the console instead.
  EMAIL: SendEmail | undefined

  NODE_ENV: string

  // better-auth (Cloudflare Workers don't expose process.env, so pass explicitly)
  BETTER_AUTH_SECRET: string
  BETTER_AUTH_URL: string
  // Frontend app URL — used for trusted origins, CORS and checkout redirects.
  WEB_URL: string
  // Set to "false" to allow sign-in before the email is verified (local dev).
  REQUIRE_EMAIL_VERIFICATION?: string

  // OAuth — each provider is enabled only when both values are set.
  GITHUB_CLIENT_ID?: string
  GITHUB_CLIENT_SECRET?: string
  GOOGLE_CLIENT_ID?: string
  GOOGLE_CLIENT_SECRET?: string

  // Polar billing
  POLAR_SERVER: 'sandbox' | 'production'
  POLAR_ACCESS_TOKEN?: string
  POLAR_WEBHOOK_SECRET: string
  // Product catalog — see src/products.ts. Unset vars drop the product
  // from the catalog (e.g. run with only monthly products configured).
  POLAR_PRO_MONTHLY_PRODUCT_ID?: string
  POLAR_PRO_ANNUAL_PRODUCT_ID?: string
  POLAR_TEAM_MONTHLY_PRODUCT_ID?: string
  POLAR_TEAM_ANNUAL_PRODUCT_ID?: string

  // Email sender identity — defaults to "Acme <noreply@example.com>".
  EMAIL_FROM?: string
  EMAIL_FROM_NAME?: string

  // Deep-link scheme of the mobile app (trusted origin for the Expo client).
  // Defaults to "polarstarter".
  MOBILE_APP_SCHEME?: string
}
