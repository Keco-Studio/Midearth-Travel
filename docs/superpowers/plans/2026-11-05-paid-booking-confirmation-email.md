# Paid Booking Confirmation Email Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Send exactly one editable, localized customer confirmation email through Resend after Stripe confirms payment for a MidEarth tour booking.

**Architecture:** Extend the existing booking and payment records with structured email inputs and delivery state, keep bilingual template copy in the published `Booking Page` CMS module, and render HTML plus plain text in a pure module. The signed Stripe Route Handler updates payment state, then calls a server-only delivery orchestrator whose Resend request uses a payment-derived idempotency key and whose Supabase writes keep payment truth separate from email delivery state.

**Tech Stack:** Next.js 16.2.9 App Router Route Handlers, React 19, TypeScript 5, Supabase REST/PostgreSQL migrations, Stripe webhooks, Resend HTTPS API, Node test runner.

**Spec:** `docs/superpowers/specs/2026-11-05-paid-booking-confirmation-email-design.md`

## Global Constraints

- Read `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md` and `node_modules/next/dist/docs/01-app/02-guides/environment-variables.md` before editing Route Handlers or environment access; this repository uses Next.js 16.2.9 rather than training-data conventions.
- Send no email when the booking is created; send only after the signed Stripe webhook maps an event to `paid`.
- Send only to the customer. Administrators receive no notification.
- Select English or Chinese from the locale stored when the booking form was submitted.
- Only published CMS values may be used in outgoing mail; draft values remain private.
- Keep CMS content as escaped plain text. Do not accept administrator-provided HTML or template expressions.
- Keep `RESEND_API_KEY`, `BOOKING_EMAIL_FROM`, and `BOOKING_EMAIL_REPLY_TO` server-only; never use a `NEXT_PUBLIC_` prefix.
- A mail failure must never revert a paid payment. Return a retryable webhook error and preserve the paid state.
- Repeated webhook deliveries must not produce duplicate mail; use both persisted sent state and a stable Resend idempotency key derived from the payment ID.
- Follow red-green-refactor for every implementation task and commit each independently passing deliverable.

---

### Task 1: Persist the booking locale and structured travel-party details

**Files:**
- Create: `supabase/migrations/202611050001_booking_confirmation_emails.sql`
- Modify: `src/lib/payment-domain.ts`
- Modify: `src/components/tour/tour-booking-page.tsx`
- Modify: `src/lib/supabase-bookings.ts`
- Modify: `src/types/cms.ts`
- Test: `test/tour-booking.test.ts`
- Test: `test/booking-confirmation-persistence.test.ts`

**Interfaces:**
- Produces: `BookingLocale = "en" | "zh"` and `TourBookingInput.locale: BookingLocale`.
- Produces optional `BookingRecord.locale`, `BookingRecord.adults`, `BookingRecord.children`, and `BookingRecord.departureSelection` for Task 3 and Task 6. New tour bookings always set them; optional typing keeps historical seed and database records compatible, and delivery defaults a missing locale to English while rejecting missing structured travel details.
- Produces: Supabase columns `bookings.locale`, `bookings.adult_count`, `bookings.child_count`, `bookings.departure_selection`, `payment_orders.confirmation_email_sent_at`, `payment_orders.confirmation_email_id`, and `payment_orders.confirmation_email_error` for Task 5.

- [ ] **Step 1: Write failing domain and form tests**

Extend the validator assertion in `test/tour-booking.test.ts` and add explicit locale cases:

```ts
assert.deepEqual(
  validateTourBookingInput({
    tourSlug: "maple-leaves",
    customerName: "Ada Lovelace",
    customerEmail: "ada@example.com",
    customerPhone: "613-555-0123",
    departureDate: "2026-10-12",
    adults: "2",
    children: "1",
    notes: "Window seats, please.",
    locale: "zh",
  }),
  {
    tourSlug: "maple-leaves",
    customerName: "Ada Lovelace",
    customerEmail: "ada@example.com",
    customerPhone: "613-555-0123",
    departureDate: "2026-10-12",
    adults: 2,
    children: 1,
    notes: "Window seats, please.",
    locale: "zh",
  },
);

assert.equal(validateTourBookingInput({
  tourSlug: "maple-leaves",
  customerName: "Ada",
  customerEmail: "ada@example.com",
  customerPhone: "613-555-0123",
  departureDate: "July 11",
  adults: 1,
  children: 0,
}).locale, "en");

assert.throws(() => validateTourBookingInput({
  tourSlug: "maple-leaves",
  customerName: "Ada",
  customerEmail: "ada@example.com",
  customerPhone: "613-555-0123",
  departureDate: "July 11",
  adults: 1,
  children: 0,
  locale: "fr",
}), /language/i);
```

