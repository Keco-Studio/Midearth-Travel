import assert from "node:assert/strict";
import test from "node:test";
import {
  parseFeaturedSlugs,
  pickFeaturedTours,
  serializeFeaturedSlugs,
} from "../src/lib/featured-tours.ts";

test("parses featured slug JSON and caps at four", () => {
  const slugs = parseFeaturedSlugs(
    serializeFeaturedSlugs(["a", "b", "c", "d", "e"]),
  );
  assert.deepEqual(slugs, ["a", "b", "c", "d"]);
});

test("picks featured tours by slug order then falls back to specialOffer flag", () => {
  const tours = [
    { slug: "a", featured: true },
    { slug: "b", featured: false },
    { slug: "c", featured: true },
  ];

  assert.deepEqual(
    pickFeaturedTours(tours, ["c", "a"]).map((tour) => tour.slug),
    ["c", "a"],
  );
  assert.deepEqual(
    pickFeaturedTours(tours, []).map((tour) => tour.slug),
    ["a", "c"],
  );
});
