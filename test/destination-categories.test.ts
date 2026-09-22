import assert from "node:assert/strict";
import test from "node:test";
import {
  destinationCategorySeeds,
  mergeDestinationCategoryRows,
  type DestinationCategoryRow,
} from "../src/lib/destination-categories.ts";
import { getDestinationCategoryTitle } from "../src/lib/destination-category-title.ts";

test("keeps fixed destination slots while applying stored bilingual names", () => {
  const row: DestinationCategoryRow = {
    id: "asia",
    title_en: "East Asia",
    title_zh: "东亚",
    sort_order: 2,
    updated_at: "2026-07-23T14:00:00Z",
  };
  const categories = mergeDestinationCategoryRows([row]);

  assert.equal(categories.length, destinationCategorySeeds.length);
  assert.equal(categories[1].id, "asia");
  assert.equal(categories[1].titleEn, "East Asia");
  assert.equal(categories[1].titleZh, "东亚");
  assert.equal(categories[1].image, "/highlights-japan-mt-fuji.jpg");
});

test("ignores unknown rows instead of creating unsupported layout slots", () => {
  const categories = mergeDestinationCategoryRows([
    {
      id: "unknown",
      title_en: "Unknown",
      title_zh: "未知",
      sort_order: 99,
      updated_at: "2026-07-23T14:00:00Z",
    },
  ]);

  assert.equal(categories.length, 6);
  assert.equal(categories.some((category) => category.id === "unknown"), false);
});

test("selects the configured category title for the active public language", () => {
  const categories = mergeDestinationCategoryRows([
    {
      id: "asia",
      title_en: "East Asia",
      title_zh: "东亚精选",
      sort_order: 2,
      updated_at: "2026-09-22T12:00:00Z",
    },
  ]);

  assert.equal(getDestinationCategoryTitle("asia", categories, "en"), "East Asia");
  assert.equal(getDestinationCategoryTitle("asia", categories, "zh"), "东亚精选");
});
