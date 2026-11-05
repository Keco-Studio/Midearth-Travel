import assert from "node:assert/strict";
import test from "node:test";
import {
  getResendBookingEmailConfig,
  sendBookingEmailWithEnvironment,
} from "../src/lib/resend-booking-email-core.ts";

const input = {
  paymentId: "pay_123",
  to: "guest@example.com",
  message: { subject: "Confirmed", html: "<p>Confirmed</p>", text: "Confirmed" },
};

const environment = {
  RESEND_API_KEY: "re_test_key",
  BOOKING_EMAIL_FROM: "MidEarth Travel <bookings@midearth.ca>",
  BOOKING_EMAIL_REPLY_TO: "travel@midearth.ca",
};

test("requires server-side Resend configuration", () => {
  assert.throws(() => getResendBookingEmailConfig({}), /RESEND_API_KEY/);
  assert.throws(() => getResendBookingEmailConfig({ RESEND_API_KEY: "re_test" }), /BOOKING_EMAIL_FROM/);
});

test("rejects obvious configuration placeholders", () => {
  assert.throws(
    () =>
      getResendBookingEmailConfig({
        RESEND_API_KEY: "re_replace_me",
        BOOKING_EMAIL_FROM: "MidEarth Travel <bookings@midearth.ca>",
      }),
    /RESEND_API_KEY/,
  );
  assert.throws(
    () =>
      getResendBookingEmailConfig({
        RESEND_API_KEY: "re_test_key",
        BOOKING_EMAIL_FROM: "MidEarth Travel <bookings@replace_with_verified_domain>",
      }),
    /BOOKING_EMAIL_FROM/,
  );
});

test("rejects an explicitly empty or placeholder reply-to value", () => {
  for (const replyTo of ["", "   ", "replace_me@example.com"]) {
    assert.throws(
      () => getResendBookingEmailConfig({ ...environment, BOOKING_EMAIL_REPLY_TO: replyTo }),
      /BOOKING_EMAIL_REPLY_TO/,
    );
  }
});

test("rejects malformed or placeholder sender addresses", () => {
  assert.throws(
    () =>
      getResendBookingEmailConfig({
        RESEND_API_KEY: "re_test_key",
        BOOKING_EMAIL_FROM: "MidEarth Travel <bookings@midearth.ca",
      }),
    /BOOKING_EMAIL_FROM/,
  );
  assert.throws(
    () =>
      getResendBookingEmailConfig({
        RESEND_API_KEY: "re_test_key",
        BOOKING_EMAIL_FROM: "bookings@replace_me.example",
      }),
    /BOOKING_EMAIL_FROM/,
  );
});

test("sends both formats with a stable payment idempotency key", async () => {
  let request: Request | undefined;
  const fetchImplementation = async (input: string | URL | Request, init?: RequestInit) => {
    request = new Request(input, init);
    return Response.json({ id: "email_123" });
  };

  const result = await sendBookingEmailWithEnvironment(input, environment, fetchImplementation);

  assert.equal(result.id, "email_123");
  assert.equal(request?.url, "https://api.resend.com/emails");
  assert.equal(request?.method, "POST");
  assert.equal(request?.headers.get("Content-Type"), "application/json");
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
});

test("sanitizes non-success provider errors", async () => {
  const providerBody = "provider secret details re_test_key";
  const fetchImplementation = async () => new Response(providerBody, { status: 422 });

  await assert.rejects(
    () => sendBookingEmailWithEnvironment(input, environment, fetchImplementation),
    (error: unknown) => {
      assert.equal((error as Error).message, "Resend booking email failed (422)");
      assert.doesNotMatch((error as Error).message, /provider secret|re_test_key/);
      return true;
    },
  );
});

test("rejects a successful response without a usable email id", async () => {
  const fetchImplementation = async () => Response.json({ ok: true });

  await assert.rejects(
    () => sendBookingEmailWithEnvironment(input, environment, fetchImplementation),
    /invalid response/,
  );
});

test("omits reply-to when it is not configured", async () => {
  let request: Request | undefined;
  const fetchImplementation = async (input: string | URL | Request, init?: RequestInit) => {
    request = new Request(input, init);
    return Response.json({ id: "email_456" });
  };

  await sendBookingEmailWithEnvironment(
    input,
    { RESEND_API_KEY: "re_test_key", BOOKING_EMAIL_FROM: "bookings@midearth.ca" },
    fetchImplementation,
  );

  const payload = await request?.json();
  assert.deepEqual(payload, {
    from: "bookings@midearth.ca",
    to: ["guest@example.com"],
    subject: "Confirmed",
    html: "<p>Confirmed</p>",
    text: "Confirmed",
  });
});

test("validates recipient and configured reply-to addresses", async () => {
  await assert.rejects(
    () => sendBookingEmailWithEnvironment({ ...input, to: "not-an-email" }, environment, async () => Response.json({ id: "email_123" })),
    /recipient/i,
  );
  await assert.rejects(
    () =>
      sendBookingEmailWithEnvironment(
        input,
        { ...environment, BOOKING_EMAIL_REPLY_TO: "not-an-email" },
        async () => Response.json({ id: "email_123" }),
      ),
    /reply.?to/i,
  );
});
