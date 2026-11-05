import assert from "node:assert/strict";
import test from "node:test";
import {
  deliverPaidBookingConfirmation,
  type BookingConfirmationDependencies,
} from "../src/lib/booking-confirmation-delivery.ts";
import type { BookingConfirmationTour } from "../src/lib/booking-confirmation-delivery.ts";
import type { PaymentOrderDeliveryRecord } from "../src/lib/supabase-payments.ts";
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
  locale: "zh",
  adults: 2,
  children: 1,
  departureSelection: "2026年10月12日",
  createdAt: "2026-11-05T09:00:00.000Z",
  updatedAt: "2026-11-05T09:00:00.000Z",
};

const tour: BookingConfirmationTour = {
  slug: "maple-leaves",
  code: "CA08",
  title: "Maple Leaves",
  localizedTitle: "枫叶之旅",
  duration: "8 days / 7 nights",
  localizedDuration: "8天7晚",
  departureCity: "Ottawa",
  localizedDepartureCity: "渥太华",
  essentials: {
    meetingPlace: "MidEarth office",
    localizedMeetingPlace: "中环旅游办公室",
  },
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
    confirmationEmailHeadingEn: "Your trip is confirmed!",
    confirmationEmailBodyEn: "Thanks for booking.",
    confirmationEmailClosingEn: "See you soon.",
    confirmationEmailSubjectZh: "付款已确认",
    confirmationEmailHeadingZh: "行程已确认！",
    confirmationEmailBodyZh: "感谢您的预订。",
    confirmationEmailClosingZh: "旅途愉快。",
  },
};

