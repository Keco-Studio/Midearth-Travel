import test from "node:test";
import assert from "node:assert/strict";
import {
  getFareAmountInCents,
  getPaymentStatusForCheckoutEvent,
  normalizeCurrency,
  validateCheckoutInput,
} from "../src/lib/payment-domain.ts";
import * as paymentDomain from "../src/lib/payment-domain.ts";

test("parses a CAD fare into cents and normalizes its currency", () => {
  assert.equal(getFareAmountInCents("$1,699"), 169900);
  assert.equal(normalizeCurrency("CAD"), "cad");
});

test("rejects malformed or non-positive fare values", () => {
  assert.throws(() => getFareAmountInCents("Call for quote"), /valid fare/i);
  assert.throws(() => getFareAmountInCents("$0"), /greater than zero/i);
});

test("maps Stripe Checkout outcomes to internal payment states", () => {
  assert.equal(getPaymentStatusForCheckoutEvent("checkout.session.completed"), "paid");
  assert.equal(getPaymentStatusForCheckoutEvent("checkout.session.async_payment_failed"), "failed");
  assert.equal(getPaymentStatusForCheckoutEvent("checkout.session.expired"), "failed");
  assert.equal(getPaymentStatusForCheckoutEvent("customer.created"), null);
});

test("validates checkout input without accepting arbitrary values", () => {
  assert.deepEqual(
    validateCheckoutInput({
      tourSlug: "tour",
      fareLabel: "Adult",
      paymentType: "full",
      customerEmail: "traveler@example.com",
    }),
    { tourSlug: "tour", fareLabel: "Adult", paymentType: "full", customerEmail: "traveler@example.com" },
  );
  assert.throws(() => validateCheckoutInput({ tourSlug: "tour", fareLabel: "Adult", paymentType: "full", customerEmail: "bad" }), /valid customer email/i);
});

test("uses the checkout request origin for Stripe return URLs", () => {
  const resolveCheckoutSiteUrl = (
    paymentDomain as typeof paymentDomain & {
      resolveCheckoutSiteUrl?: (requestUrl: string) => string;
    }
  ).resolveCheckoutSiteUrl;

  assert.equal(typeof resolveCheckoutSiteUrl, "function");
  if (!resolveCheckoutSiteUrl) return;

  assert.equal(
    resolveCheckoutSiteUrl("https://midearth-travel-zeta.vercel.app/api/checkout"),
    "https://midearth-travel-zeta.vercel.app",
  );
  assert.equal(
    resolveCheckoutSiteUrl("http://localhost:3000/api/checkout"),
    "http://localhost:3000",
  );
});

test("routes a completed Stripe checkout through the success page", () => {
  const createCheckoutReturnUrls = (
    paymentDomain as typeof paymentDomain & {
      createCheckoutReturnUrls?: (input: {
        requestUrl: string;
        tourSlug: string;
        paymentId: string;
      }) => { successUrl: string; cancelUrl: string };
    }
  ).createCheckoutReturnUrls;

  assert.equal(typeof createCheckoutReturnUrls, "function");
  if (!createCheckoutReturnUrls) return;

  assert.deepEqual(
    createCheckoutReturnUrls({
      requestUrl: "https://midearth-travel-zeta.vercel.app/api/checkout",
      tourSlug: "northern lights",
      paymentId: "pay_123",
    }),
    {
      successUrl:
        "https://midearth-travel-zeta.vercel.app/payment/success?tour=northern%20lights&session_id={CHECKOUT_SESSION_ID}",
      cancelUrl:
        "https://midearth-travel-zeta.vercel.app/tours/northern%20lights?payment=cancelled&payment_id=pay_123",
    },
  );
});

test("returns from the payment result to the original tour", () => {
  const getPaymentReturnHref = (
    paymentDomain as typeof paymentDomain & {
      getPaymentReturnHref?: (tourSlug: string | string[] | undefined) => string;
    }
  ).getPaymentReturnHref;

  assert.equal(typeof getPaymentReturnHref, "function");
  if (!getPaymentReturnHref) return;

  assert.equal(getPaymentReturnHref("northern lights"), "/tours/northern%20lights");
  assert.equal(getPaymentReturnHref(undefined), "/tours");
  assert.equal(getPaymentReturnHref(["tour-one", "tour-two"]), "/tours");
});
