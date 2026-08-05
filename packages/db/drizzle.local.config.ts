import { defineConfig } from 'drizzle-kit'
import { readdirSync } from 'node:fs'
import { resolve } from 'node:path'

// Points drizzle-kit studio at the local Miniflare D1 database created by
// `wrangler dev` / `bun db:migrate:local` in apps/api.
// drizzle-kit bundles config files as CJS, so import.meta is unavailable.
// process.cwd() is the package dir when run via bun --filter or from packages/db.
const d1Dir = resolve(process.cwd(), '../../apps/api/.wrangler/state/v3/d1/miniflare-D1DatabaseObject')
const dbFile = readdirSync(d1Dir).find((f) => f.endsWith('.sqlite') && f !== 'metadata.sqlite')
if (!dbFile) throw new Error(`No D1 SQLite file found in ${d1Dir}`)

export default defineConfig({
  dialect: 'sqlite',
  schema: './src/schema.ts',
  dbCredentials: { url: resolve(d1Dir, dbFile) },
})
