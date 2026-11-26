import assert from "node:assert/strict";
import test from "node:test";
import type { Tour } from "../src/data/tours.ts";
import {
  addTopPickSlug,
  hasTopPickSelection,
  moveTopPickSlug,
  parseTopPickSlugs,
  removeTopPickSlug,
  resolveTopPickTours,
  serializeTopPickSlugs,
} from "../src/lib/top-picks.ts";

const coast: Tour = {
  slug: "coast",
  title: "Coast",
  region: "Canada",
  duration: "7 days",
  description: "Coastal tour",
  image: "/coast.jpg",
  tags: [],
  tourType: "Bus Tour",
  featured: true,
};

const cruise: Tour = {
  ...coast,
  slug: "cruise",
  title: "Cruise",
};

test("normalizes an ordered Top Picks selection", () => {
  assert.deepEqual(
    parseTopPickSlugs({ selectedToursData: '[" coast ","coast","cruise",5,""]' }),
    ["coast", "cruise"],
  );
  assert.deepEqual(parseTopPickSlugs({ selectedToursData: "not-json" }), []);
});

test("adds, removes, and reorders Top Picks without duplicates", () => {
  assert.deepEqual(addTopPickSlug(["coast"], "cruise"), ["coast", "cruise"]);
  assert.deepEqual(addTopPickSlug(["coast"], " coast "), ["coast"]);
  assert.deepEqual(removeTopPickSlug(["coast", "cruise"], "coast"), ["cruise"]);
  assert.deepEqual(
    moveTopPickSlug(["coast", "cruise"], "cruise", "up"),
    ["cruise", "coast"],
  );
  assert.deepEqual(
    moveTopPickSlug(["coast", "cruise"], "coast", "up"),
    ["coast", "cruise"],
  );
});

test("distinguishes a missing selection from an explicit empty list", () => {
  assert.equal(hasTopPickSelection({}), false);
  assert.equal(hasTopPickSelection({ selectedToursData: "[]" }), true);
});

test("resolves explicit Top Picks order and uses featured tours only for legacy content", () => {
  const explicit = { selectedToursData: serializeTopPickSlugs(["cruise", "coast"]) };
  assert.deepEqual(
    resolveTopPickTours(explicit, [coast, cruise]).map((tour) => tour.slug),
    ["cruise", "coast"],
  );
  assert.deepEqual(resolveTopPickTours({ selectedToursData: "[]" }, [coast, cruise]), []);
  assert.deepEqual(
    resolveTopPickTours({}, [cruise, { ...coast, featured: false }]).map(
      (tour) => tour.slug,
    ),
    ["cruise"],
  );
});
