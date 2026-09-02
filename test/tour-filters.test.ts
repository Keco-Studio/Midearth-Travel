import assert from "node:assert/strict";
import test from "node:test";
import { filterToursForCategory } from "../src/data/tour-filters.ts";
import type { Tour } from "../src/data/tours.ts";

const sampleTours = [
  {
    slug: "maritime",
    title: "Maritime",
    region: "North America",
    duration: "7 days",
    description: "Coast",
    image: "/a.jpg",
    tags: [],
    tourType: "Bus Tour",
  },
  {
    slug: "paris",
    title: "Paris",
    region: "Europe",
    duration: "7 days",
    description: "City",
    image: "/b.jpg",
    tags: [],
    tourType: "Bus Tour",
  },
  {
    slug: "sun",
    title: "Cruise",
    region: "Sun Destinations",
    duration: "5 days",
    description: "Beach",
    image: "/c.jpg",
    tags: [],
    tourType: "Sun Destinations",
  },
] as Tour[];

test("filters North America tours by imported region label", () => {
  const result = filterToursForCategory(sampleTours, "north-america");
  assert.deepEqual(
    result.map((tour) => tour.slug),
    ["maritime"],
  );
});

test("filters Sun Destinations tours by region label", () => {
  const result = filterToursForCategory(sampleTours, "sun-destinations");
  assert.deepEqual(
    result.map((tour) => tour.slug),
    ["sun"],
  );
});

test("counts bus and vacation packages from explicit package flags", () => {
  const tours = [
    {
      ...sampleTours[0],
      slug: "bus-only",
      busTourPackage: true,
      vacationPackage: false,
      tourType: "Bus Tour",
    },
    {
      ...sampleTours[1],
      slug: "both",
      busTourPackage: true,
      vacationPackage: true,
      tourType: "Bus Tour",
    },
    {
      ...sampleTours[2],
      slug: "vacation-only",
      region: "Europe",
      busTourPackage: false,
      vacationPackage: true,
      tourType: "Group Tour",
    },
  ] as Tour[];

  assert.deepEqual(
    filterToursForCategory(tours, "bus-tours").map((tour) => tour.slug),
    ["bus-only", "both"],
  );
  assert.deepEqual(
    filterToursForCategory(tours, "vacation-packages").map((tour) => tour.slug),
    ["both", "vacation-only"],
  );
});
