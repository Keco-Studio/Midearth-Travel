import test from "node:test";
import assert from "node:assert/strict";
import {
  getFareAmountInCents,
  getPaymentStatusForCheckoutEvent,
  normalizeCurrency,
  validateCheckoutInput,
} from "../src/lib/payment-domain.ts";

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
