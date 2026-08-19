# Stripe Checkout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Stripe Checkout session creation, verified webhook synchronization, Supabase persistence, and a tour payment UI.

**Architecture:** Keep Stripe server-only in focused helpers and Node runtime route handlers. Resolve fare amounts from the authoritative tour catalog, persist an internal payment order before redirecting, and use a unique webhook-event record for idempotent status updates.

**Tech Stack:** Next.js 16 App Router Route Handlers, Stripe Node SDK, Supabase REST API, React client component, Node test runner.

---

### Task 1: Stripe configuration and domain helpers

**Files:**
- Create: `src/lib/stripe.ts`
- Create: `src/lib/payment-domain.ts`
- Create: `test/payment-domain.test.ts`
- Modify: `package.json`
- Modify: `.env.example`

- [ ] Write tests for parsing CAD fare strings, rejecting unknown fare labels, and mapping Checkout event statuses.
- [ ] Run `node --experimental-strip-types --test test/payment-domain.test.ts` and confirm it fails because helpers are absent.
- [ ] Install `stripe` and implement lazy server-only Stripe initialization plus pure fare/status helpers.
- [ ] Re-run the focused test and the full test suite.

### Task 2: Supabase payment persistence

**Files:**
- Create: `supabase/migrations/202608190001_stripe_payments.sql`
- Create: `src/lib/supabase-payments.ts`

- [ ] Add tables for payment orders and unique webhook events with private RLS policies.
- [ ] Implement REST helpers for creating/upserting payment orders, recording events, and updating status by Stripe session ID.
- [ ] Type-check the new persistence module.

### Task 3: Checkout Route Handler

**Files:**
- Create: `src/app/api/checkout/route.ts`
- Create: `test/checkout-route.test.ts`

- [ ] Add failing validation tests for malformed input and unknown tours/fares.
- [ ] Implement Node runtime POST handler, server-side fare resolution, Supabase order creation, and Stripe Checkout session creation with metadata.
- [ ] Return safe JSON errors and the hosted URL; never return secrets or card data.
- [ ] Run focused tests and lint.

### Task 4: Verified Stripe Webhook Route Handler

**Files:**
- Create: `src/app/api/webhooks/stripe/route.ts`
- Create: `test/stripe-webhook.test.ts`

- [ ] Add tests for invalid signatures, completed payments, failed/expired sessions, and duplicate event IDs.
- [ ] Implement raw-body signature verification, event recording before state mutation, idempotent updates, and retry-safe error responses.
- [ ] Run focused tests and lint.

### Task 5: Customer-facing payment UI and docs

**Files:**
- Create: `src/components/tour/tour-checkout-button.tsx`
- Create: `src/app/payment/success/page.tsx`
- Create: `src/app/payment/cancel/page.tsx`
- Modify: `src/components/tour/tour-detail.tsx`
- Modify: `README.md`

- [ ] Add a client button that collects email, calls `/api/checkout`, and redirects to Stripe with loading/error states.
- [ ] Add success/cancel pages that describe webhook-authoritative payment status.
- [ ] Place the button alongside each available fare while retaining existing contact actions.
- [ ] Document Dashboard keys, webhook endpoint/events, local Stripe CLI forwarding, and Supabase migration deployment.

### Task 6: Verification

- [ ] Run `npm test`.
- [ ] Run `npm run lint`.
- [ ] Run `npx tsc --noEmit`.
- [ ] Run `npm run build` if environment configuration permits; report any missing external secrets without fabricating success.
