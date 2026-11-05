import type { BookingLocale } from "@/lib/payment-domain";

export type TourBookingFormValues = {
  departureDate: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  adults: string;
  children: string;
  notes: string;
};

export function buildTourBookingRequest(
  form: TourBookingFormValues,
  tourSlug: string,
  locale: BookingLocale,
) {
  return { ...form, tourSlug, locale };
}