function createDependencies(
  overrides: Partial<BookingConfirmationDependencies> = {},
): BookingConfirmationDependencies {
  return {
    loadBookingById: async () => booking,
    loadPublishedTours: async () => [tour],
    loadPublishedHomeModules: async () => [bookingPage],
    sendBookingEmail: async () => ({ id: "email_123" }),
    markConfirmationEmailSent: async () => undefined,
    recordConfirmationEmailError: async () => undefined,
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

test("renders, sends, and records one localized paid confirmation", async () => {
  const calls: string[] = [];
  let sentInput: Parameters<BookingConfirmationDependencies["sendBookingEmail"]>[0] | undefined;

  await deliverPaidBookingConfirmation(
    payment,
    "https://midearth.ca/admin/ignored",
    createDependencies({
      sendBookingEmail: async (input) => {
        calls.push("send");
        sentInput = input;
        return { id: "email_123" };
      },
      markConfirmationEmailSent: async (paymentId, emailId) => {
        calls.push(`mark:${paymentId}:${emailId}`);
      },
      recordConfirmationEmailError: async () => {
        assert.fail("error recorder should not run");
      },
    }),
  );

  assert.deepEqual(calls, ["send", "mark:pay_123:email_123"]);
  assert.equal(sentInput?.paymentId, "pay_123");
  assert.equal(sentInput?.to, "booking@example.com");
  assert.equal(sentInput?.message.subject, "付款已确认");
  assert.match(sentInput?.message.text ?? "", /TB-2026-ABC12345/);
  assert.doesNotMatch(sentInput?.message.text ?? "", /PAY-2026-123/);
  assert.match(sentInput?.message.text ?? "", /枫叶之旅/);
  assert.match(sentInput?.message.text ?? "", /8天7晚/);
  assert.match(sentInput?.message.text ?? "", /渥太华/);
  assert.match(sentInput?.message.text ?? "", /中环旅游办公室/);
  assert.match(sentInput?.message.text ?? "", /https:\/\/midearth\.ca\/tours\/maple-leaves/);
});

test("defaults a historical booking without locale to English", async () => {
  let subject = "";
  await deliverPaidBookingConfirmation(
    payment,
    "https://midearth.ca",
    createDependencies({
      loadBookingById: async () => ({ ...booking, locale: undefined }),
      sendBookingEmail: async (input) => {
        subject = input.message.subject;
        return { id: "email_123" };
      },
    }),
  );
  assert.equal(subject, "Payment confirmed");
});

test("uses published Booking Page data while a newer draft exists", async () => {
  let sends = 0;
  await deliverPaidBookingConfirmation(
    payment,
    "https://midearth.ca",
    createDependencies({
      loadPublishedHomeModules: async () => [{ ...bookingPage, status: "draft" }],
      sendBookingEmail: async () => {
        sends += 1;
        return { id: "email_123" };
      },
    }),
  );
  assert.equal(sends, 1);
});

test("loads only the tour selected by the paid booking", async () => {
  let requestedSlug: string | undefined;
  await deliverPaidBookingConfirmation(
    payment,
    "https://midearth.ca",
    createDependencies({
      loadPublishedTours: async (tourSlug) => {
        requestedSlug = tourSlug;
        return [tour];
      },
    }),
  );

  assert.equal(requestedSlug, "maple-leaves");
});

test("returns before loading data or recording an error when confirmation was sent", async () => {
  const unexpected = async (): Promise<never> => {
    throw new Error("dependency should not run");
  };
  await deliverPaidBookingConfirmation(
    { ...payment, confirmationEmailSentAt: "2026-11-05T12:00:00.000Z" },
    "https://midearth.ca",
    {
      loadBookingById: unexpected,
      loadPublishedTours: unexpected,
      loadPublishedHomeModules: unexpected,
      sendBookingEmail: unexpected,
      markConfirmationEmailSent: unexpected,
      recordConfirmationEmailError: unexpected,
    },
  );
});

test("records descriptive retryable errors for incomplete delivery data", async (t) => {
  const cases: Array<{
    name: string;
    payment?: PaymentOrderDeliveryRecord;
    overrides?: Partial<BookingConfirmationDependencies>;
    pattern: RegExp;
  }> = [
    { name: "non-paid payment", payment: { ...payment, status: "failed" }, pattern: /not paid/i },
    { name: "missing booking id", payment: { ...payment, bookingId: null }, pattern: /booking id/i },
    { name: "missing booking", overrides: { loadBookingById: async () => null }, pattern: /booking not found/i },
    { name: "missing tour", overrides: { loadPublishedTours: async () => [] }, pattern: /published tour not found/i },
    { name: "missing Booking Page CMS", overrides: { loadPublishedHomeModules: async () => [] }, pattern: /published booking page/i },
    { name: "missing adults", overrides: { loadBookingById: async () => ({ ...booking, adults: undefined }) }, pattern: /adult count/i },
    { name: "missing children", overrides: { loadBookingById: async () => ({ ...booking, children: undefined }) }, pattern: /child count/i },
    { name: "missing departure", overrides: { loadBookingById: async () => ({ ...booking, departureSelection: undefined }) }, pattern: /departure selection/i },
    { name: "missing booking recipient", overrides: { loadBookingById: async () => ({ ...booking, customerEmail: undefined }) }, pattern: /customer email/i },
  ];

  for (const entry of cases) {
    await t.test(entry.name, async () => {
      const recorded: string[] = [];
      const error = await captureRejection(() => deliverPaidBookingConfirmation(
        entry.payment ?? payment,
        "https://midearth.ca",
        createDependencies({
          ...entry.overrides,
          recordConfirmationEmailError: async (paymentId, message) => {
            assert.equal(paymentId, "pay_123");
            recorded.push(message);
          },
        }),
      ));
      assert.match(String((error as Error).message), entry.pattern);
      assert.equal(recorded.length, 1);
      assert.match(recorded[0], entry.pattern);
      assert.ok(recorded[0].length <= 500);
    });
  }
});

test("records a bounded error and rethrows the original delivery failure", async () => {
  const failure = new Error(`Resend booking email failed (503) ${"x".repeat(600)}`);
  let recorded = "";
  const caught = await captureRejection(() => deliverPaidBookingConfirmation(
    payment,
    "https://midearth.ca",
    createDependencies({
      sendBookingEmail: async () => {
        throw failure;
      },
      recordConfirmationEmailError: async (_paymentId, message) => {
        recorded = message;
      },
    }),
  ));

  assert.equal(caught, failure);
  assert.equal(recorded.length, 500);
  assert.match(recorded, /^Resend booking email failed \(503\)/);
});

test("does not mask a delivery failure when recording its error also fails", async () => {
  const failure = new Error("Unable to mark confirmation email sent");
  const caught = await captureRejection(() => deliverPaidBookingConfirmation(
    payment,
    "https://midearth.ca",
    createDependencies({
      markConfirmationEmailSent: async () => {
        throw failure;
      },
      recordConfirmationEmailError: async () => {
        throw new Error("error persistence unavailable");
      },
    }),
  ));
  assert.equal(caught, failure);
});

test("records load and render failures before rethrowing them", async (t) => {
  const loadFailure = new Error("Booking lookup unavailable");
  for (const entry of [
    {
      name: "load",
      overrides: { loadBookingById: async () => { throw loadFailure; } },
      expected: loadFailure,
    },
    {
      name: "render",
      payment: { ...payment, currency: "not-a-currency" },
      expectedType: RangeError,
    },
  ]) {
    await t.test(entry.name, async () => {
      let recorded = false;
      const caught = await captureRejection(() => deliverPaidBookingConfirmation(
        entry.payment ?? payment,
        "https://midearth.ca",
        createDependencies({
          ...entry.overrides,
          recordConfirmationEmailError: async () => { recorded = true; },
        }),
      ));
      assert.equal(recorded, true);
      if (entry.expected) assert.equal(caught, entry.expected);
      if (entry.expectedType) assert.ok(caught instanceof entry.expectedType);
    });
  }
});
