# Supabase Project Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the current Midearth Travel Supabase schema, application data, and uploaded media into the new Supabase project without interrupting the existing project until validation succeeds.

**Architecture:** Keep the current `.env.local` as the source of truth during the transfer. Apply the repository's ordered SQL migrations to the empty target database, then run a purpose-built idempotent transfer script using separate source and target service keys. The script streams rows and Storage objects, rewrites old public Storage URL prefixes to the target project, and verifies counts before the application configuration changes.

**Tech Stack:** Supabase CLI 2.105.0, Supabase PostgREST and Storage REST APIs, Node.js 24, repository SQL migrations.

**Spec:** User-approved Supabase migration request in this conversation.

## Global Constraints

- Do not modify source Supabase data or source Storage objects.
- Do not replace `.env.local` until target schema, rows, and object counts are verified.
- Keep source and target service credentials only in ignored local environment files.
- Copy all known application tables and all objects in source Storage buckets.
- Rewrite only the old project public Storage URL prefix in copied string values.
- Never print service keys, database passwords, booking customer details, or object contents.

---

### Task 1: Test URL rewriting and migration table coverage

**Files:**
- Create: `scripts/migrate-supabase-project.mjs`
- Create: `test/supabase-project-migration.test.ts`

**Interfaces:**
- Produces `rewriteStorageUrls(value, sourceUrl, targetUrl)` for recursive JSON-safe URL rewrites.
- Produces `APP_TABLES` containing `home_modules`, `tours`, `destination_categories`, `homepage_services`, `homepage_testimonials`, `global_settings`, `bookings`, `payment_orders`, `payment_webhook_events`, `admin_users`, and `admin_invitations`.

- [ ] Write a failing test that verifies nested strings containing the source public Storage URL are rewritten, while unrelated strings remain unchanged.
- [ ] Run `npm test -- test/supabase-project-migration.test.ts` and confirm the missing module failure.
- [ ] Implement the pure helper and fixed table list in the migration script.
- [ ] Run `npm test -- test/supabase-project-migration.test.ts` and confirm it passes.

### Task 2: Apply target database schema

**Files:**
- Use: `supabase/migrations/*.sql`

**Interfaces:**
- Consumes the target direct Postgres connection URL supplied through ignored migration environment variables.
- Produces all current application tables, policies, and initial `homepage-media` and `tour-media` buckets on the target.

- [ ] Run `supabase db push --db-url "$TARGET_DATABASE_URL"` from the repository root.
- [ ] Stop on any SQL error; do not start data copy with a partial schema.
- [ ] Query target Storage bucket metadata using the target service key and confirm `homepage-media` and `tour-media` exist.

### Task 3: Copy rows and Storage objects

**Files:**
- Modify: `scripts/migrate-supabase-project.mjs`

**Interfaces:**
- Consumes `SOURCE_SUPABASE_URL`, `SOURCE_SUPABASE_SERVICE_ROLE_KEY`, `TARGET_SUPABASE_URL`, and `TARGET_SUPABASE_SERVICE_ROLE_KEY`.
- Produces target rows upserted in batches and target Storage objects uploaded at their original paths.

- [ ] Implement a default dry-run that reports table row counts and bucket/object counts without copying data.
- [ ] Implement `--apply` to fetch each table in 500-row pages, rewrite public URLs, and upsert rows using service-role credentials.
- [ ] Implement recursive object listing, byte-preserving download, and upload with `x-upsert: true`.
- [ ] Run the dry-run and compare source-to-target planned counts without exposing record contents.
- [ ] Run the apply mode only after Task 2 succeeds.

### Task 4: Verify migration and switch application configuration

**Files:**
- Modify: ignored `.env.local`
- Test: `test/supabase-project-migration.test.ts`

**Interfaces:**
- Produces matching source/target counts for every application table and Storage bucket.
- Produces a target `.env.local` with target URL, public key, and service role key after migration verification.

- [ ] Run transfer verification and fail on a mismatched table or object count.
- [ ] Patch `.env.local` with target Supabase URL, target publishable/anon key, and target service role key.
- [ ] Restart the local development server and request `/`, `/contact`, and `/admin` to confirm target connectivity.
- [ ] Run `npm test -- test/supabase-project-migration.test.ts`, `npx tsc --noEmit`, `npm run lint`, and `git diff --check`.
