import type { Tour } from "../data/tours.ts";
import type { SendBookingEmailInput } from "./resend-booking-email-core.ts";
import type { PaymentOrderDeliveryRecord } from "./supabase-payments.ts";
import type { BookingRecord, HomeModuleRecord } from "../types/cms.ts";
import { renderBookingConfirmationEmail } from "./booking-confirmation-template.ts";
import { getLocalizedTourValue } from "./localized-content.ts";
import type { BookingLocale } from "./payment-domain.ts";

export type BookingConfirmationDependencies = {
  loadBookingById: (id: string) => Promise<BookingRecord | null>;
  loadPublishedTours: () => Promise<Tour[]>;
  loadPublishedHomeModules: () => Promise<HomeModuleRecord[]>;
  sendBookingEmail: (input: SendBookingEmailInput) => Promise<{ id: string }>;
  markConfirmationEmailSent: (paymentId: string, emailId: string) => Promise<void>;
  recordConfirmationEmailError: (paymentId: string, message: string) => Promise<void>;
};

function getBookingLocale(value: BookingRecord["locale"]): BookingLocale {
  if (value === undefined) return "en";
  if (value === "en" || value === "zh") return value;
  throw new Error("Booking has an invalid locale");
}

function requirePartyCount(
  value: number | undefined,
  label: "adult" | "child",
): number {
  const minimum = label === "adult" ? 1 : 0;
  if (!Number.isInteger(value) || value === undefined || value < minimum) {
    throw new Error(`Booking ${label} count is missing or invalid`);
  }
  return value;
}

function requireText(value: string | undefined, label: string): string {
  const normalized = value?.trim();
  if (!normalized) throw new Error(`Booking ${label} is missing`);
  return normalized;
}

function getSafeErrorMessage(error: unknown): string {
  const message = error instanceof Error && error.message.trim()
    ? error.message
    : "Booking confirmation delivery failed";
  return message.replace(/[\r\n\t]+/g, " ").slice(0, 500);
}

export async function deliverPaidBookingConfirmation(
  payment: PaymentOrderDeliveryRecord,
  siteUrl: string,
  dependencies: BookingConfirmationDependencies,
): Promise<void> {
  if (payment.confirmationEmailSentAt !== null) return;

  try {
    if (payment.status !== "paid") {
      throw new Error(`Payment is not paid: ${payment.id}`);
    }
    if (!payment.bookingId) {
      throw new Error(`Payment has no booking id: ${payment.id}`);
    }

    const [booking, tours, modules] = await Promise.all([
      dependencies.loadBookingById(payment.bookingId),
      dependencies.loadPublishedTours(),
      dependencies.loadPublishedHomeModules(),
    ]);
    if (!booking) throw new Error(`Booking not found: ${payment.bookingId}`);

    const tour = tours.find((entry) => entry.slug === payment.tourSlug);
    if (!tour) throw new Error(`Published tour not found: ${payment.tourSlug}`);

    const bookingPage = modules.find((entry) => entry.id === "bookingPage");
    if (!bookingPage) throw new Error("Published Booking Page content not found");

    const locale = getBookingLocale(booking.locale);
    const adults = requirePartyCount(booking.adults, "adult");
    const children = requirePartyCount(booking.children, "child");
    const departureSelection = requireText(
      booking.departureSelection,
      "departure selection",
    );
    const recipient = requireText(booking.customerEmail, "customer email");
    const message = renderBookingConfirmationEmail({
      locale,
      content: bookingPage.data,
      customerName: booking.customerName,
      bookingReference: booking.reference,
      tourTitle: getLocalizedTourValue(locale, tour.localizedTitle, tour.title),
      tourCode: tour.code,
      departureSelection,
      adults,
      children,
      duration: getLocalizedTourValue(locale, tour.localizedDuration, tour.duration),
      departureCity: tour.departureCity
        ? getLocalizedTourValue(locale, tour.localizedDepartureCity, tour.departureCity)
        : undefined,
      meetingPlace: tour.essentials?.meetingPlace
        ? getLocalizedTourValue(
          locale,
          tour.essentials.localizedMeetingPlace,
          tour.essentials.meetingPlace,
        )
        : undefined,
      amountCents: payment.amountCents,
      currency: payment.currency,
      tourUrl: new URL(
        `/tours/${encodeURIComponent(tour.slug)}`,
        siteUrl,
      ).toString(),
    });
    const result = await dependencies.sendBookingEmail({
      paymentId: payment.id,
      to: recipient,
      message,
    });
    await dependencies.markConfirmationEmailSent(payment.id, result.id);
  } catch (error) {
    try {
      await dependencies.recordConfirmationEmailError(
        payment.id,
        getSafeErrorMessage(error),
      );
    } catch {
      // Preserve the delivery failure so Stripe can retry the original operation.
    }
    throw error;
  }
}
