import assert from "node:assert/strict";
import test from "node:test";
import { tourSeeds } from "../src/data/cms-seed.ts";
import { tours } from "../src/data/tours.ts";
import {
  mapTourRecordToPublicTour,
  mergeTourRows,
  toTourRow,
  type TourRow,
} from "../src/lib/tour-content.ts";

const seed = tourSeeds[0];

test("merges stored tour records over seeds and keeps new records", () => {
  const stored: TourRow = {
    ...toTourRow(seed),
    data: { ...seed, title: "Stored title" },
    updated_at: "2026-07-23T14:00:00Z",
  };
  const extra: TourRow = {
    ...stored,
    slug: "new-tour",
    data: { ...seed, slug: "new-tour", title: "New tour" },
  };
  const records = mergeTourRows([stored, extra]);

  assert.equal(records.find((record) => record.slug === seed.slug)?.title, "Stored title");
  assert.equal(records.find((record) => record.slug === "new-tour")?.title, "New tour");
});

test("maps editable tour fields to public tours while retaining rich static details", () => {
  const base = tours.find((tour) => tour.slug === seed.slug)!;
  const record = {
    ...seed,
    title: "Updated public title",
    image: "https://example.supabase.co/storage/tour.jpg",
    departures: "Aug 1, Sep 2",
    highlights: "Coast, Mountains",
    fares: { ...seed.fares, double: "$999" },
    specialOffer: false,
  };
  const mapped = mapTourRecordToPublicTour(record);

  assert.equal(mapped.title, "Updated public title");
  assert.equal(mapped.image, record.image);
  assert.deepEqual(mapped.departures, ["Aug 1", "Sep 2"]);
  assert.deepEqual(mapped.highlights, ["Coast", "Mountains"]);
  assert.equal(mapped.fares?.find((fare) => fare.label === "Double")?.price, "$999");
  assert.equal(mapped.featured, false);
  assert.deepEqual(mapped.itinerary, base.itinerary);
});

test("excludes non-published records from the public mapping", () => {
  const publicTours = mergeTourRows([
    { ...toTourRow(seed), status: "draft", data: { ...seed, status: "draft" } },
  ])
    .filter((record) => record.status === "published")
    .map(mapTourRecordToPublicTour);

  assert.equal(publicTours.some((tour) => tour.slug === seed.slug), false);
});
