import assert from "node:assert/strict";
import test from "node:test";
import { getBookingMailto, type Tour } from "../src/data/tours.ts";
import {
  auditTourContent,
  getConfiguredContactHref,
  getTourIntroDescription,
  getTourPublicHref,
  isTourDetailReady,
} from "../src/lib/tour-content-audit.ts";
import { resolveExploreByMonthEntries } from "../src/lib/explore-by-month.ts";
import { siteSettingsSeed } from "../src/data/site-settings.ts";

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

test("treats either rendered language description as customer-ready", () => {
  const localizedOnly = {
    ...tour,
    description: "",
    localizedDescription: "极光之旅简介",
  };

  assert.equal(isTourDetailReady(localizedOnly, contactHref), true);
  assert.equal(getTourIntroDescription(localizedOnly, "zh"), "极光之旅简介");
  assert.equal(getTourIntroDescription(localizedOnly, "en"), "");
  assert.deepEqual(auditTourContent([localizedOnly], contactHref), []);
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

test("uses a configured email when valid and the configured telephone when it is not", () => {
  assert.equal(
    getConfiguredContactHref("mailto:travel@example.com", "tel:+16135550123"),
    "mailto:travel@example.com",
  );
  assert.equal(
    getConfiguredContactHref("mailto:not-an-email", "tel:+16135550123"),
    "tel:+16135550123",
  );
  assert.equal(
    getTourPublicHref({ ...tour, duration: "" }, "tel:+16135550123"),
    "tel:+16135550123",
  );
  assert.equal(
    getConfiguredContactHref("mailto:", "tel:"),
    siteSettingsSeed.emailHref,
  );
  assert.notEqual(
    getTourPublicHref({ ...tour, duration: "" }, "tel:"),
    "tel:",
  );
});

test("routes linked month tours through contact fallback without changing non-tour destinations", () => {
  const entries = resolveExploreByMonthEntries(
    [
      {
        month: "Jan",
        label: "January",
        destinations: [
          {
            id: "tour",
            tourSlug: tour.slug,
            name: "",
            region: "",
            tag: "",
            desc: "Winter departure",
            image: "",
            href: "",
          },
          {
            id: "route",
            name: "Beach escape",
            region: "Asia",
            tag: "Beach",
            desc: "Independent route destination",
            image: "/beach.jpg",
            href: "/routes/asia",
          },
        ],
      },
    ],
    [{ ...tour, description: "", itinerary: [] }],
    "tel:+16135550123",
  );

  assert.equal(entries[0]?.destinations[0]?.href, "tel:+16135550123");
  assert.equal(entries[0]?.destinations[1]?.href, "/routes/asia");
});

test("omits unpublished month tour references instead of reviving static tour links", () => {
  const entries = resolveExploreByMonthEntries(
    [
      {
        month: "Feb",
        label: "February",
        destinations: [
          {
            id: "unpublished",
            tourSlug: "highlights-of-japan",
            name: "Old static title",
            region: "Asia",
            tag: "Culture",
            desc: "Old static description",
            image: "/old.jpg",
            href: "/tours/highlights-of-japan",
          },
          {
            id: "route",
            name: "Asia inspiration",
            region: "Asia",
            tag: "Region",
            desc: "Explicit non-tour destination",
            image: "/asia.jpg",
            href: "/routes/asia",
          },
        ],
      },
    ],
    [],
    contactHref,
  );

  assert.deepEqual(
    entries[0]?.destinations.map((destination) => destination.id),
    ["route"],
  );
  assert.equal(entries[0]?.destinations[0]?.href, "/routes/asia");
});
