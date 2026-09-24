import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import {
  destinationCategorySeeds,
  mergeDestinationCategoryRows,
  type DestinationCategoryRow,
} from "../src/lib/destination-categories.ts";
import { getDestinationCategoryTitle } from "../src/lib/destination-category-title.ts";
import {
  createDefaultBusToursContent,
  getBusToursContent,
} from "../src/lib/bus-tours-content.ts";

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

test("uses a stored Chinese summary while retaining English fallback", () => {
  const categories = mergeDestinationCategoryRows([
    {
      id: "asia",
      title_en: "Asia",
      title_zh: "亚洲",
      summary: "English summary",
      summary_zh: "中文简介",
      sort_order: 2,
      updated_at: "2026-09-22T12:00:00Z",
    },
  ]);

  assert.equal(categories[1].summary, "English summary");
  assert.equal(categories[1].summaryZh, "中文简介");
});

test("keeps Bus Tours browse content with the Bus Tours destination category", () => {
  const content = createDefaultBusToursContent();
  const categories = mergeDestinationCategoryRows([
    {
      id: "bus-tours",
      title_en: "Bus Tours",
      title_zh: "巴士旅行团",
      bus_content: JSON.stringify({
        ...content,
        monthTitleZh: "按月份选择巴士旅行",
      }),
      sort_order: 5,
      updated_at: "2026-09-24T12:00:00Z",
    },
  ]);

  const busTours = categories.find((category) => category.id === "bus-tours");
  assert.equal(getBusToursContent(busTours?.busContent).monthTitleZh, "按月份选择巴士旅行");
});

test("provides Chinese Bus Tours browsing headings by default", () => {
  const content = createDefaultBusToursContent();
  assert.equal(content.monthTitleZh, "按月份选择热门目的地");
  assert.equal(content.regionTitleZh, "按地区浏览目的地");
});

test("Destination names editor falls back when legacy Bus Tours content is absent", () => {
  const source = readFileSync(
    new URL("../src/components/destination-category-editor.tsx", import.meta.url),
    "utf8",
  );
  assert.match(source, /getBusToursContent\(busTours\.busContent\)/);
});

test("homepage tour cards pass the active language to region badges", () => {
  const source = readFileSync(
    new URL("../src/components/tour-card.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /getTourRegionBadge\(tour, destinationCategories, lang\)/);
});

test("Bus Tours editor omits unused monthly and regional description fields", () => {
  const source = readFileSync(
    new URL("../src/components/bus-tours-content-editor.tsx", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(source, /Month description \(English\)/);
  assert.doesNotMatch(source, /月份说明（中文）/);
  assert.doesNotMatch(source, /Region description \(English\)/);
  assert.doesNotMatch(source, /地区说明（中文）/);
});
