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

test("uses stored service rows including custom cards and page content", () => {
  const rows: ServiceRow[] = [
    {
      id: "flights",
      slug: "air-fares",
      title: "Air Fares",
      summary: "Updated summary",
      image: "https://example.com/flights.jpg",
      page_content: {
        title: "AIR FARES",
        intro: "Updated intro",
        signOff: "Cheers",
        disclaimer: "Tax not included",
        quoteLabel: "Air Fares",
        metaTitle: "Air Fares | MidEarth",
        metaDescription: "Desc",
        deals: [
          {
            id: "d1",
            route: "Ottawa - Tokyo",
            priceLabel: "from $999",
          },
        ],
      },
      sort_order: 1,
      updated_at: "2026-07-23T14:00:00Z",
    },
    {
      id: "custom-1",
      slug: "cruises",
      title: "Cruises",
      summary: "Ocean sailings",
      image: "https://example.com/cruise.jpg",
      page_content: {},
      sort_order: 2,
      updated_at: "2026-07-23T14:00:00Z",
    },
  ];

  const result = mergeServiceRows(rows);

  assert.equal(result.length, 2);
  assert.equal(result[0].title, "Air Fares");
  assert.equal(result[0].slug, "air-fares");
  assert.equal(result[0].page.title, "AIR FARES");
  assert.equal(result[0].page.deals[0]?.route, "Ottawa - Tokyo");
  assert.equal(result[1].title, "Cruises");
  assert.equal(result[1].page.signOff, "Thanks");
});

test("falls back to seeded services when no rows exist", () => {
  const result = mergeServiceRows([]);
  assert.equal(result.length, services.length);
  assert.equal(result[0].id, "flights");
  assert.ok(result[0].page.intro.length > 0);
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
