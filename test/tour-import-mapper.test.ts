import assert from "node:assert/strict";
import test from "node:test";
import { mapTourRecordToPublicTour } from "../src/lib/tour-content.ts";
import {
  mapExcelRowToTourRecord,
  mapExcelRowsToTourRecords,
  resolveTourSlug,
  slugifyTourTitle,
} from "../src/lib/tour-import-mapper.ts";
import { parseItineraryFromRichText } from "../src/lib/tour-itinerary-parser.ts";

test("slugifyTourTitle converts titles to URL slugs", () => {
  assert.equal(slugifyTourTitle("Maritime Provinces & Gaspe"), "maritime-provinces-and-gaspe");
  assert.equal(slugifyTourTitle("A Taste of Cathay"), "a-taste-of-cathay");
});

test("resolveTourSlug keeps known product codes on existing slugs", () => {
  const used = new Set<string>();
  assert.equal(resolveTourSlug("NE07", "Maritime Provinces & Gaspe", used), "maritime-provinces-and-gaspe");
});

test("mapExcelRowToTourRecord maps workbook columns to TourRecord", () => {
  const used = new Set<string>();
  const record = mapExcelRowToTourRecord(
    {
      "code(required)": "AC02",
      "status（Option）": "published",
      "title(required)": "A Taste of Cathay",
      "image(required)": "https://example.com/tour.jpg",
      "region(required)": "Asia",
      "duration(required)": "8 days, 7 nights",
      "departureCity(required)": "Toronto",
      "departures(required)": "May 1, Jun 2",
      "highlights(required)": "Beijing, Shanghai",
      "description(required)":
        "<p><strong>Day 1: Canada - Beijing</strong><br />Flight to Beijing.</p>",
      "admissions(required)": "Included",
      "cancellation(required)": "30-day policy",
      "importantNotice(required)": "Prices subject to change",
      "INCLUDED(required)": "Hotels",
      "NOT INCLUDED(required)": "Insurance",
      "essentials.departureTime(required)": "8:00 AM",
      "essentials.meetingPlace(required)": "Airport",
      "essentials.hotels(required)": "4-star hotels",
      "essentials.escortedCoach(required)": "Coach included",
      "fares.quad(required)": "999",
      "fares.triple(required)": "0",
      "fares.double(required)": "1099",
      "fares.single(required)": "1299",
      "fares.child(required)": "799",
      "Our Top Picks(required)": true,
      "Sun Destinations(required)": false,
      "Bus Tours(required)": false,
      "vacationPackage(required)": true,
      "Explore by Month(required)": false,
    },
    used,
    "2026-09-01T00:00:00.000Z",
  );

  assert.ok(record);
  assert.equal(record?.code, "AC02");
  assert.equal(record?.slug, "a-taste-of-cathay");
  assert.equal(record?.tourType, "Group Tour");
  assert.equal(record?.fares.quad, "$999");
  assert.equal(record?.fares.triple, "");
  assert.equal(record?.specialOffer, true);
  assert.equal(record?.vacationPackage, true);
});

test("parseItineraryFromRichText extracts day-by-day content", () => {
  const itinerary = parseItineraryFromRichText(
    "<p><strong>Day 1: Toronto - Montreal</strong><br />Morning departure.</p><p><strong>Day 2: Montreal</strong><br />City tour.</p>",
  );

  assert.deepEqual(itinerary, [
    { day: 1, title: "Toronto - Montreal", description: "Morning departure." },
    { day: 2, title: "Montreal", description: "City tour." },
  ]);
});

test("mapTourRecordToPublicTour uses imported itinerary when static data is missing", () => {
  const record = mapExcelRowsToTourRecords([
    {
      "code(required)": "AC02",
      "title(required)": "A Taste of Cathay",
      "image(required)": "https://example.com/tour.jpg",
      "region(required)": "Asia",
      "duration(required)": "8 days, 7 nights",
      "departureCity(required)": "Toronto",
      "departures(required)": "May 1",
      "highlights(required)": "Beijing",
      "description(required)":
        "<p><strong>Day 1: Toronto - Beijing</strong><br />Overnight flight.</p>",
      "admissions(required)": "Included",
      "cancellation(required)": "Policy",
      "importantNotice(required)": "Notice",
      "INCLUDED(required)": "Hotels",
      "NOT INCLUDED(required)": "Insurance",
      "essentials.departureTime(required)": "8:00 AM",
      "essentials.meetingPlace(required)": "Airport",
      "essentials.hotels(required)": "Hotels",
      "essentials.escortedCoach(required)": "Coach",
      "fares.quad(required)": "0",
      "fares.triple(required)": "0",
      "fares.double(required)": "0",
      "fares.single(required)": "0",
      "fares.child(required)": "0",
      "Our Top Picks(required)": false,
      "Sun Destinations(required)": false,
      "Bus Tours(required)": false,
      "vacationPackage(required)": true,
      "Explore by Month(required)": false,
    },
  ])[0];

  const publicTour = mapTourRecordToPublicTour(record);

  assert.equal(publicTour.slug, "a-taste-of-cathay");
  assert.deepEqual(publicTour.itinerary, [
    { day: 1, title: "Toronto - Beijing", description: "Overnight flight." },
  ]);
});
