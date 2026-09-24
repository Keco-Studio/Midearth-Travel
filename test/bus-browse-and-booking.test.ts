import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { resolveExploreByMonthEntries } from "../src/lib/explore-by-month.ts";
import { resolveRegionCards } from "../src/data/destinations-by-region.ts";
import { destinationsByMonth } from "../src/data/destinations-by-month.ts";
import { destinationsByRegion, groupToursByRegion } from "../src/data/destinations-by-region.ts";
import type { Tour } from "../src/data/tours.ts";

const busTour: Tour = {
  slug: "bus-tour",
  title: "Bus Tour",
  region: "Canada",
  duration: "3 days",
  description: "A bus tour",
  image: "/bus.jpg",
  tags: [],
  tourType: "Bus Tour",
  busTourPackage: true,
};

test("month browse data can require a matching bus tour", () => {
  const entries = resolveExploreByMonthEntries(
    [
      {
        month: "Jan",
        label: "January",
        destinations: [
          { name: "Legacy destination", region: "Asia", tag: "", desc: "", image: "/legacy.jpg" },
          { name: "Bus Tour", region: "Canada", tag: "", desc: "", image: "/old.jpg", tourSlug: "bus-tour" },
        ],
      },
    ],
    [busTour],
    "",
    { requireTourMatch: true },
  );

  assert.deepEqual(entries[0].destinations.map((destination) => destination.tourSlug), ["bus-tour"]);
});

test("region browse data can exclude static showcase cards for bus-only listings", () => {
  const asia = destinationsByRegion.find((region) => region.name === "Asia");
  assert.ok(asia);
  const cards = resolveRegionCards(asia.items, [busTour], 3, true);
  assert.equal(cards.some((card) => card.slug === "vietnam" || card.slug === "thailand"), false);
});

test("bus region browse groups every live bus tour by its destination", () => {
  const groups = groupToursByRegion([
    busTour,
    { ...busTour, slug: "second-bus-tour", region: "USA" },
  ], (tour) => `中文 ${tour.region}`);
  assert.deepEqual(groups.map((group) => [group.name, group.tours.map((tour) => tour.slug)]), [
    ["中文 Canada", ["bus-tour"]],
    ["中文 USA", ["second-bus-tour"]],
  ]);
});

test("bus category enables browse sections with Bus Tours category content", () => {
  const source = readFileSync(new URL("../src/app/tours/category/[slug]/page.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(source, /loadPublishedHomeModules|getHomeModule/);
  assert.match(source, /showBrowseSections=\{slug === "bus-tours"\}/);
  assert.match(source, /getBusToursContent/);
});

test("bus browse sections receive category-filtered tours", () => {
  const source = readFileSync(new URL("../src/components/listing/tour-listing.tsx", import.meta.url), "utf8");
  assert.match(source, /browseTours/);
  assert.match(source, /browseFilteredTours/);
  assert.match(source, /<PopularByMonth[\s\S]*tours=\{browseFilteredTours\}/);
  assert.match(source, /<DestinationsByRegion[\s\S]*tours=\{browseFilteredTours\}/);
});

test("Bus Tours region controls use the active language category labels", () => {
  const source = readFileSync(new URL("../src/components/listing/tour-listing.tsx", import.meta.url), "utf8");
  assert.match(source, /getTourRegionBadge\(tour, destinationCategories, lang\)/);
});

test("navbar no longer renders a booking action", () => {
  const source = readFileSync(new URL("../src/components/navbar.tsx", import.meta.url), "utf8");
  const seed = readFileSync(new URL("../src/data/cms-seed.ts", import.meta.url), "utf8");
  assert.doesNotMatch(source, /bookNowLabel|bookNowLink|Book Now/);
  assert.doesNotMatch(seed, /bookNowLabel|Book now label/);
});

test("final CTA uses quote wording instead of booking wording", () => {
  const cta = readFileSync(new URL("../src/components/final-cta.tsx", import.meta.url), "utf8");
  const seed = readFileSync(new URL("../src/data/cms-seed.ts", import.meta.url), "utf8");
  assert.doesNotMatch(cta, /Start a booking/);
  assert.doesNotMatch(seed, /primaryButtonText: "Start a booking"/);
});

test("homepage month data remains available as the source for browse content", () => {
  assert.ok(destinationsByMonth.length > 0);
});