Also assert that the client request includes `locale: lang`:

```ts
assert.match(component, /body:\s*JSON\.stringify\(\{\s*\.\.\.form,\s*tourSlug:\s*tour\.slug,\s*locale:\s*lang\s*\}\)/s);
```

- [ ] **Step 2: Write the failing migration contract test**

Create `test/booking-confirmation-persistence.test.ts`:

```ts
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(
  new URL("../supabase/migrations/202611050001_booking_confirmation_emails.sql", import.meta.url),
  "utf8",
);

test("stores localized booking details and confirmation delivery state", () => {
  assert.match(migration, /add column if not exists locale text not null default 'en'/i);
  assert.match(migration, /locale in \('en', 'zh'\)/i);
  assert.match(migration, /add column if not exists adult_count integer/i);
  assert.match(migration, /add column if not exists child_count integer/i);
  assert.match(migration, /add column if not exists departure_selection text/i);
  assert.match(migration, /add column if not exists confirmation_email_sent_at timestamptz/i);
  assert.match(migration, /add column if not exists confirmation_email_id text/i);
  assert.match(migration, /add column if not exists confirmation_email_error text/i);
});
```

- [ ] **Step 3: Run the focused tests and verify RED**

Run: `npm test -- test/tour-booking.test.ts test/booking-confirmation-persistence.test.ts`

Expected: FAIL because the migration does not exist, `locale` is absent, and the form does not submit it.

- [ ] **Step 4: Add the migration and typed fields**

Create the migration with additive, repeatable statements:

```sql
alter table public.bookings
  add column if not exists locale text not null default 'en'
    check (locale in ('en', 'zh')),
  add column if not exists adult_count integer check (adult_count >= 1),
  add column if not exists child_count integer check (child_count >= 0),
  add column if not exists departure_selection text;

alter table public.payment_orders
  add column if not exists confirmation_email_sent_at timestamptz,
  add column if not exists confirmation_email_id text,
  add column if not exists confirmation_email_error text;
```

In `src/lib/payment-domain.ts`, define and validate the locale:

```ts
export type BookingLocale = "en" | "zh";

function parseBookingLocale(value: unknown): BookingLocale {
  if (value === undefined) return "en";
  if (value === "en" || value === "zh") return value;
  throw new Error("A valid booking language is required");
}
```

Add `locale: parseBookingLocale(input.locale)` to the validated result. Add the same four structured properties to `BookingRecord`, `BookingRow`, `rowToBooking`, and `bookingToRow`. `createTourBooking` must write `input.locale`, `input.adults`, `input.children`, and the exact `input.departureDate` string as `departureSelection`; retain the existing ISO-only `departureDate` behavior and total `partySize`.

In the form submit body, use:

```ts
body: JSON.stringify({ ...form, tourSlug: tour.slug, locale: lang }),
```

- [ ] **Step 5: Run the focused tests and verify GREEN**

