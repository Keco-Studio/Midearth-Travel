import test from "node:test";
import assert from "node:assert/strict";
import {
  hasWebhookEvent,
  recordWebhookEvent,
} from "../src/lib/supabase-payments.ts";

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
