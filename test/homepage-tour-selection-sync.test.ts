import assert from "node:assert/strict";
import test from "node:test";
import { tourSeeds } from "../src/data/cms-seed.ts";
import {
  EXPLORE_MONTHS_DATA_KEY,
  findExploreMonthForTour,
  getExploreByMonthEntries,
  serializeMonthEntries,
} from "../src/lib/explore-by-month.ts";
import {
  createExploreByMonthTourPatches,
  createTopPicksTourPatches,
  syncHomepageSelectionsFromTour,
} from "../src/lib/homepage-tour-selection-sync.ts";
import {
  TOP_PICKS_DATA_KEY,
  parseTopPickSlugs,
  serializeTopPickSlugs,
} from "../src/lib/top-picks.ts";

const firstTour = tourSeeds[0];
const secondTour = tourSeeds[1];

const topPicksContent = {
  sectionTitleEn: "Our Top Picks",
  [TOP_PICKS_DATA_KEY]: serializeTopPickSlugs([firstTour.slug]),
};

const exploreContent = {
  titleEn: "When to Go",
  [EXPLORE_MONTHS_DATA_KEY]: serializeMonthEntries([
    {
      month: "Jun",
      label: "June",
      destinations: [
        {
          id: "first-june",
          tourSlug: firstTour.slug,
          name: "",
          region: "",
          tag: "",
          desc: "Keep this description",
          localizedDesc: "保留这个说明",
          image: "",
          href: "",
        },
      ],
    },
    {
      month: "Aug",
      label: "August",
      destinations: [],
    },
  ]),
};

test("syncs one Tour Library selection into both Homepage modules", () => {
  const linked = syncHomepageSelectionsFromTour({
    topPicksContent,
    exploreContent,
    tour: {
      ...secondTour,
      specialOffer: true,
      exploreMonth: "Aug",
    },
  });

  assert.deepEqual(parseTopPickSlugs(linked.topPicksContent), [
    firstTour.slug,
    secondTour.slug,
  ]);
  assert.equal(
    findExploreMonthForTour(
      getExploreByMonthEntries(linked.exploreContent),
      secondTour.slug,
    ),
    "Aug",
  );
  assert.equal(linked.topPicksContent.sectionTitleEn, "Our Top Picks");
  assert.equal(linked.exploreContent.titleEn, "When to Go");
});

test("moving one Tour Library assignment preserves unrelated monthly copy", () => {
  const linked = syncHomepageSelectionsFromTour({
    topPicksContent,
    exploreContent,
    tour: {
      ...firstTour,
      specialOffer: false,
      exploreMonth: "Aug",
    },
  });
  const entries = getExploreByMonthEntries(linked.exploreContent);
  const moved = entries
    .find((entry) => entry.month === "Aug")
    ?.destinations.find((destination) => destination.tourSlug === firstTour.slug);

  assert.deepEqual(parseTopPickSlugs(linked.topPicksContent), []);
  assert.equal(findExploreMonthForTour(entries, firstTour.slug), "Aug");
  assert.equal(moved?.desc, "");
  assert.equal(moved?.localizedDesc, "");
});

test("publishing Top Picks creates membership-only Tour patches", () => {
  assert.deepEqual(
    createTopPicksTourPatches(
      {
        [TOP_PICKS_DATA_KEY]: serializeTopPickSlugs([secondTour.slug]),
      },
      [firstTour, secondTour],
      "2026-11-26T12:00:00.000Z",
    ),
    [
      {
        kind: "projection",
        slug: firstTour.slug,
        data: { specialOffer: false },
        updated_at: "2026-11-26T12:00:00.000Z",
      },
      {
        kind: "projection",
        slug: secondTour.slug,
        data: { specialOffer: true },
        updated_at: "2026-11-26T12:00:00.000Z",
      },
    ],
  );
});

test("publishing Explore by Month creates month-only Tour patches", () => {
  assert.deepEqual(
    createExploreByMonthTourPatches(
      exploreContent,
      [firstTour, secondTour],
      "2026-11-26T12:00:00.000Z",
    ),
    [
      {
        kind: "projection",
        slug: firstTour.slug,
        data: { exploreMonth: "Jun", travelNewsPackage: true },
        updated_at: "2026-11-26T12:00:00.000Z",
      },
      {
        kind: "projection",
        slug: secondTour.slug,
        data: { exploreMonth: "", travelNewsPackage: false },
        updated_at: "2026-11-26T12:00:00.000Z",
      },
    ],
  );
});
