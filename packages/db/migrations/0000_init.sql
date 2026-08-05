-- better-auth core tables (camelCase columns — better-auth's convention)
CREATE TABLE IF NOT EXISTS "user" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL UNIQUE,
  "emailVerified" INTEGER NOT NULL DEFAULT 0,
  "image" TEXT,
  "createdAt" INTEGER NOT NULL,
  "updatedAt" INTEGER NOT NULL,
  "onboardingStatus" TEXT NOT NULL DEFAULT 'none'
);

CREATE TABLE IF NOT EXISTS "session" (
  "id" TEXT PRIMARY KEY,
  "expiresAt" INTEGER NOT NULL,
  "token" TEXT NOT NULL UNIQUE,
  "createdAt" INTEGER NOT NULL,
  "updatedAt" INTEGER NOT NULL,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "userId" TEXT NOT NULL REFERENCES "user"("id")
);

CREATE TABLE IF NOT EXISTS "account" (
  "id" TEXT PRIMARY KEY,
  "accountId" TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  "userId" TEXT NOT NULL REFERENCES "user"("id"),
  "accessToken" TEXT,
  "refreshToken" TEXT,
  "idToken" TEXT,
  "accessTokenExpiresAt" INTEGER,
  "refreshTokenExpiresAt" INTEGER,
  "scope" TEXT,
  "password" TEXT,
  "createdAt" INTEGER NOT NULL,
  "updatedAt" INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS "verification" (
  "id" TEXT PRIMARY KEY,
  "identifier" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "expiresAt" INTEGER NOT NULL,
  "createdAt" INTEGER,
  "updatedAt" INTEGER
);

-- better-auth organization plugin tables
CREATE TABLE IF NOT EXISTS "organization" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "slug" TEXT UNIQUE,
  "logo" TEXT,
  "metadata" TEXT,
  "createdAt" INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS "member" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL REFERENCES "organization"("id"),
  "userId" TEXT NOT NULL REFERENCES "user"("id"),
  "role" TEXT NOT NULL DEFAULT 'member',
  "createdAt" INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS "invitation" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL REFERENCES "organization"("id"),
  "email" TEXT NOT NULL,
  "role" TEXT,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "expiresAt" INTEGER NOT NULL,
  "inviterId" TEXT NOT NULL REFERENCES "member"("id")
);

-- Billing tables
CREATE TABLE IF NOT EXISTS "subscriptions" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "user"("id"),
  "polarSubscriptionId" TEXT NOT NULL UNIQUE,
  "plan" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "seats" INTEGER NOT NULL DEFAULT 1,
  "cancelAtPeriodEnd" INTEGER NOT NULL DEFAULT 0,
  "currentPeriodEnd" INTEGER,
  "updatedAt" INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS "polar_members" (
  "id" TEXT PRIMARY KEY,
  "customer_id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "name" TEXT,
  "role" TEXT NOT NULL DEFAULT 'member',
  "external_id" TEXT,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "updated_at" INTEGER NOT NULL
);
