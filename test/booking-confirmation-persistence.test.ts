import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  bookingToRow,
  rowToBooking,
} from "../src/lib/booking-records.ts";

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

test("maps the locale and structured travel party through a booking row", () => {
  const row = bookingToRow({
    id: "tour-123",
    reference: "TB-2026-TOUR123",
    status: "new",
    source: "tour_email",
    tourSlug: "maple-leaves",
    tourTitle: "Maple Leaves",
    tourCode: "ML-2026",
    customerName: "Ada Lovelace",
    customerEmail: "ada@example.com",
    customerPhone: "613-555-0123",
    partySize: 3,
    locale: "zh",
    adults: 2,
    children: 1,
    departureSelection: "October 12, 2026",
    notes: "Window seats, please.",
    createdAt: "2026-10-01T00:00:00.000Z",
    updatedAt: "2026-10-01T00:00:00.000Z",
  });

  assert.deepEqual(
    {
      locale: row.locale,
      adults: row.adult_count,
      children: row.child_count,
      departureSelection: row.departure_selection,
    },
    {
      locale: "zh",
      adults: 2,
      children: 1,
      departureSelection: "October 12, 2026",
    },
  );
  assert.deepEqual(
    {
      locale: rowToBooking(row).locale,
      adults: rowToBooking(row).adults,
      children: rowToBooking(row).children,
      departureSelection: rowToBooking(row).departureSelection,
    },
    {
      locale: "zh",
      adults: 2,
      children: 1,
      departureSelection: "October 12, 2026",
    },
  );
});

test("keeps historical booking rows compatible when structured details are absent", () => {
  const booking = rowToBooking({
    id: "quote-123",
    reference: "QR-2026-QUOTE123",
    status: "new",
    source: "quote_request",
    tour_slug: null,
    tour_title: null,
    tour_code: null,
    customer_name: "Ada Lovelace",
    customer_email: "ada@example.com",
    customer_phone: "613-555-0123",
    departure_date: null,
    party_size: null,
    locale: null,
    adult_count: null,
    child_count: null,
    departure_selection: null,
    notes: null,
    created_at: "2026-10-01T00:00:00.000Z",
    updated_at: "2026-10-01T00:00:00.000Z",
  });

  assert.deepEqual(
    {
      locale: booking.locale,
      adults: booking.adults,
      children: booking.children,
      departureSelection: booking.departureSelection,
    },
    {
      locale: undefined,
      adults: undefined,
      children: undefined,
      departureSelection: undefined,
    },
  );
});
