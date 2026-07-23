# Supabase Homepage Content Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist all homepage module data and images in Supabase and render published data on the public homepage.

**Architecture:** Keep the fixed seed registry as schema/fallback, merge Supabase JSONB rows over it, and expose server-only REST/Storage operations through Next.js Route Handlers. Admin actions save drafts and publish versions; the homepage reads published data.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Supabase PostgREST and Storage HTTP APIs, Node test runner.

---

### Task 1: Define And Test The Content Boundary

**Files:**
- Create: `src/lib/home-content.ts`
- Create: `test/home-content.test.ts`
- Modify: `src/lib/inline-image-upload.ts`
- Modify: `test/inline-image-upload.test.ts`

- [ ] Write failing tests proving stored rows overlay seed modules, missing modules fall back to seeds, draft and published views use the correct JSONB column, typed field helpers fall back safely, upload paths are safe, and HTTPS images are previewable.
- [ ] Run `npm test -- test/home-content.test.ts test/inline-image-upload.test.ts` and confirm failures are caused by missing behavior.
- [ ] Implement the minimal pure types and mapping helpers.
- [ ] Re-run the focused tests and confirm they pass.

### Task 2: Add Supabase Persistence And Schema

**Files:**
- Create: `src/lib/supabase-home-content.ts`
- Create: `supabase/migrations/202607230001_homepage_content.sql`
- Create: `src/app/api/admin/home-modules/route.ts`
- Create: `src/app/api/admin/home-modules/[id]/route.ts`
- Create: `src/app/api/admin/home-modules/upload/route.ts`

- [ ] Implement server-only environment validation, table reads/upserts, draft saves, publishing, seed initialization, and Storage upload.
- [ ] Add GET, PUT, and multipart upload Route Handlers with structured errors.
- [ ] Add SQL for the JSONB table, RLS policies, public bucket, and object policies.
- [ ] Run TypeScript/build verification after the handlers exist.

### Task 3: Connect The Admin Workspace

**Files:**
- Modify: `src/lib/admin-state.ts`
- Modify: `test/admin-state.test.ts`
- Modify: `src/components/admin-shell.tsx`
- Modify: `src/components/home-module-editor.tsx`

- [ ] Write failing state tests for replacing loaded modules and accepting saved/published records.
- [ ] Implement state replacement helpers and verify the focused tests pass.
- [ ] Load Supabase modules on mount, make Save Draft and Publish asynchronous, and display failures without losing local edits.
- [ ] Replace data-URL image selection with real Storage upload and a loading state.

### Task 4: Render Published Module Data

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/components/navbar.tsx`
- Modify: `src/components/hero.tsx`
- Modify: `src/components/tours-section.tsx`
- Modify: `src/components/category-grid.tsx`
- Modify: `src/components/explore-by-month-section.tsx`
- Modify: `src/components/about-section.tsx`
- Modify: `src/components/testimonials-section.tsx`
- Modify: `src/components/final-cta.tsx`
- Modify: `src/components/newsletter.tsx`
- Modify: `src/components/footer.tsx`

- [ ] Load published modules in the server page with seed fallback.
- [ ] Pass each module's JSON data to its section and replace hardcoded editable values.
- [ ] Apply visibility toggles in the page and allow Supabase-hosted images to render.

### Task 5: Verify The End-To-End Change

**Files:**
- Modify only files required by failures found during verification.

- [ ] Run `npm test`.
- [ ] Run `npm run lint`.
- [ ] Run `npm run build`.
- [ ] Probe the configured Supabase REST endpoint; if the migration is not applied, report the exact required SQL step rather than claiming remote persistence is ready.
- [ ] Review `git diff --check` and `git status --short`.
