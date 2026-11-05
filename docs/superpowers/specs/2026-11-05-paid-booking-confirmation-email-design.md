# Paid Booking Confirmation Email Design

## Goal

Send a localized confirmation email to the customer after Stripe has authoritatively confirmed a successful tour payment. The email congratulates the customer, summarizes the booking and travel details, and uses Chinese or English copy that administrators can edit and publish from the existing CMS. Administrators do not receive an email.

## Scope

This feature covers online tour bookings created by the public booking form and paid through the existing Stripe Checkout flow. It does not send mail when the booking form is first submitted, when Checkout is cancelled, or when payment fails. It does not add administrator notifications, marketing subscriptions, or a general-purpose email campaign system.

## Chosen Approach

Add a `Payment success email` section to the existing `Booking Page` CMS module. This reuses the current draft-and-publish workflow, localized content conventions, and generic form editor. It keeps the template next to the booking experience without creating a separate administration workspace for one transactional message.

Alternatives considered:

- A dedicated email-template workspace and table would provide stronger separation, but adds navigation, APIs, storage, and editor code that are unnecessary for one message.
- A provider-hosted Resend template would be quick to send but would force administrators to leave the MidEarth CMS and would not share the site's existing publish workflow.

## Customer and Payment Data

The booking request records the language active when the customer submits the booking. The accepted values are `en` and `zh`. A missing value falls back to `en` so older callers remain compatible, while an explicitly unsupported value is rejected.

The persisted booking gains fields for locale, adult count, child count, and the departure selection exactly as shown to the customer. The existing ISO departure-date field and total party size remain available for current administrative views. Keeping the structured values avoids reconstructing important email content from the free-form notes field.

The payment record gains confirmation-delivery metadata sufficient to audit the result:

- whether the confirmation has been sent;
- the successful send time;
- the Resend message identifier;
- the most recent send error, when present.

Supabase migrations add these fields without changing existing booking or payment records. Existing records use English as the locale fallback and have no confirmation delivery recorded. The confirmation flow applies to new bookings that contain the structured travel-party and departure values; historical payments are not backfilled or emailed.

## Editable CMS Content

The `Booking Page` module gains four fields per language:

- email subject;
- congratulatory heading;
- body copy;
- closing or contact copy.

English and Chinese values are edited separately. Administrators may save a draft and publish it through the existing CMS controls. Only published values are used for outgoing mail, so partially edited drafts cannot reach customers.

The editable values are plain text. Line breaks are preserved, and all content is escaped before being inserted into HTML. Administrators do not write HTML or template expressions. This keeps the editor simple and prevents unsafe markup from entering an email.

## Generated Email Content

The application combines the published copy with a fixed, localized booking summary. The system-generated portion contains:

- booking reference;
- tour title and code when available;
- selected departure date or departure label;
- adult and child counts;
- tour duration;
- departure city and meeting information when available;
- paid amount and currency;
- a link back to the tour page.

Customer and tour values are escaped before rendering. The application produces both branded HTML and a complete plain-text alternative. Dynamic information is kept outside the editable prose, so an administrator cannot accidentally remove critical booking facts.

The renderer uses the booking locale to select both CMS copy and localized tour fields. If a localized tour value is empty, it falls back to the English/source value using the site's existing localization helpers.

## Payment-Success Flow

1. The public booking form includes the active site language in `POST /api/bookings`.
2. The booking API validates and persists the booking, including its locale and the existing party details.
3. Stripe Checkout proceeds through the current `/api/checkout` route.
4. The signed Stripe webhook receives an event and derives the internal payment status using the existing payment-domain logic.
5. For a transition to `paid`, the webhook updates the payment record, loads the linked booking and published tour, loads the published Booking Page email copy, renders the corresponding localized message, and sends it to the booking customer's email through Resend.
6. The successful Resend identifier and send time are stored on the payment record before the webhook event is considered complete.

Only payment records linked to a booking can send this confirmation. A missing booking, missing customer address, or missing required configuration is treated as a retryable processing error and is logged with enough context to diagnose it without logging full email content.

## Delivery Reliability and Idempotency

Stripe may deliver the same webhook event more than once, and a server may fail after Resend accepts a message but before the database update finishes. The send therefore uses a stable Resend idempotency key derived from the payment record, not from an individual webhook attempt. Repeated calls for the same payment resolve to the same provider operation rather than creating another message.

Before sending, the application checks the payment's recorded send state. If it is already sent, processing succeeds without calling Resend. After a successful provider response, the application stores the sent state and message identifier. The existing Stripe event record is written only after all required paid-event work succeeds.

If rendering, configuration, Resend, or persistence fails, the payment remains `paid`, the latest delivery error is recorded where possible, and the webhook returns an error so Stripe can retry. A retry clears the stored error after a successful send. Payment truth and email delivery state remain separate: a mail outage never changes a successful payment back to failed.

## Resend Integration and Configuration

All provider calls run on the server. The browser never receives provider credentials. Deployment configuration includes:

- `RESEND_API_KEY`;
- `BOOKING_EMAIL_FROM`, using a Resend-verified MidEarth domain and a human-readable sender name;
- optional `BOOKING_EMAIL_REPLY_TO` for customer replies.

Configuration parsing rejects empty values and obvious placeholders. Production setup must verify the sending domain in Resend before enabling the feature. The example environment file documents each required value without containing secrets.

## Error Handling and Security

- Stripe signatures continue to be verified before any payment or email work.
- Email addresses, locale values, and booking inputs are validated at the server boundary.
- CMS copy and customer/tour data are escaped; no raw administrator HTML is accepted.
- Provider errors are logged with booking/payment identifiers but not API keys or full message bodies.
- The confirmation sender is server-only, and Resend credentials are never exposed through `NEXT_PUBLIC_` variables.
- Existing admin authorization continues to protect template editing and publishing.

## Testing and Acceptance Criteria

Automated tests cover:

- booking validation accepts `en` and `zh`, defaults safely for legacy requests, and rejects unsupported locale values supplied by the public flow;
- the form submits the active site language;
- English and Chinese template selection;
- localized tour-field fallback;
- safe HTML escaping and complete plain-text rendering;
- inclusion of booking reference, tour, departure, party, meeting information, and paid amount;
- mail is sent only for a linked payment that becomes paid;
- cancelled and failed events do not send mail;
- an already-sent payment does not call Resend again;
- retries reuse the stable provider idempotency key;
- a failed send leaves the payment paid and causes retryable webhook failure;
- CMS draft values do not send until published;
- required Resend configuration is validated without exposing secrets.

The feature is accepted when a test-mode Stripe payment produces exactly one email in the booking language, the email contains the expected published copy and booking information, repeated delivery of the same Stripe event produces no duplicate, and the complete test, lint, type-check/build, and production build checks pass.

## Rollout

Apply the Supabase migration, configure and verify the Resend sending domain, set the deployment secrets, publish both language versions of the email copy, and then deploy the application. Complete one English and one Chinese Stripe test payment and verify the rendered messages and delivery metadata before using live Stripe mode.
