# Booking And Contact Page Admin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Provide top-level Booking Page and Contact Us CMS workspaces for all visible page copy and their independently replaceable background images.

**Architecture:** Add two fixed Home Module records and expose them through new top-level admin workspaces. Public Booking and Contact routes load the published configuration and pass resolved content to their existing client components; blank backgrounds fall back to the homepage Hero image.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Ant Design Pro, Supabase `home_modules`.

**Spec:** `docs/superpowers/specs/2026-09-24-booking-contact-page-admin-design.md`

## Global Constraints

- Reuse the existing `home_modules` table and `homepage-media` upload bucket.
- Keep Bookings and Payments operational record workspaces unchanged.
- Accept only existing supported image URL formats.
- Fall back from a blank page background to the published Hero background image.

---

### Task 1: Register the new page content modules

**Files:**
- Modify: `src/types/cms.ts`
- Modify: `src/data/cms-seed.ts`
- Modify: `src/lib/content-rules.ts`
- Test: `test/home-content.test.ts`

**Interfaces:**
- Produces `HomeModuleId` values `bookingPage` and `contactPage` with typed text and image fields.

- [ ] Write failing tests that assert both page module IDs and their background image fields are in the fixed registry.
- [ ] Implement module IDs and fixed seed schemas with English and Chinese visible page copy.
- [ ] Run `npm test -- test/home-content.test.ts`.

### Task 2: Add top-level CMS navigation and editor routing

**Files:**
- Modify: `src/lib/admin-state.ts`
- Modify: `src/lib/layout-routes.ts`
- Modify: `src/components/admin-shell.tsx`
- Test: `test/admin-state.test.ts`
- Test: `test/layout-routes.test.ts`

**Interfaces:**
- Consumes the two fixed module IDs from Task 1.
- Produces `/booking-page` and `/contact-page` admin routes and top-level workspace titles.

- [ ] Write failing tests for path parsing and title resolution.
- [ ] Route both workspaces through `HomeModuleEditor` and its existing save/publish controls.
- [ ] Run `npm test -- test/admin-state.test.ts test/layout-routes.test.ts`.

### Task 3: Bind published content to public Booking and Contact pages

**Files:**
- Modify: `src/app/tours/[slug]/book/page.tsx`
- Modify: `src/app/contact/page.tsx`
- Modify: `src/components/tour/tour-booking-page.tsx`
- Modify: `src/components/contact/contact-page.tsx`
- Test: `test/tour-booking.test.ts`
- Test: `test/contact-prefill.test.ts`

**Interfaces:**
- Consumes published `bookingPage`, `contactPage`, and Hero module data.
- Produces configurable labels and resolved background images in public client components.

- [ ] Write failing tests for published-module background fallback and copy bindings.
- [ ] Implement server-side loading and localized client-side content resolution.
- [ ] Run the two focused test files.

### Task 4: Verify integration

**Files:**
- Test: `test/home-content.test.ts`
- Test: `test/admin-state.test.ts`
- Test: `test/layout-routes.test.ts`
- Test: `test/tour-booking.test.ts`
- Test: `test/contact-prefill.test.ts`

- [ ] Run the focused test suite, `npx tsc --noEmit`, `npm run lint`, and `git diff --check`.
