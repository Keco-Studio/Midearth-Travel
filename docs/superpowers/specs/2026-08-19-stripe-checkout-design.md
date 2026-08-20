# Stripe Checkout Payment Design

## Goal

Add a secure Stripe Checkout payment flow for MidEarth tour deposits/full payments without handling card data on the MidEarth server, and synchronize order status from Stripe webhooks into Supabase.

## Architecture

The browser submits a validated tour and fare selection to `POST /api/checkout`. The server resolves the tour from the authoritative catalog, parses the configured CAD fare, creates a Stripe Checkout Session with `metadata` containing the internal payment reference, and returns the hosted Checkout URL. No secret or card data is exposed to the browser.

`POST /api/webhooks/stripe` reads the raw request body and verifies the Stripe signature with `STRIPE_WEBHOOK_SECRET`. Supported completion, failure, and expiry events are mapped to an idempotent Supabase payment record update. A separate webhook-events table prevents duplicate event processing.

## Data Model

`payment_orders` stores the internal payment reference, booking/tour identifiers, amount in CAD cents, Stripe session/payment intent identifiers, status, and timestamps. `payment_webhook_events` stores Stripe event IDs and payload metadata with a unique event ID. The migration includes RLS policies that allow server-side service-role writes while keeping order data private from anonymous clients.

## API Contract

`POST /api/checkout` accepts `{ tourSlug, fareLabel, paymentType, customerEmail, bookingId? }`. It returns `{ url, paymentId }` on success, `400` for invalid input, `503` when Stripe is not configured, and `500` for unexpected failures.

`POST /api/webhooks/stripe` returns `200 { received: true }` for valid, already-processed, or ignored events; `400` for invalid signatures or malformed payloads; and `500` when persistence fails so Stripe retries delivery.

## UI

Tour fare rows get a client-side Checkout button that collects an email and redirects to Stripe. Existing email/call booking actions remain available. Success and cancel pages explain the resulting state without treating the redirect as proof of payment; the webhook remains authoritative.

## Security and Reliability

Amounts are resolved server-side from `src/data/tours.ts`; client-provided prices are never trusted. Secret keys are read only from non-public environment variables. Webhook verification uses the exact raw body. Event and session identifiers are unique, and status transitions are idempotent. Stripe test mode is supported for local verification.

## Testing

Unit tests cover fare parsing, checkout input validation, webhook event mapping, signature rejection, and duplicate event handling. Type checking and the existing Node test suite must pass.
