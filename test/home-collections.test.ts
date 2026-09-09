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

test("keeps custom reviews beyond seed slots", () => {
  const rows: TestimonialRow[] = [
    {
      id: "r1",
      name: "Updated reviewer",
      source: "Website",
      rating: 9,
      text: "Updated review",
      sort_order: 1,
      updated_at: "2026-07-23T14:00:00Z",
    },
    {
      id: "custom-1",
      name: "New guest",
      source: "TripAdvisor",
      rating: 4,
      text: "Great trip",
      sort_order: 2,
      updated_at: "2026-07-23T14:00:00Z",
    },
  ];
  const result = mergeTestimonialRows(rows);

  assert.equal(result.length, 2);
  assert.equal(result[0].name, "Updated reviewer");
  assert.equal(result[0].rating, 5);
  assert.equal(result[1].id, "custom-1");
});

test("falls back to seeded reviews when no rows exist", () => {
  const result = mergeTestimonialRows([]);
  assert.equal(result.length, testimonials.length);
});
