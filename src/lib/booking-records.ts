import type { BookingLocale } from "@/lib/payment-domain";
import type { BookingRecord, BookingSource, BookingStatus } from "@/types/cms";

export type BookingRow = {
  id: string;
  reference: string;
  status: BookingStatus;
  source: BookingSource;
  tour_slug: string | null;
  tour_title: string | null;
  tour_code: string | null;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  departure_date: string | null;
  party_size: number | null;
  locale?: BookingLocale | null;
  adult_count?: number | null;
  child_count?: number | null;
  departure_selection?: string | null;
  notes: string | null;
  add_on_selections?: Array<{ addOnId: string; ticketTypeId: string; quantity: number }> | null;
  created_at: string;
  updated_at: string;
};

export function rowToBooking(row: BookingRow): BookingRecord {
  const booking: BookingRecord = {
    id: row.id,
    reference: row.reference,
    status: row.status,
    source: row.source,
    tourSlug: row.tour_slug ?? undefined,
    tourTitle: row.tour_title ?? undefined,
    tourCode: row.tour_code ?? undefined,
    customerName: row.customer_name,
    customerEmail: row.customer_email ?? undefined,
    customerPhone: row.customer_phone ?? undefined,
    departureDate: row.departure_date ?? undefined,
    partySize: row.party_size ?? undefined,
    locale: row.locale ?? undefined,
    adults: row.adult_count ?? undefined,
    children: row.child_count ?? undefined,
    departureSelection: row.departure_selection ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
  if (row.add_on_selections !== undefined && row.add_on_selections !== null) {
    booking.addOnSelections = row.add_on_selections;
  }
  return booking;
}

export function bookingToRow(booking: BookingRecord): BookingRow {
  const row: BookingRow = {
    id: booking.id,
    reference: booking.reference,
    status: booking.status,
    source: booking.source,
    tour_slug: booking.tourSlug ?? null,
    tour_title: booking.tourTitle ?? null,
    tour_code: booking.tourCode ?? null,
    customer_name: booking.customerName,
    customer_email: booking.customerEmail ?? null,
    customer_phone: booking.customerPhone ?? null,
    departure_date: booking.departureDate ?? null,
    party_size: booking.partySize ?? null,
    notes: booking.notes ?? null,
    add_on_selections: booking.addOnSelections ?? [],
    created_at: booking.createdAt,
    updated_at: booking.updatedAt,
  };
  if (booking.locale !== undefined) row.locale = booking.locale;
  if (booking.adults !== undefined) row.adult_count = booking.adults;
  if (booking.children !== undefined) row.child_count = booking.children;
  if (booking.departureSelection !== undefined) {
    row.departure_selection = booking.departureSelection;
  }
  return row;
}

export async function loadBookingByIdWithRequest(
  id: string,
  request: <T>(path: string, init?: RequestInit) => Promise<T>,
): Promise<BookingRecord | null> {
  const rows = await request<BookingRow[]>(
    `/rest/v1/bookings?id=eq.${encodeURIComponent(id)}&select=*&limit=1`,
  );
  return rows[0] ? rowToBooking(rows[0]) : null;
}
