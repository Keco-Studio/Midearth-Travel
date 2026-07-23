import assert from "node:assert/strict";
import test from "node:test";
import { services } from "../src/data/services.ts";
import { testimonials } from "../src/data/testimonials.ts";
import {
  mergeServiceRows,
  mergeTestimonialRows,
  type ServiceRow,
  type TestimonialRow,
} from "../src/lib/home-collections.ts";

test("applies stored service card fields to fixed service slots", () => {
  const row: ServiceRow = {
    id: "flights",
    slug: "air-fares",
    title: "Air Fares",
    summary: "Updated summary",
    image: "https://example.com/flights.jpg",
    sort_order: 1,
    updated_at: "2026-07-23T14:00:00Z",
  };
  const result = mergeServiceRows([row]);

  assert.equal(result.length, services.length);
  assert.equal(result[0].title, "Air Fares");
  assert.equal(result[0].slug, "air-fares");
  assert.equal(result[0].image, row.image);
});

test("applies stored review fields and clamps ratings to one through five", () => {
  const row: TestimonialRow = {
    id: "r1",
    name: "Updated reviewer",
    source: "Website",
    rating: 9,
    text: "Updated review",
    sort_order: 1,
    updated_at: "2026-07-23T14:00:00Z",
  };
  const result = mergeTestimonialRows([row]);

  assert.equal(result.length, testimonials.length);
  assert.equal(result[0].name, "Updated reviewer");
  assert.equal(result[0].rating, 5);
  assert.equal(result[0].text, "Updated review");
});
