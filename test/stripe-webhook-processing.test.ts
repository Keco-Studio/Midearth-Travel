import assert from "node:assert/strict";
import test from "node:test";
import type Stripe from "stripe";
import {
  processVerifiedStripeEvent,
  type StripeWebhookProcessingDependencies,
} from "../src/lib/stripe-webhook-processing.ts";
import { deliverPaidBookingConfirmation } from "../src/lib/booking-confirmation-delivery.ts";
import { loadPublishedToursStrictWithRequest } from "../src/lib/published-content-loaders.ts";
import type { PaymentOrderDeliveryRecord } from "../src/lib/supabase-payments.ts";
import type { BookingConfirmationTour } from "../src/lib/booking-confirmation-delivery.ts";
import type { BookingRecord, HomeModuleRecord } from "../src/types/cms.ts";

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

const booking: BookingRecord = {
  id: "booking_123",
  reference: "TB-2026-ABC12345",
  status: "new",
  source: "tour_email",
  tourSlug: "maple-leaves",
  customerName: "Ada Lovelace",
  customerEmail: "booking@example.com",
  locale: "en",
  adults: 2,
  children: 0,
  departureSelection: "October 12",
  createdAt: "2026-11-05T09:00:00.000Z",
  updatedAt: "2026-11-05T09:00:00.000Z",
};

const tour: BookingConfirmationTour = {
  slug: "maple-leaves",
  code: "CA08",
  title: "Maple Leaves",
  localizedTitle: "Maple Leaves",
  duration: "8 days",
  localizedDuration: "8 days",
  departureCity: "Ottawa",
  localizedDepartureCity: "Ottawa",
  essentials: { meetingPlace: "MidEarth office", localizedMeetingPlace: "MidEarth office" },
};

const bookingPage: HomeModuleRecord = {
  id: "bookingPage",
  index: 10,
  name: "Booking Page",
  description: "Booking copy",
  status: "published",
  publishedVersion: 1,
  draftVersion: null,
  updatedAt: "2026-11-05T09:00:00.000Z",
  fields: [],
  data: {
    confirmationEmailSubjectEn: "Payment confirmed",
    confirmationEmailHeadingEn: "Your trip is confirmed",
    confirmationEmailBodyEn: "Thanks for booking.",
    confirmationEmailClosingEn: "See you soon.",
    confirmationEmailSubjectZh: "Payment confirmed",
    confirmationEmailHeadingZh: "Your trip is confirmed",
    confirmationEmailBodyZh: "Thanks for booking.",
    confirmationEmailClosingZh: "See you soon.",
  },
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

test("does not resend after delivery succeeds but event recording fails", async () => {
  let storedPayment = payment;
  let sends = 0;
  let recordAttempts = 0;
  let eventRecorded = false;
  const recordFailure = new Error("event store unavailable");
  const dependencies = createDependencies({
    hasWebhookEvent: async () => eventRecorded,
    updatePaymentOrderFromStripe: async () => storedPayment,
    deliverPaidBookingConfirmation: (received, siteOrigin) =>
      deliverPaidBookingConfirmation(received, siteOrigin, {
        loadBookingById: async () => booking,
        loadPublishedTours: async () => [tour],
        loadPublishedHomeModules: async () => [bookingPage],
        sendBookingEmail: async () => {
          sends += 1;
          return { id: "email_123" };
        },
        markConfirmationEmailSent: async (_paymentId, emailId) => {
          storedPayment = {
            ...storedPayment,
            confirmationEmailSentAt: "2026-11-05T12:00:00.000Z",
            confirmationEmailId: emailId,
          };
        },
        recordConfirmationEmailError: async () => undefined,
      }),
    recordWebhookEvent: async () => {
      recordAttempts += 1;
      if (recordAttempts === 1) throw recordFailure;
      eventRecorded = true;
      return true;
    },
  });

  const firstFailure = await captureRejection(() => processVerifiedStripeEvent(
    checkoutEvent("checkout.session.completed"),
    "https://midearth.ca",
    dependencies,
  ));
  assert.equal(firstFailure, recordFailure);
  assert.equal(sends, 1);

  await processVerifiedStripeEvent(
    checkoutEvent("checkout.session.completed"),
    "https://midearth.ca",
    dependencies,
  );

  assert.equal(sends, 1);
  assert.equal(recordAttempts, 2);
  assert.equal(eventRecorded, true);
});

test("records unrelated Stripe events without updating payment or delivering", async () => {
  const calls: string[] = [];
  const event = {
    id: "evt_customer",
    type: "customer.created",
    data: { object: { id: "cus_123", object: "customer" } },
  } as Stripe.Event;

  await processVerifiedStripeEvent(
    event,
    "https://midearth.ca",
    createDependencies({
      updatePaymentOrderFromStripe: async () => {
        assert.fail("unrelated event must not update payment");
      },
      deliverPaidBookingConfirmation: async () => {
        assert.fail("unrelated event must not deliver email");
      },
      recordWebhookEvent: async (eventId, eventType, payload) => {
        calls.push(`${eventId}:${eventType}:${payload.objectId}`);
        return true;
      },
    }),
  );

  assert.deepEqual(calls, ["evt_customer:customer.created:cus_123"]);
});

test("propagated content load failure records a safe error without sending or recording the event", async () => {
  const failure = new Error(`raw database response\n${"x".repeat(600)}`);
  let sent = false;
  let eventRecorded = false;
  let deliveryError = "";

  const caught = await captureRejection(() => processVerifiedStripeEvent(
    checkoutEvent("checkout.session.completed"),
    "https://midearth.ca",
    createDependencies({
      deliverPaidBookingConfirmation: (received, siteOrigin) =>
        deliverPaidBookingConfirmation(received, siteOrigin, {
          loadBookingById: async () => booking,
          loadPublishedTours: () => loadPublishedToursStrictWithRequest(async () => {
            throw failure;
          }),
          loadPublishedHomeModules: async () => [],
          sendBookingEmail: async () => {
            sent = true;
            return { id: "unexpected" };
          },
          markConfirmationEmailSent: async () => undefined,
          recordConfirmationEmailError: async (_paymentId, message) => {
            deliveryError = message;
          },
        }),
      recordWebhookEvent: async () => {
        eventRecorded = true;
        return true;
      },
    }),
  ));

  assert.equal((caught as Error).cause, failure);
  assert.equal(sent, false);
  assert.equal(eventRecorded, false);
  assert.equal(deliveryError, "Unable to load published tours");
  assert.doesNotMatch(deliveryError, /[\r\n\t]/);
  assert.doesNotMatch(deliveryError, /raw database response/);
});
