import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import * as paymentDomain from "../src/lib/payment-domain.ts";

type TourBookingValidator = (value: unknown) => {
  tourSlug: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  departureDate: string;
  adults: number;
  children: number;
  notes: string;
};

test("validates the details collected before an online tour payment", () => {
  const validateTourBookingInput = (
    paymentDomain as typeof paymentDomain & {
      validateTourBookingInput?: TourBookingValidator;
    }
  ).validateTourBookingInput;

  assert.equal(typeof validateTourBookingInput, "function");
  if (!validateTourBookingInput) return;

  assert.deepEqual(
    validateTourBookingInput({
      tourSlug: " maple-leaves ",
      customerName: " Ada Lovelace ",
      customerEmail: " ada@example.com ",
      customerPhone: " 613-555-0123 ",
      departureDate: "2026-10-12",
      adults: "2",
      children: "1",
      notes: " Window seats, please. ",
    }),
    {
      tourSlug: "maple-leaves",
      customerName: "Ada Lovelace",
      customerEmail: "ada@example.com",
      customerPhone: "613-555-0123",
      departureDate: "2026-10-12",
      adults: 2,
      children: 1,
      notes: "Window seats, please.",
    },
  );

  assert.throws(
    () =>
      validateTourBookingInput({
        tourSlug: "maple-leaves",
        customerName: "Ada",
        customerEmail: "ada@example.com",
        customerPhone: "613-555-0123",
        departureDate: "2026-10-12",
        adults: "0",
        children: "-1",
      }),
    /at least one adult/i,
  );
});

test("loads published CMS copy and the resolved page background for tour booking", () => {
  const route = readFileSync(
    new URL("../src/app/tours/[slug]/book/page.tsx", import.meta.url),
    "utf8",
  );
  const component = readFileSync(
    new URL("../src/components/tour/tour-booking-page.tsx", import.meta.url),
    "utf8",
  );

  assert.match(route, /loadPublishedHomeModules/);
  assert.match(route, /getHomeModule\(modules, "bookingPage"\)/);
  assert.match(route, /getPageBackgroundImage/);
  assert.match(component, /getLocalizedContent/);
  assert.match(component, /content: ContentData/);
  assert.match(component, /backgroundImage/);
});

test("returns Stripe checkout to the booked tour detail page", () => {
  const route = readFileSync(
    new URL("../src/app/api/checkout/route.ts", import.meta.url),
    "utf8",
  );

  assert.match(
    route,
    /success_url:\s*`\$\{siteUrl\}\/tours\/\$\{encodeURIComponent\(tour\.slug\)\}\?payment=success&session_id=\{CHECKOUT_SESSION_ID\}`/,
  );
  assert.match(
    route,
    /cancel_url:\s*`\$\{siteUrl\}\/tours\/\$\{encodeURIComponent\(tour\.slug\)\}\?payment=cancelled&payment_id=/,
  );
});
