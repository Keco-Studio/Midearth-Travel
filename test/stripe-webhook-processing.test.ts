import assert from "node:assert/strict";
import test from "node:test";
import type Stripe from "stripe";
import {
  processVerifiedStripeEvent,
  type StripeWebhookProcessingDependencies,
} from "../src/lib/stripe-webhook-processing.ts";
import type { PaymentOrderDeliveryRecord } from "../src/lib/supabase-payments.ts";

const payment: PaymentOrderDeliveryRecord = {
  id: "pay_123",
  reference: "PAY-2026-123",
  bookingId: "booking_123",
  tourSlug: "maple-leaves",
  customerEmail: "payment@example.com",
  amountCents: 259900,
  currency: "cad",
  status: "paid",
  confirmationEmailSentAt: null,
  confirmationEmailId: null,
  confirmationEmailError: null,
};

function checkoutEvent(
  type: Stripe.Event.Type,
  paymentStatus: Stripe.Checkout.Session.PaymentStatus = "paid",
): Stripe.Event {
  return {
    id: "evt_123",
    type,
    data: {
      object: {
        id: "cs_123",
        object: "checkout.session",
        payment_intent: "pi_123",
        payment_status: paymentStatus,
      },
    },
  } as Stripe.Event;
}

function createDependencies(
  overrides: Partial<StripeWebhookProcessingDependencies> = {},
): StripeWebhookProcessingDependencies {
  return {
    hasWebhookEvent: async () => false,
    updatePaymentOrderFromStripe: async () => payment,
    deliverPaidBookingConfirmation: async () => undefined,
    recordWebhookEvent: async () => true,
    ...overrides,
  };
}

async function captureRejection(operation: () => Promise<void>): Promise<unknown> {
  try {
    await operation();
  } catch (error) {
    return error;
  }
  assert.fail("Expected operation to reject");
}

test("updates payment, delivers confirmation, then records a paid event", async () => {
  const calls: string[] = [];
  await processVerifiedStripeEvent(
    checkoutEvent("checkout.session.completed"),
    "https://midearth.ca",
    createDependencies({
      updatePaymentOrderFromStripe: async (input) => {
        calls.push(`update:${input.status}:${input.sessionId}:${input.paymentIntentId}`);
        return payment;
      },
      deliverPaidBookingConfirmation: async (received, siteOrigin) => {
        assert.equal(received, payment);
        calls.push(`deliver:${siteOrigin}`);
      },
      recordWebhookEvent: async (eventId, eventType, payload) => {
        assert.deepEqual(payload, { objectId: "cs_123" });
        calls.push(`record:${eventId}:${eventType}`);
        return true;
      },
    }),
  );

  assert.deepEqual(calls, [
    "update:paid:cs_123:pi_123",
    "deliver:https://midearth.ca",
    "record:evt_123:checkout.session.completed",
  ]);
});

test("returns immediately for a previously recorded Stripe event", async () => {
  const unexpected = async (): Promise<never> => {
    throw new Error("dependency should not run");
  };
  await processVerifiedStripeEvent(
    checkoutEvent("checkout.session.completed"),
    "https://midearth.ca",
    {
      hasWebhookEvent: async () => true,
      updatePaymentOrderFromStripe: unexpected,
      deliverPaidBookingConfirmation: unexpected,
      recordWebhookEvent: unexpected,
    },
  );
});

test("records but does not update or deliver a completed unpaid session", async () => {
  const calls: string[] = [];
  await processVerifiedStripeEvent(
    checkoutEvent("checkout.session.completed", "unpaid"),
    "https://midearth.ca",
    createDependencies({
      updatePaymentOrderFromStripe: async () => {
        assert.fail("unpaid session must not update payment");
      },
      deliverPaidBookingConfirmation: async () => {
        assert.fail("unpaid session must not deliver email");
      },
      recordWebhookEvent: async () => {
        calls.push("record");
        return true;
      },
    }),
  );
  assert.deepEqual(calls, ["record"]);
});

test("updates failed and expired sessions without delivering confirmation", async (t) => {
  for (const eventType of [
    "checkout.session.async_payment_failed",
    "checkout.session.expired",
  ] as const) {
    await t.test(eventType, async () => {
      const calls: string[] = [];
      await processVerifiedStripeEvent(
        checkoutEvent(eventType, "unpaid"),
        "https://midearth.ca",
        createDependencies({
          updatePaymentOrderFromStripe: async (input) => {
            calls.push(`update:${input.status}`);
            return { ...payment, status: "failed" };
          },
          deliverPaidBookingConfirmation: async () => {
            assert.fail("failed session must not deliver email");
          },
          recordWebhookEvent: async () => {
            calls.push("record");
            return true;
          },
        }),
      );
      assert.deepEqual(calls, ["update:failed", "record"]);
    });
  }
});

test("fails a paid event with no matching payment before recording it", async () => {
  let recorded = false;
  await assert.rejects(
    () => processVerifiedStripeEvent(
      checkoutEvent("checkout.session.completed"),
      "https://midearth.ca",
      createDependencies({
        updatePaymentOrderFromStripe: async () => null,
        recordWebhookEvent: async () => {
          recorded = true;
          return true;
        },
      }),
    ),
    /Payment order not found.*cs_123/,
  );
  assert.equal(recorded, false);
});

test("leaves the event unrecorded when delivery fails so Stripe can retry", async () => {
  const failure = new Error("Resend unavailable");
  let recorded = false;
  const caught = await captureRejection(() => processVerifiedStripeEvent(
    checkoutEvent("checkout.session.completed"),
    "https://midearth.ca",
    createDependencies({
      deliverPaidBookingConfirmation: async () => {
        throw failure;
      },
      recordWebhookEvent: async () => {
        recorded = true;
        return true;
      },
    }),
  ));
  assert.equal(caught, failure);
  assert.equal(recorded, false);
});
