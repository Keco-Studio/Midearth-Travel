import type { InternalPaymentStatus } from "@/lib/payment-domain";
import type { PaymentRecord } from "@/types/cms";

export type PaymentOrderInput = {
  id: string;
  reference: string;
  bookingId?: string;
  tourSlug: string;
  fareLabel: string;
  paymentType: "deposit" | "balance" | "full";
  customerEmail: string;
  amountCents: number;
  currency: "cad";
};

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    throw new Error("Supabase payment persistence is not configured");
  }
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
    const body = await response.text();
    const error = new Error(`Supabase request failed (${response.status})`);
    Object.assign(error, { status: response.status, body });
    throw error;
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export async function createPaymentOrder(input: PaymentOrderInput) {
  const rows = await request<Array<Record<string, unknown>>>("/rest/v1/payment_orders", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      id: input.id,
      reference: input.reference,
      booking_id: input.bookingId ?? null,
      tour_slug: input.tourSlug,
      fare_label: input.fareLabel,
      payment_type: input.paymentType,
      customer_email: input.customerEmail,
      amount_cents: input.amountCents,
      currency: input.currency,
    }),
  });
  return rows[0];
}

export async function attachStripeSession(
  paymentId: string,
  sessionId: string,
) {
  await request<unknown[]>(`/rest/v1/payment_orders?id=eq.${encodeURIComponent(paymentId)}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ stripe_checkout_session_id: sessionId }),
  });
}

export async function recordWebhookEvent(
  eventId: string,
  eventType: string,
  payload: Record<string, unknown>,
): Promise<boolean> {
  try {
    await request<unknown[]>("/rest/v1/payment_webhook_events", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ id: eventId, event_type: eventType, payload }),
    });
    return true;
  } catch (error) {
    if (getErrorStatus(error) === 409) return false;
    throw error;
  }
}

export async function hasWebhookEvent(eventId: string): Promise<boolean> {
  const rows = await request<Array<{ id: string }>>(
    `/rest/v1/payment_webhook_events?id=eq.${encodeURIComponent(eventId)}&select=id&limit=1`,
  );
  return rows.length > 0;
}

export async function updatePaymentOrderFromStripe(input: {
  sessionId: string;
  status: InternalPaymentStatus;
  paymentIntentId?: string | null;
}) {
  await request<unknown[]>(
    `/rest/v1/payment_orders?stripe_checkout_session_id=eq.${encodeURIComponent(input.sessionId)}`,
    {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        status: input.status,
        stripe_payment_intent_id: input.paymentIntentId ?? null,
        paid_at: input.status === "paid" ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      }),
    },
  );
}

function getErrorStatus(error: unknown): number | undefined {
  return typeof error === "object" && error !== null && "status" in error
    ? Number((error as { status?: unknown }).status)
    : undefined;
}

type PaymentOrderRow = {
  id: string;
  reference: string;
  booking_id: string | null;
  tour_slug: string;
  fare_label: string;
  payment_type: "deposit" | "balance" | "full";
  customer_email: string;
  amount_cents: number;
  currency: string;
  status: InternalPaymentStatus;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
};

export async function loadPaymentOrders(): Promise<PaymentRecord[]> {
  const rows = await request<PaymentOrderRow[]>(
    "/rest/v1/payment_orders?select=*&order=created_at.desc",
  );
  return rows.map((row) => ({
    id: row.id,
    reference: row.reference,
    bookingId: row.booking_id ?? row.id,
    bookingReference: row.booking_id ?? "Online checkout",
    customerName: row.customer_email,
    tourTitle: row.tour_slug,
    amount: row.amount_cents / 100,
    currency: row.currency.toUpperCase(),
    status: row.status,
    method: "card",
    type: row.payment_type,
    transactionId: row.stripe_payment_intent_id ?? row.stripe_checkout_session_id ?? undefined,
    description: `${row.fare_label} fare — ${row.tour_slug}`,
    paidAt: row.paid_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}