Run: `npm test -- test/tour-booking.test.ts test/booking-confirmation-persistence.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit the structured booking data**

```bash
git add supabase/migrations/202611050001_booking_confirmation_emails.sql src/lib/payment-domain.ts src/components/tour/tour-booking-page.tsx src/lib/supabase-bookings.ts src/types/cms.ts test/tour-booking.test.ts test/booking-confirmation-persistence.test.ts
git commit -m "feat: persist booking confirmation details"
```

### Task 2: Add editable bilingual confirmation copy to Booking Page CMS

**Files:**
- Modify: `src/data/cms-seed.ts`
- Modify: `src/components/home-module-editor.tsx`
- Test: `test/home-content.test.ts`
- Test: `test/module-editor.test.ts`

**Interfaces:**
- Produces published CMS keys `confirmationEmailSubjectEn|Zh`, `confirmationEmailHeadingEn|Zh`, `confirmationEmailBodyEn|Zh`, and `confirmationEmailClosingEn|Zh` for Task 3.
- Uses the existing `HomeModuleRecord` draft/publish path; no new route or table is introduced.

- [ ] **Step 1: Write failing seed and editor-section tests**

Add to `test/home-content.test.ts`:

```ts
test("provides editable bilingual payment confirmation email copy", () => {
  const bookingPage = homeModuleSeeds.find((module) => module.id === "bookingPage")!;
  const keys = bookingPage.fields.map((field) => field.key);

  assert.ok(keys.includes("confirmationEmailSubjectEn"));
  assert.ok(keys.includes("confirmationEmailSubjectZh"));
  assert.ok(keys.includes("confirmationEmailHeadingEn"));
  assert.ok(keys.includes("confirmationEmailHeadingZh"));
  assert.ok(keys.includes("confirmationEmailBodyEn"));
  assert.ok(keys.includes("confirmationEmailBodyZh"));
  assert.ok(keys.includes("confirmationEmailClosingEn"));
  assert.ok(keys.includes("confirmationEmailClosingZh"));
  assert.match(String(bookingPage.data.confirmationEmailSubjectEn), /payment/i);
  assert.match(String(bookingPage.data.confirmationEmailSubjectZh), /付款/);
});
```

Add a source assertion to `test/module-editor.test.ts`:

```ts
assert.match(source, /confirmationEmailSubjectEn/);
assert.match(source, /Payment success email/);
```

- [ ] **Step 2: Run focused CMS tests and verify RED**

Run: `npm test -- test/home-content.test.ts test/module-editor.test.ts`

Expected: FAIL because the eight localized fields and editor section do not exist.

- [ ] **Step 3: Add the template fields and safe default copy**

Add these eight explicit fields near the end of the `bookingPage` field list. Defining the localized keys directly keeps both language versions required and groups each language together in the editor:

```ts
{ key: "confirmationEmailSubjectEn", label: "English confirmation email subject", type: "text", required: true, maxLength: 120 },
{ key: "confirmationEmailHeadingEn", label: "English confirmation email heading", type: "text", required: true, maxLength: 120 },
{ key: "confirmationEmailBodyEn", label: "English confirmation email body", type: "textarea", required: true, maxLength: 1200 },
{ key: "confirmationEmailClosingEn", label: "English confirmation email closing", type: "textarea", required: true, maxLength: 500 },
{ key: "confirmationEmailSubjectZh", label: "Chinese confirmation email subject", type: "text", required: true, maxLength: 120 },
{ key: "confirmationEmailHeadingZh", label: "Chinese confirmation email heading", type: "text", required: true, maxLength: 120 },
{ key: "confirmationEmailBodyZh", label: "Chinese confirmation email body", type: "textarea", required: true, maxLength: 1200 },
{ key: "confirmationEmailClosingZh", label: "Chinese confirmation email closing", type: "textarea", required: true, maxLength: 500 },
```

Add these seed values:

```ts
confirmationEmailSubjectEn: "Your MidEarth Travel payment is confirmed",
confirmationEmailHeadingEn: "Your trip is confirmed!",
confirmationEmailBodyEn: "Thank you for booking with MidEarth Travel. We have received your payment and look forward to helping you enjoy your journey.",
confirmationEmailClosingEn: "Questions about your trip? Reply to this email or contact MidEarth Travel.",
confirmationEmailSubjectZh: "您的中环旅游付款已确认",
confirmationEmailHeadingZh: "恭喜，您的行程已确认！",
confirmationEmailBodyZh: "感谢您选择中环旅游。我们已收到您的付款，期待陪伴您开启愉快旅程。",
confirmationEmailClosingZh: "如对行程有任何疑问，请回复此邮件或联系中环旅游。",
```

In `getFieldSectionHeader`, return `"Payment success email — English"` for `confirmationEmailSubjectEn` and `"Payment success email — Chinese"` for `confirmationEmailSubjectZh`. Do not add custom rich-text or HTML controls.

- [ ] **Step 4: Run focused CMS tests and verify GREEN**

Run: `npm test -- test/home-content.test.ts test/module-editor.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit the CMS template fields**

```bash
git add src/data/cms-seed.ts src/components/home-module-editor.tsx test/home-content.test.ts test/module-editor.test.ts
git commit -m "feat: add booking email CMS copy"
```

### Task 3: Render a safe localized HTML and plain-text email

