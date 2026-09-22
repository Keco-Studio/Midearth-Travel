import assert from "node:assert/strict";
import test from "node:test";
import { getBookingMailto, type Tour } from "../src/data/tours.ts";
import {
  auditTourContent,
  getTourPublicHref,
  isTourDetailReady,
} from "../src/lib/tour-content-audit.ts";

const contactHref = "mailto:travel@example.com";

const tour: Tour = {
  slug: "northern-lights",
  code: "NL01",
  title: "Northern Lights & Ice Hotel",
  region: "Canada",
  duration: "4 days",
  description: "Winter nights under the aurora.",
  image: "/northern-lights.jpg",
  tags: ["Aurora"],
  tourType: "Group Tour",
};

test("reports image-backed tours missing a customer-ready description", () => {
  assert.deepEqual(
    auditTourContent(
      [{ ...tour, description: "", itinerary: [], image: "/tour.jpg" }],
      contactHref,
    ),
    [
      {
        slug: tour.slug,
        title: tour.title,
        image: "/tour.jpg",
        missing: ["descriptionOrItinerary"],
      },
    ],
  );
});

test("encodes title, code, and page URL in a booking email", () => {
  const mailto = getBookingMailto(
    tour,
    "travel@example.com",
    "https://site.test/tours/northern-lights",
  );

  assert.match(mailto, /^mailto:travel@example\.com\?/);
  assert.match(mailto, /subject=Booking%20request/);
  assert.match(mailto, /body=/);

  const url = new URL(mailto);
  assert.equal(url.searchParams.get("subject"), "Booking request - Northern Lights & Ice Hotel (NL01)");
  assert.equal(
    url.searchParams.get("body"),
    "Booking request\nTour: Northern Lights & Ice Hotel\nCode: NL01\nPage: https://site.test/tours/northern-lights",
  );
});

test("keeps content-ready tours on their detail route and routes incomplete tours to contact", () => {
  assert.equal(isTourDetailReady(tour, contactHref), true);
  assert.equal(
    getTourPublicHref(tour, contactHref),
    "/tours/northern-lights",
  );

  const incomplete = { ...tour, duration: "" };
  assert.equal(isTourDetailReady(incomplete, contactHref), false);
  assert.match(
    getTourPublicHref(incomplete, contactHref, "https://site.test/tours/northern-lights"),
    /^mailto:travel@example\.com\?subject=/,
  );
});
