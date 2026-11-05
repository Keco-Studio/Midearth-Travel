import test from "node:test";
import assert from "node:assert/strict";
import {
  hasWebhookEvent,
  markConfirmationEmailSent,
  recordWebhookEvent,
  recordConfirmationEmailError,
  updatePaymentOrderFromStripe,
} from "../src/lib/supabase-payments.ts";
import * as paymentPersistence from "../src/lib/supabase-payments.ts";

const paymentOrderRow = {
  id: "pay_123",
  reference: "PAY-2026-123",
  booking_id: "tour_123",
  tour_slug: "maple-leaves",
  fare_label: "Adult",
  payment_type: "full",
  customer_email: "guest@example.com",
  amount_cents: 259900,
  currency: "cad",
  status: "paid" as const,
  stripe_checkout_session_id: "cs_123",
  stripe_payment_intent_id: "pi_123",
  paid_at: "2026-11-05T10:00:00.000Z",
  confirmation_email_sent_at: null,
  confirmation_email_id: null,
  confirmation_email_error: null,
  created_at: "2026-11-05T09:00:00.000Z",
  updated_at: "2026-11-05T10:00:00.000Z",
};

function setSupabaseConfig() {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";
}

test("returns the updated delivery record from a paid Stripe event", async () => {
  const originalFetch = globalThis.fetch;
  setSupabaseConfig();
  let requestedUrl = "";
  let requestedInit: RequestInit | undefined;
  globalThis.fetch = async (url, init) => {
    requestedUrl = String(url);
    requestedInit = init;
    return Response.json([paymentOrderRow]);
  };
  try {
    assert.deepEqual(
      await updatePaymentOrderFromStripe({
        sessionId: "cs_123",
        status: "paid",
        paymentIntentId: "pi_123",
      }),
      {
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
      },
    );

    assert.equal(
      requestedUrl,
      "https://example.supabase.co/rest/v1/payment_orders?stripe_checkout_session_id=eq.cs_123",
    );
    assert.equal(requestedInit?.method, "PATCH");
    assert.deepEqual(requestedInit?.headers, {
      apikey: "test-service-key",
      Authorization: "Bearer test-service-key",
      "Content-Type": "application/json",
      Prefer: "return=representation",
    });
    assert.equal(requestedInit?.cache, "no-store");
    const body = JSON.parse(String(requestedInit?.body));
    assert.deepEqual(Object.keys(body).sort(), [
      "paid_at",
      "status",
      "stripe_payment_intent_id",
      "updated_at",
    ]);
    assert.equal(body.status, "paid");
    assert.equal(body.stripe_payment_intent_id, "pi_123");
    assert.match(body.paid_at, /^\d{4}-\d{2}-\d{2}T/);
    assert.match(body.updated_at, /^\d{4}-\d{2}-\d{2}T/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("loads one payment delivery record for an administrator retry", async () => {
  const loadPaymentOrderForConfirmation = Reflect.get(
    paymentPersistence,
    "loadPaymentOrderForConfirmation",
  );
  assert.equal(typeof loadPaymentOrderForConfirmation, "function");

  const originalFetch = globalThis.fetch;
  setSupabaseConfig();
  let requestedUrl = "";
  globalThis.fetch = async (url) => {
    requestedUrl = String(url);
    return Response.json([paymentOrderRow]);
  };
  try {
    const payment = await loadPaymentOrderForConfirmation("pay_123");
    assert.equal(payment?.id, "pay_123");
    assert.equal(payment?.status, "paid");
    assert.equal(
      requestedUrl,
      "https://example.supabase.co/rest/v1/payment_orders?id=eq.pay_123&select=*&limit=1",
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("does not clear paid_at when a later Stripe failure is recorded", async () => {
  const originalFetch = globalThis.fetch;
  setSupabaseConfig();
  let requestedInit: RequestInit | undefined;
  globalThis.fetch = async (_url, init) => {
    requestedInit = init;
    return Response.json([{ ...paymentOrderRow, status: "failed" }]);
  };
  try {
    await updatePaymentOrderFromStripe({ sessionId: "cs_123", status: "failed" });
    const body = JSON.parse(String(requestedInit?.body));
    assert.equal(body.status, "failed");
    assert.equal("paid_at" in body, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("stores the confirmation provider id after email delivery", async () => {
  const originalFetch = globalThis.fetch;
  setSupabaseConfig();
  let requestedUrl = "";
  let requestedInit: RequestInit | undefined;
  globalThis.fetch = async (url, init) => {
    requestedUrl = String(url);
    requestedInit = init;
    return new Response(null, { status: 204 });
  };
  try {
    await markConfirmationEmailSent("pay_123", "email_123");
    assert.equal(
      requestedUrl,
      "https://example.supabase.co/rest/v1/payment_orders?id=eq.pay_123",
    );
    assert.equal(requestedInit?.method, "PATCH");
    assert.deepEqual(requestedInit?.headers, {
      apikey: "test-service-key",
      Authorization: "Bearer test-service-key",
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    });
    const body = JSON.parse(String(requestedInit?.body));
    assert.deepEqual(Object.keys(body).sort(), [
      "confirmation_email_error",
      "confirmation_email_id",
      "confirmation_email_sent_at",
      "updated_at",
    ]);
    assert.equal(body.confirmation_email_id, "email_123");
    assert.equal(body.confirmation_email_error, null);
    assert.match(body.confirmation_email_sent_at, /^\d{4}-\d{2}-\d{2}T/);
    assert.match(body.updated_at, /^\d{4}-\d{2}-\d{2}T/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("records only a bounded confirmation delivery error", async () => {
  const originalFetch = globalThis.fetch;
  setSupabaseConfig();
  let requestedUrl = "";
  let requestedInit: RequestInit | undefined;
  globalThis.fetch = async (url, init) => {
    requestedUrl = String(url);
    requestedInit = init;
    return Response.json([{ id: "pay_123" }]);
  };
  try {
    assert.equal(
      await recordConfirmationEmailError("pay_123", "x".repeat(600)),
      true,
    );
    assert.equal(
      requestedUrl,
      "https://example.supabase.co/rest/v1/payment_orders?id=eq.pay_123&confirmation_email_sent_at=is.null",
    );
    assert.equal(requestedInit?.method, "PATCH");
    assert.deepEqual(requestedInit?.headers, {
      apikey: "test-service-key",
      Authorization: "Bearer test-service-key",
      "Content-Type": "application/json",
      Prefer: "return=representation",
    });
    const body = JSON.parse(String(requestedInit?.body));
    assert.deepEqual(Object.keys(body).sort(), [
      "confirmation_email_error",
      "updated_at",
    ]);
    assert.equal(body.confirmation_email_error, "x".repeat(500));
    assert.match(body.updated_at, /^\d{4}-\d{2}-\d{2}T/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("does not overwrite cleared error metadata after a concurrent send succeeds", async () => {
  const originalFetch = globalThis.fetch;
  setSupabaseConfig();
  const requests: Array<{ url: string; init?: RequestInit }> = [];
  globalThis.fetch = async (url, init) => {
    requests.push({ url: String(url), init });
    if (requests.length === 1) return new Response(null, { status: 204 });
    return Response.json([]);
  };
  try {
    await markConfirmationEmailSent("pay_123", "email_123");
    assert.equal(
      await recordConfirmationEmailError("pay_123", "late concurrent failure"),
      false,
    );
    assert.equal(requests.length, 2);
    assert.equal(
      requests[1].url,
      "https://example.supabase.co/rest/v1/payment_orders?id=eq.pay_123&confirmation_email_sent_at=is.null",
    );
    assert.deepEqual(requests[1].init?.headers, {
      apikey: "test-service-key",
      Authorization: "Bearer test-service-key",
      "Content-Type": "application/json",
      Prefer: "return=representation",
    });
    assert.deepEqual(
      Object.keys(JSON.parse(String(requests[1].init?.body))).sort(),
      ["confirmation_email_error", "updated_at"],
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("recognizes a previously processed Stripe event", async () => {
  const originalFetch = globalThis.fetch;
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";
  globalThis.fetch = async () => Response.json([{ id: "evt_123" }]);
  try {
    assert.equal(await hasWebhookEvent("evt_123"), true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("treats a unique-key conflict as a duplicate webhook delivery", async () => {
  const originalFetch = globalThis.fetch;
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";
  globalThis.fetch = async () => new Response("duplicate", { status: 409 });
  try {
    assert.equal(await recordWebhookEvent("evt_123", "checkout.session.completed", {}), false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
