import type Stripe from "stripe";

export type InternalPaymentStatus = "pending" | "paid" | "failed";

export type CheckoutInput = {
  tourSlug: string;
  fareLabel: string;
  paymentType: "deposit" | "balance" | "full";
  customerEmail: string;
  bookingId?: string;
};

export type TourBookingInput = {
  tourSlug: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  departureDate: string;
  adults: number;
  children: number;
  notes: string;
};

export function validateTourBookingInput(value: unknown): TourBookingInput {
  if (!value || typeof value !== "object") throw new Error("Request body is required");

  const input = value as Record<string, unknown>;
  const tourSlug = typeof input.tourSlug === "string" ? input.tourSlug.trim() : "";
  const customerName = typeof input.customerName === "string" ? input.customerName.trim() : "";
  const customerEmail = typeof input.customerEmail === "string" ? input.customerEmail.trim() : "";
  const customerPhone = typeof input.customerPhone === "string" ? input.customerPhone.trim() : "";
  const departureDate = typeof input.departureDate === "string" ? input.departureDate.trim() : "";
  const notes = typeof input.notes === "string" ? input.notes.trim() : "";
  const adults = Number(input.adults);
  const children = Number(input.children);

  if (!tourSlug || !customerName || !customerPhone || !departureDate || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
    throw new Error("Please complete all required booking details");
  }
  if (!Number.isInteger(adults) || adults < 1) {
    throw new Error("At least one adult is required");
  }
  if (!Number.isInteger(children) || children < 0) {
    throw new Error("Children must be zero or more");
  }

  return {
    tourSlug,
    customerName,
    customerEmail,
    customerPhone,
    departureDate,
    adults,
    children,
    notes,
  };
}

export function validateCheckoutInput(value: unknown): CheckoutInput {
  if (!value || typeof value !== "object") throw new Error("Request body is required");
  const input = value as Record<string, unknown>;
  const tourSlug = typeof input.tourSlug === "string" ? input.tourSlug.trim() : "";
  const fareLabel = typeof input.fareLabel === "string" ? input.fareLabel.trim() : "";
  const customerEmail = typeof input.customerEmail === "string" ? input.customerEmail.trim() : "";
  const paymentType = input.paymentType;
  if (!tourSlug || !fareLabel || !customerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
    throw new Error("Tour, fare, and a valid customer email are required");
  }
  if (paymentType !== "deposit" && paymentType !== "balance" && paymentType !== "full") {
    throw new Error("A valid payment type is required");
  }
  const result: CheckoutInput = {
    tourSlug,
    fareLabel,
    paymentType,
    customerEmail,
  };
  if (typeof input.bookingId === "string" && input.bookingId.trim()) result.bookingId = input.bookingId.trim();
  return result;
}

export function normalizeCurrency(currency: string): "cad" {
  if (currency.trim().toLowerCase() !== "cad") {
    throw new Error("Only CAD payments are supported");
  }
  return "cad";
}

export function getFareAmountInCents(price: string): number {
  const normalized = price.replace(/[$,\s]/g, "").trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) {
    throw new Error("A valid fare amount is required");
  }
  const amount = Math.round(Number(normalized) * 100);
  if (!Number.isSafeInteger(amount) || amount <= 0) {
    throw new Error("Fare amount must be greater than zero");
  }
  return amount;
}

export function getPaymentStatusForCheckoutEvent(
  eventType: Stripe.Event.Type | string,
): InternalPaymentStatus | null {
  if (eventType === "checkout.session.completed") return "paid";
  if (
    eventType === "checkout.session.async_payment_failed" ||
    eventType === "checkout.session.expired"
  ) {
    return "failed";
  }
  return null;
}
