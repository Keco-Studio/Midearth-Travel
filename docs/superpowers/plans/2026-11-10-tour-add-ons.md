# Tour Add-ons Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add configurable per-tour ticket/activity add-ons to review and payment.

**Architecture:** Store validated add-on configuration in each tour record and immutable selections in each booking. A shared domain module validates configuration, selections, and totals; the browser uses it for display while checkout independently reloads tour data and recalculates Stripe line items.

**Tech Stack:** Next.js 16.2.9, React 19, TypeScript, Ant Design, Supabase JSON rows, Stripe Checkout, Node test runner.

**Spec:** `docs/superpowers/specs/2026-11-10-tour-add-ons-design.md`

## Global Constraints

- Prices are tax-inclusive CAD integer cents.
- Never trust browser-submitted prices or totals.
- Optional items are unchecked by default; required items are selected and cannot be removed.
- Preserve existing unrelated worktree changes.

### Task 1: Add-on domain and persistence types

**Files:** `src/types/cms.ts`, `src/data/tours.ts`, `src/lib/tour-add-ons.ts`, `test/tour-add-ons.test.ts`, Supabase migrations.

- [ ] Write tests for configuration normalization, required defaults, unknown item/type rejection, quantity validation, and exact totals.
- [ ] Run the focused test and confirm it fails because the domain module is missing.
- [ ] Add `TourAddOn`, ticket type, booking selection/snapshot types and JSONB-compatible tour/booking fields.
- [ ] Implement pure validation/default/total helpers.
- [ ] Add migrations for tour JSON and booking JSON columns.
- [ ] Run focused tests and confirm green.

### Task 2: Booking and checkout server integration

**Files:** `src/lib/payment-domain.ts`, `src/app/api/bookings/route.ts`, `src/lib/supabase-bookings.ts`, `src/lib/booking-records.ts`, `src/app/api/checkout/route.ts`, `src/lib/supabase-payments.ts`, tests.

- [ ] Add failing tests for persisted selections and tampered checkout totals.
- [ ] Extend booking request and row mapping with selections/snapshots.
- [ ] Extend checkout input with selections, validate against published tour, and create package plus add-on Stripe line items.
- [ ] Persist add-on amount/metadata with payment order.
- [ ] Run focused server tests.

### Task 3: Review page interaction

**Files:** `src/components/tour/tour-booking-page.tsx`, `src/components/tour/tour-booking-page.module.css`, `src/lib/tour-booking-request.ts`, tests.

- [ ] Add failing component/source tests for optional unchecked, required marked/selected, independent quantities, and total display.
- [ ] Add localized add-on controls below review details and send selections to checkout.
- [ ] Keep package-only behavior when a tour has no configured add-ons.
- [ ] Run component/source tests.

### Task 4: Tour editor configuration

**Files:** `src/components/tour-editor.tsx`, `src/lib/tour-content.ts`, `src/lib/tour-editor-state.ts`, tests.

- [ ] Add failing editor/state tests for nested ticket fields and validation.
- [ ] Add Ant Design dynamic add-on/ticket lists and preserve fields on save/load.
- [ ] Run editor tests.

### Task 5: Full verification

- [ ] Run focused tests, `npm test`, targeted lint, and `npm run build`.
- [ ] Review diff for unrelated changes and report any pre-existing lint noise separately.