**Files:**
- Create: `src/lib/booking-confirmation-template.ts`
- Create: `test/booking-confirmation-template.test.ts`

**Interfaces:**
- Produces: `renderBookingConfirmationEmail(input: BookingConfirmationRenderInput): RenderedBookingEmail`.
- `BookingConfirmationRenderInput` contains `locale`, `content`, customer/booking details, localized tour values, paid amount, and absolute tour URL.
- `RenderedBookingEmail` is `{ subject: string; html: string; text: string }` for Task 4 and Task 6.

- [ ] **Step 1: Write failing renderer tests**

Create representative English, Chinese, and escaping tests:

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { renderBookingConfirmationEmail } from "../src/lib/booking-confirmation-template.ts";

const content = {
  confirmationEmailSubjectEn: "Payment confirmed",
  confirmationEmailHeadingEn: "Your trip is confirmed!",
  confirmationEmailBodyEn: "Thanks for booking.",
  confirmationEmailClosingEn: "See you soon.",
  confirmationEmailSubjectZh: "付款已确认",
  confirmationEmailHeadingZh: "行程已确认！",
  confirmationEmailBodyZh: "感谢您的预订。",
  confirmationEmailClosingZh: "旅途愉快。",
};

test("renders Chinese booking facts in both formats", () => {
  const result = renderBookingConfirmationEmail({
    locale: "zh",
    content,
    customerName: "王小明",
    bookingReference: "TB-2026-ABC12345",
    tourTitle: "枫叶之旅",
    tourCode: "CA08",
    departureSelection: "2026年10月12日",
    adults: 2,
    children: 1,
    duration: "8天7晚",
    departureCity: "渥太华",
    meetingPlace: "中环旅游办公室",
    amountCents: 259900,
    currency: "cad",
    tourUrl: "https://midearth.ca/tours/maple-leaves",
  });

  assert.equal(result.subject, "付款已确认");
  for (const value of ["TB-2026-ABC12345", "枫叶之旅", "2 位成人", "1 位儿童", "CA$2,599.00"]) {
    assert.match(result.html, new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.match(result.text, new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("escapes CMS and customer values before producing HTML", () => {
  const result = renderBookingConfirmationEmail({
    locale: "en",
    content: { ...content, confirmationEmailBodyEn: "<script>alert(1)</script>" },
    customerName: "Ada <Admin>",
    bookingReference: "TB-1",
    tourTitle: "Lake & <Lodge>",
    departureSelection: "July 11",
    adults: 1,
    children: 0,
    duration: "2 days",
    amountCents: 10000,
    currency: "cad",
    tourUrl: "https://midearth.ca/tours/lake",
  });

  assert.doesNotMatch(result.html, /<script>/);
  assert.match(result.html, /&lt;script&gt;/);
  assert.match(result.html, /Ada &lt;Admin&gt;/);
});
```

- [ ] **Step 2: Run the renderer test and verify RED**

Run: `npm test -- test/booking-confirmation-template.test.ts`

Expected: FAIL because the renderer module does not exist.

- [ ] **Step 3: Implement the pure renderer**

Define exact public types and keep escaping local to the renderer:

```ts
import type { BookingLocale } from "./payment-domain.ts";

export type BookingConfirmationRenderInput = {
  locale: BookingLocale;
  content: Record<string, unknown>;
  customerName: string;
  bookingReference: string;
  tourTitle: string;
  tourCode?: string;
  departureSelection: string;
  adults: number;
  children: number;
  duration: string;
  departureCity?: string;
  meetingPlace?: string;
  amountCents: number;
  currency: string;
  tourUrl: string;
};

export type RenderedBookingEmail = {
  subject: string;
  html: string;
  text: string;
};
```

Use `getLocalizedContent` for the four CMS fields and `Intl.NumberFormat(locale === "zh" ? "zh-CN" : "en-CA", { style: "currency", currency: input.currency.toUpperCase() })` for the amount. Build a fixed localized label map for reference, tour, departure, party, duration, departure city, meeting place, amount, and view-tour link. Escape `&`, `<`, `>`, `"`, and `'`; convert escaped body/closing newlines to `<br>` only after escaping. The plain-text body must contain the same facts without HTML tags.

- [ ] **Step 4: Run renderer tests and verify GREEN**

Run: `npm test -- test/booking-confirmation-template.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit the renderer**

```bash
git add src/lib/booking-confirmation-template.ts test/booking-confirmation-template.test.ts
git commit -m "feat: render localized booking emails"
```

### Task 4: Add the server-only Resend transport

**Files:**
- Create: `src/lib/resend-booking-email-core.ts`
- Create: `src/lib/resend-booking-email.ts`
- Create: `test/resend-booking-email.test.ts`
- Modify: `.env.example`

**Interfaces:**
- Consumes: `RenderedBookingEmail` from Task 3.
- Produces from the pure core: `sendBookingEmailWithEnvironment(input, environment, fetchImplementation?): Promise<{ id: string }>` for deterministic tests.
- Produces from the server-only wrapper: `sendBookingEmail(input: SendBookingEmailInput): Promise<{ id: string }>` for Task 6.
- `SendBookingEmailInput` is `{ paymentId: string; to: string; message: RenderedBookingEmail }`.

- [ ] **Step 1: Write failing configuration and transport tests**

Mock `globalThis.fetch` and provide an explicit environment object so tests never depend on developer secrets:

```ts
import assert from "node:assert/strict";
import test from "node:test";
import {
  getResendBookingEmailConfig,
  sendBookingEmailWithEnvironment,
} from "../src/lib/resend-booking-email-core.ts";

test("requires server-side Resend configuration", () => {
  assert.throws(() => getResendBookingEmailConfig({}), /RESEND_API_KEY/);
  assert.throws(() => getResendBookingEmailConfig({ RESEND_API_KEY: "re_test" }), /BOOKING_EMAIL_FROM/);
});

test("sends both formats with a stable payment idempotency key", async () => {
  const originalFetch = globalThis.fetch;
  let request: Request | undefined;
  globalThis.fetch = async (input, init) => {
    request = new Request(input, init);
    return Response.json({ id: "email_123" });
  };

  try {
    const result = await sendBookingEmailWithEnvironment(
      {
        paymentId: "pay_123",
        to: "guest@example.com",
        message: { subject: "Confirmed", html: "<p>Confirmed</p>", text: "Confirmed" },
      },
      {
        RESEND_API_KEY: "re_test_key",
        BOOKING_EMAIL_FROM: "MidEarth Travel <bookings@midearth.ca>",
        BOOKING_EMAIL_REPLY_TO: "travel@midearth.ca",
      },
    );

    assert.equal(result.id, "email_123");
    assert.equal(request?.url, "https://api.resend.com/emails");
    assert.equal(request?.headers.get("Idempotency-Key"), "booking-confirmation-pay_123");
    assert.equal(request?.headers.get("Authorization"), "Bearer re_test_key");
    assert.deepEqual(await request?.json(), {
      from: "MidEarth Travel <bookings@midearth.ca>",
      to: ["guest@example.com"],
      reply_to: "travel@midearth.ca",
      subject: "Confirmed",
      html: "<p>Confirmed</p>",
      text: "Confirmed",
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});
```

Add a second test that returns HTTP 422 and asserts a sanitized `Resend booking email failed (422)` error.

- [ ] **Step 2: Run the transport test and verify RED**

Run: `npm test -- test/resend-booking-email.test.ts`

Expected: FAIL because the transport module does not exist.

- [ ] **Step 3: Implement config parsing and the Resend request**

Use native `fetch` so no runtime package is required. Keep environment parsing and the injectable fetch request in `resend-booking-email-core.ts`; validate that the API key and sender are non-empty and do not contain `replace_me`, and validate optional reply-to only when present. POST the exact payload asserted above to `https://api.resend.com/emails` with `Authorization`, `Content-Type: application/json`, and `Idempotency-Key: booking-confirmation-${paymentId}`. Require a non-empty response `id` and never include the API key or response body in thrown messages.

Make `resend-booking-email.ts` the production boundary:

```ts
import "server-only";
import {
  sendBookingEmailWithEnvironment,
  type SendBookingEmailInput,
} from "./resend-booking-email-core.ts";

export function sendBookingEmail(input: SendBookingEmailInput): Promise<{ id: string }> {
  return sendBookingEmailWithEnvironment(input, process.env);
}
```

The Node test runner imports only the pure core; application code imports only the server-only wrapper.

Append to `.env.example`:

```dotenv
RESEND_API_KEY=re_replace_me
BOOKING_EMAIL_FROM=MidEarth Travel <bookings@replace_with_verified_domain>
BOOKING_EMAIL_REPLY_TO=replace_with_customer_service_email
```

- [ ] **Step 4: Run the transport test and verify GREEN**

Run: `npm test -- test/resend-booking-email.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit the Resend transport**

```bash
git add src/lib/resend-booking-email-core.ts src/lib/resend-booking-email.ts test/resend-booking-email.test.ts .env.example
git commit -m "feat: add Resend booking transport"
```

### Task 5: Add focused Supabase lookup and delivery-state operations

**Files:**
- Create: `src/lib/booking-records.ts`
- Modify: `src/lib/supabase-bookings.ts`
- Modify: `src/lib/supabase-payments.ts`
- Test: `test/supabase-bookings.test.ts`
- Test: `test/supabase-payments.test.ts`

**Interfaces:**
- Produces: pure `rowToBooking`, `bookingToRow`, and `loadBookingByIdWithRequest(id, request)` helpers in `booking-records.ts`.
- Produces: server-only `loadBookingById(id: string): Promise<BookingRecord | null>` in `supabase-bookings.ts`.
- Produces: exported `PaymentOrderDeliveryRecord` with payment, booking, amount, status, and confirmation-delivery properties.
- Changes: `updatePaymentOrderFromStripe(input): Promise<PaymentOrderDeliveryRecord | null>` returns the updated row using `Prefer: return=representation`.
- Produces: `markConfirmationEmailSent(paymentId, emailId): Promise<void>` and `recordConfirmationEmailError(paymentId, message): Promise<void>`.

- [ ] **Step 1: Write failing repository tests**

In `test/supabase-payments.test.ts`, mock sequential Supabase responses and assert the updated row is returned and the two delivery-state patches are exact:

```ts
assert.deepEqual(await updatePaymentOrderFromStripe({
  sessionId: "cs_123",
  status: "paid",
  paymentIntentId: "pi_123",
}), {
  id: "pay_123",
  reference: "PAY-2026-123",
  bookingId: "tour_123",
  tourSlug: "maple-leaves",
  customerEmail: "guest@example.com",
  amountCents: 259900,
  currency: "cad",
  status: "paid",
  confirmationEmailSentAt: null,
  confirmationEmailId: null,
  confirmationEmailError: null,
});
```

Assert `markConfirmationEmailSent` patches `confirmation_email_sent_at`, `confirmation_email_id`, clears `confirmation_email_error`, and updates `updated_at`. Assert `recordConfirmationEmailError` patches only the sanitized error and `updated_at`.

Create `test/supabase-bookings.test.ts` against `loadBookingByIdWithRequest` with a stub request function. For a one-row response, assert the Task 1 structured fields are mapped; for an empty response, assert it returns `null`. This test imports the pure record module rather than the `server-only` Supabase boundary.

- [ ] **Step 2: Run focused repository tests and verify RED**

Run: `npm test -- test/supabase-bookings.test.ts test/supabase-payments.test.ts`

Expected: FAIL because the lookup/state functions and return value do not exist.

- [ ] **Step 3: Implement the focused repository operations**

Move `BookingRow`, `rowToBooking`, and `bookingToRow` from `supabase-bookings.ts` to the pure `booking-records.ts`. Add a request-injected lookup there:

```ts
export async function loadBookingByIdWithRequest(
  id: string,
  request: <T>(path: string, init?: RequestInit) => Promise<T>,
): Promise<BookingRecord | null> {
  const rows = await request<BookingRow[]>(
    `/rest/v1/bookings?id=eq.${encodeURIComponent(id)}&select=*&limit=1`,
  );
  return rows[0] ? rowToBooking(rows[0]) : null;
}
```

Keep `supabase-bookings.ts` marked `server-only` and expose the production wrapper:

```ts
export function loadBookingById(id: string): Promise<BookingRecord | null> {
  return loadBookingByIdWithRequest(id, request);
}
```

Export this delivery shape from `supabase-payments.ts`:

```ts
export type PaymentOrderDeliveryRecord = {
  id: string;
  reference: string;
  bookingId: string | null;
  tourSlug: string;
  customerEmail: string;
  amountCents: number;
  currency: string;
  status: InternalPaymentStatus;
  confirmationEmailSentAt: string | null;
  confirmationEmailId: string | null;
  confirmationEmailError: string | null;
};
```

Map database snake-case fields in one private `rowToPaymentDelivery` helper. Change the Stripe update to `Prefer: return=representation` and return the first mapped row or `null`. Limit recorded error text to 500 characters before persistence. On success, set a new ISO timestamp, provider ID, `confirmation_email_error: null`, and `updated_at`.

- [ ] **Step 4: Run focused repository tests and verify GREEN**

Run: `npm test -- test/supabase-bookings.test.ts test/supabase-payments.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit the persistence operations**

```bash
git add src/lib/booking-records.ts src/lib/supabase-bookings.ts src/lib/supabase-payments.ts test/supabase-bookings.test.ts test/supabase-payments.test.ts
git commit -m "feat: track booking email delivery"
```

### Task 6: Deliver paid confirmations from the Stripe webhook

**Files:**
- Create: `src/lib/booking-confirmation-delivery.ts`
- Modify: `src/app/api/webhooks/stripe/route.ts`
- Create: `test/booking-confirmation-delivery.test.ts`
- Modify: `test/supabase-payments.test.ts`

**Interfaces:**
- Consumes: `PaymentOrderDeliveryRecord`, `BookingRecord`, the published `bookingPage` module, published `Tour`, Task 3 renderer, and Task 4 transport.
- Produces: pure `deliverPaidBookingConfirmation(payment, siteUrl, dependencies): Promise<void>`; all I/O is supplied explicitly so Node tests never import `server-only` modules.
- Route behavior: after a `paid` update returns a payment, await delivery before recording the Stripe event; non-paid statuses never call delivery.

- [ ] **Step 1: Write failing delivery-orchestrator tests**

Build dependency fakes rather than making network calls. Cover success, already-sent, missing structured booking data, and send failure:

```ts
test("renders and records one paid confirmation", async () => {
  const calls: string[] = [];
  await deliverPaidBookingConfirmation(payment, "https://midearth.ca", {
    loadBookingById: async () => booking,
    loadPublishedTours: async () => [tour],
    loadPublishedHomeModules: async () => [bookingPage],
    sendBookingEmail: async (input) => {
      calls.push(input.paymentId);
      return { id: "email_123" };
    },
    markConfirmationEmailSent: async (paymentId, emailId) => {
      calls.push(`${paymentId}:${emailId}`);
    },
    recordConfirmationEmailError: async () => {
      throw new Error("error recorder should not run");
    },
  });

  assert.deepEqual(calls, ["pay_123", "pay_123:email_123"]);
});

test("skips an already-sent payment", async () => {
  let sends = 0;
  await deliverPaidBookingConfirmation(
    { ...payment, confirmationEmailSentAt: "2026-11-05T12:00:00.000Z" },
    "https://midearth.ca",
    { ...dependencies, sendBookingEmail: async () => { sends += 1; return { id: "unexpected" }; } },
  );
  assert.equal(sends, 0);
});
```

For a sender failure, assert `recordConfirmationEmailError(payment.id, "Resend booking email failed (503)")` runs and the original error is rethrown. For `bookingId === null`, missing booking, missing tour, or null `adults`/`children`/`departureSelection`, assert a descriptive retryable error.

Add a route source test that requires `deliverPaidBookingConfirmation` inside the `status === "paid"` branch and before `recordWebhookEvent`.

- [ ] **Step 2: Run delivery and webhook tests and verify RED**

Run: `npm test -- test/booking-confirmation-delivery.test.ts test/supabase-payments.test.ts`

Expected: FAIL because the orchestrator and webhook call do not exist.

- [ ] **Step 3: Implement the dependency-injected delivery orchestrator**

Define a `BookingConfirmationDependencies` type whose methods exactly match the fakes above. Do not import Supabase, CMS, tour, or Resend production modules into this file; the Route Handler supplies them. Type-only imports are allowed and are erased by TypeScript.

The function must:

1. return immediately when `confirmationEmailSentAt` is non-null;
2. reject a non-paid record or missing `bookingId`;
3. load the booking, tour, and published modules in parallel;
4. require the structured booking counts and departure selection and use the validated/defaulted booking locale;
5. select the `bookingPage` module and localized tour title, duration, departure city, and meeting place with the existing localization helpers;
6. build the absolute tour URL with `new URL(`/tours/${encodeURIComponent(tour.slug)}`, siteUrl).toString()`;
7. render, send, then call `markConfirmationEmailSent(payment.id, result.id)`;
8. on any error, attempt `recordConfirmationEmailError(payment.id, safeMessage)` and rethrow the original error.

Do not log the rendered body, API key, or provider response body.

- [ ] **Step 4: Wire delivery into the signed webhook**

Keep `export const runtime = "nodejs"`. Capture the updated payment:

```ts
const payment = await updatePaymentOrderFromStripe({
  sessionId: session.id,
  status,
  paymentIntentId:
    typeof session.payment_intent === "string" ? session.payment_intent : null,
});

if (status === "paid") {
  if (!payment) throw new Error(`Payment order not found for Stripe session: ${session.id}`);
  await deliverPaidBookingConfirmation(payment, new URL(request.url).origin, {
    loadBookingById,
    loadPublishedTours,
    loadPublishedHomeModules,
    sendBookingEmail,
    markConfirmationEmailSent,
    recordConfirmationEmailError,
  });
}
```

Leave `recordWebhookEvent` after this block. The existing outer catch returns HTTP 500, which tells Stripe to retry while the already-written paid state remains intact.

- [ ] **Step 5: Run delivery and webhook tests and verify GREEN**

Run: `npm test -- test/booking-confirmation-delivery.test.ts test/supabase-payments.test.ts`

Expected: PASS.

- [ ] **Step 6: Run the complete payment and booking regression group**

Run: `npm test -- test/payment-domain.test.ts test/tour-booking.test.ts test/supabase-payments.test.ts test/booking-confirmation-persistence.test.ts test/booking-confirmation-template.test.ts test/resend-booking-email.test.ts test/booking-confirmation-delivery.test.ts`

Expected: PASS.

- [ ] **Step 7: Commit webhook delivery**

```bash
git add src/lib/booking-confirmation-delivery.ts src/app/api/webhooks/stripe/route.ts test/booking-confirmation-delivery.test.ts test/supabase-payments.test.ts
git commit -m "feat: email customers after Stripe payment"
```

### Task 7: Document rollout and run final verification

**Files:**
- Modify: `README.md`
- Verify: all files changed in Tasks 1–6

**Interfaces:**
- Documents the operational contract for Supabase migration order, Resend domain verification, environment configuration, CMS publication, and Stripe test-mode checks.

- [ ] **Step 1: Add deployment instructions**

Add a concise `Booking confirmation email` section to `README.md` with these ordered requirements:

```md
## Booking confirmation email

1. Apply `supabase/migrations/202611050001_booking_confirmation_emails.sql`.
2. Verify the MidEarth sending domain in Resend.
3. Configure `RESEND_API_KEY`, `BOOKING_EMAIL_FROM`, and optional `BOOKING_EMAIL_REPLY_TO` as server-side deployment variables.
4. In Admin → Booking Page, review and publish both English and Chinese payment-success email copy.
5. Complete one English and one Chinese Stripe test payment. Confirm one email per payment and verify the booking reference, departure, party, tour information, and paid amount.

Stripe retries a failed email delivery without changing the successful payment status. Replaying an already completed event must not create another message.
```

- [ ] **Step 2: Run the full automated test suite**

Run: `npm test`

Expected: all tests PASS with zero failures.

- [ ] **Step 3: Run lint**

Run: `npm run lint`

Expected: exit code 0 with no ESLint errors.

- [ ] **Step 4: Run the production build**

Run: `npm run build`

Expected: Next.js 16.2.9 production build succeeds, including TypeScript checking and Route Handler compilation.

- [ ] **Step 5: Check the final diff for secrets and whitespace errors**

Run: `git diff --check && git diff -- . ':!package-lock.json' && git status --short`

Expected: no whitespace errors; only intended feature, test, migration, environment-example, and documentation changes; no real Resend key or customer address.

- [ ] **Step 6: Commit rollout documentation**

```bash
git add README.md
git commit -m "docs: explain booking email rollout"
```

- [ ] **Step 7: Perform test-mode acceptance after deployment configuration exists**

In the deployed test environment, publish distinct English and Chinese template text, complete one Stripe test payment in each language, and verify exactly one correctly localized email per payment. Replay each Stripe event once from the Stripe dashboard and verify Resend shows no second message for either payment. Record any configuration-only blocker separately; do not weaken automated tests or commit secrets to bypass it.
