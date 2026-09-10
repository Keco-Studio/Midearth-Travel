import "server-only";

import { bookingSeeds } from "@/data/cms-seed";
import type { BookingRecord, BookingSource, BookingStatus } from "@/types/cms";

type BookingRow = {
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
  notes: string | null;
  created_at: string;
  updated_at: string;
};

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/$/, "");
  const key = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )?.trim();
  if (!url || !key) throw new Error("Supabase is not configured");
  return { url, key };
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { url, key } = getSupabaseConfig();
  const response = await fetch(`${url}${path}`, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error((await response.text()) || "Supabase booking request failed");
  }
  if (response.status === 204) return [] as T;
  const text = await response.text();
  if (!text) return [] as T;
  return JSON.parse(text) as T;
}

function rowToBooking(row: BookingRow): BookingRecord {
  return {
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
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function bookingToRow(booking: BookingRecord): BookingRow {
  return {
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
    created_at: booking.createdAt,
    updated_at: booking.updatedAt,
  };
}

export async function loadBookings(): Promise<BookingRecord[]> {
  try {
    const rows = await ensureBookings();
    return rows.map(rowToBooking);
  } catch (error) {
    console.error("Unable to load bookings", error);
    return bookingSeeds.map((seed) => ({ ...seed }));
  }
}

export async function updateBookingStatus(
  id: string,
  status: BookingStatus,
): Promise<BookingRecord> {
  const updatedAt = new Date().toISOString();
  const rows = await request<BookingRow[]>(
    `/rest/v1/bookings?id=eq.${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({ status, updated_at: updatedAt }),
    },
  );
  const row = rows[0];
  if (!row) throw new Error(`Booking not found: ${id}`);
  return rowToBooking(row);
}

async function ensureBookings(): Promise<BookingRow[]> {
  const rows = await request<BookingRow[]>(
    "/rest/v1/bookings?select=*&order=created_at.desc",
  );
  if (rows.length > 0) return rows;

  await request<BookingRow[]>("/rest/v1/bookings?on_conflict=id", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify(bookingSeeds.map(bookingToRow)),
  });
  return request<BookingRow[]>("/rest/v1/bookings?select=*&order=created_at.desc");
}
