import assert from "node:assert/strict";
import test from "node:test";
import {
  resolveRegionCards,
  type RegionShowcaseRef,
} from "../src/data/destinations-by-region.ts";
import type { Tour } from "../src/data/tours.ts";

const liveTour: Tour = {
  slug: "cms-only-tour",
  title: "Live CMS title",
  region: "Asia",
  duration: "6 days",
  description: "Live CMS description",
  image: "/live.jpg",
  tags: ["Live"],
  tourType: "Group Tour",
};

test("region cards resolve tour references only from the live published collection", () => {
  const items: RegionShowcaseRef[] = [
    { tourSlug: liveTour.slug },
    { tourSlug: "highlights-of-japan" },
    {
      showcase: {
        slug: "independent-destination",
        title: "Independent destination",
        region: "Asia",
        duration: "Flexible",
        tourType: "Custom",
        image: "/independent.jpg",
        tags: ["Independent"],
        href: "/routes/asia",
      },
    },
  ];

  const cards = resolveRegionCards(items, [liveTour]);

  assert.deepEqual(cards.map((card) => card.slug), [
    "cms-only-tour",
    "independent-destination",
  ]);
  assert.equal(cards[0]?.title, "Live CMS title");
  assert.equal(cards[1]?.href, "/routes/asia");
});
