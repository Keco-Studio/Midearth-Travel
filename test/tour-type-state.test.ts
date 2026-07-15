import assert from "node:assert/strict";
import test from "node:test";
import {
  TOUR_TYPE_STORAGE_KEY,
  applyTourTypeOverrides,
  buildTourTypeStorageState,
  getTourTypeOptions,
  parseTourTypeStorage,
  validateNewTourType,
} from "../src/lib/tour-type-state.ts";
import { mapTravelToursToRecords } from "../src/lib/travel-data-mapper.ts";
import type { TourRecord } from "../src/types/cms.ts";

const baseTour = mapTravelToursToRecords()[0];
const sourceTours: TourRecord[] = [
  {
    ...baseTour,
    slug: "alpha",
    title: "Alpha",
    image: "/alpha.jpg",
    region: "Canada",
    duration: "2 days",
    tourType: "Bus Tour",
    status: "published",
    updatedAt: "2026-07-01T00:00:00Z",
  },
  {
    ...baseTour,
    slug: "beta",
    title: "Beta",
    image: "/beta.jpg",
    region: "Europe",
    duration: "5 days",
    tourType: "Group Tour",
    status: "published",
    updatedAt: "2026-07-01T00:00:00Z",
  },
];

test("uses a versioned Tour Library storage key", () => {
  assert.equal(TOUR_TYPE_STORAGE_KEY, "midearth-cms.tour-library.v1");
});

test("trims and accepts a unique tour type", () => {
  assert.deepEqual(validateNewTourType("  Expedition  ", ["Bus Tour"]), {
    ok: true,
    value: "Expedition",
  });
});

test("rejects empty and case-insensitive duplicate tour types", () => {
  assert.deepEqual(validateNewTourType("   ", ["Bus Tour"]), {
    ok: false,
    reason: "required",
  });
  assert.deepEqual(validateNewTourType("bus tour", ["Bus Tour"]), {
    ok: false,
    reason: "duplicate",
  });
});

test("parses valid versioned stored data", () => {
  assert.deepEqual(
    parseTourTypeStorage(
      JSON.stringify({
        version: 1,
        customTypes: [" Expedition ", "expedition", "Rail Tour"],
        overrides: { alpha: " Expedition ", beta: "" },
      }),
    ),
    {
      version: 1,
      customTypes: ["Expedition", "Rail Tour"],
      overrides: { alpha: "Expedition" },
    },
  );
});

test("ignores malformed and unsupported stored data", () => {
  const emptyState = { version: 1, customTypes: [], overrides: {} };

  assert.deepEqual(parseTourTypeStorage("{"), emptyState);
  assert.deepEqual(
    parseTourTypeStorage(JSON.stringify({ version: 2, customTypes: [], overrides: {} })),
    emptyState,
  );
  assert.deepEqual(
    parseTourTypeStorage(JSON.stringify({ version: 1, customTypes: {}, overrides: [] })),
    emptyState,
  );
});

test("applies only valid overrides for known tour slugs", () => {
  assert.deepEqual(
    applyTourTypeOverrides(sourceTours, {
      alpha: "Expedition",
      unknown: "Rail Tour",
      beta: "   ",
    }).map(({ slug, tourType }) => ({ slug, tourType })),
    [
      { slug: "alpha", tourType: "Expedition" },
      { slug: "beta", tourType: "Group Tour" },
    ],
  );
});

test("builds deduplicated options and minimal persisted overrides", () => {
  const currentTours = applyTourTypeOverrides(sourceTours, { alpha: "Expedition" });

  assert.deepEqual(getTourTypeOptions(currentTours, ["expedition", "Rail Tour"]), [
    "Bus Tour",
    "Group Tour",
    "Sun Destinations",
    "Expedition",
    "Rail Tour",
  ]);
  assert.deepEqual(buildTourTypeStorageState(sourceTours, currentTours, ["Expedition"]), {
    version: 1,
    customTypes: ["Expedition"],
    overrides: { alpha: "Expedition" },
  });
});
