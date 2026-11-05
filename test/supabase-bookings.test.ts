import assert from "node:assert/strict";
import test from "node:test";
import { loadBookingByIdWithRequest } from "../src/lib/booking-records.ts";

const bookingRow = {
  id: "tour_123",
  reference: "TB-2026-TOUR123",
  status: "new" as const,
  source: "tour_email" as const,
  tour_slug: "maple-leaves",
  tour_title: "Maple Leaves",
  tour_code: "ML-2026",
  customer_name: "Ada Lovelace",
  customer_email: "ada@example.com",
  customer_phone: "613-555-0123",
  departure_date: "2026-10-12",
  party_size: 3,
  locale: "zh" as const,
  adult_count: 2,
  child_count: 1,
  departure_selection: "October 12, 2026",
  notes: "Window seats, please.",
  created_at: "2026-10-01T00:00:00.000Z",
  updated_at: "2026-10-01T00:00:00.000Z",
};

test("loads and maps the complete structured booking record", async () => {
  let requestedPath = "";
  const request = async <T>(path: string): Promise<T> => {
    requestedPath = path;
    return [bookingRow] as T;
  };
  const booking = await loadBookingByIdWithRequest("tour_123", request);

  assert.equal(
    requestedPath,
    "/rest/v1/bookings?id=eq.tour_123&select=*&limit=1",
  );
  assert.deepEqual(booking, {
    id: "tour_123",
    reference: "TB-2026-TOUR123",
    status: "new",
    source: "tour_email",
    tourSlug: "maple-leaves",
    tourTitle: "Maple Leaves",
    tourCode: "ML-2026",
    customerName: "Ada Lovelace",
    customerEmail: "ada@example.com",
    customerPhone: "613-555-0123",
    departureDate: "2026-10-12",
    partySize: 3,
    locale: "zh",
    adults: 2,
    children: 1,
    departureSelection: "October 12, 2026",
    notes: "Window seats, please.",
    createdAt: "2026-10-01T00:00:00.000Z",
    updatedAt: "2026-10-01T00:00:00.000Z",
  });
});

test("returns null when no booking row matches the id", async () => {
  const request = async <T>(path: string): Promise<T> => {
    assert.equal(
      path,
      "/rest/v1/bookings?id=eq.missing%20id&select=*&limit=1",
    );
    return [] as T;
  };
  const booking = await loadBookingByIdWithRequest("missing id", request);

  assert.equal(booking, null);
});
