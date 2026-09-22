import assert from "node:assert/strict";
import test from "node:test";
import {
  getLocalizedContent,
  getLocalizedStaticText,
  getLocalizedTourList,
  getLocalizedTourValue,
} from "../src/lib/localized-content.ts";

test("uses the selected Chinese CMS value and falls back to English", () => {
  assert.equal(
    getLocalizedContent({ titleEn: "Where to Go", titleZh: "目的地" }, "title", "zh", "Fallback"),
    "目的地",
  );
  assert.equal(
    getLocalizedContent({ titleEn: "Where to Go", titleZh: "" }, "title", "zh", "Fallback"),
    "Where to Go",
  );
});

test("uses English CMS values and supplied fallback when the selected value is absent", () => {
  assert.equal(
    getLocalizedContent({ titleEn: "Where to Go", titleZh: "目的地" }, "title", "en", "Fallback"),
    "Where to Go",
  );
  assert.equal(getLocalizedContent({}, "title", "zh", "Fallback"), "Fallback");
});

test("resolves static UI labels from the selected language", () => {
  assert.equal(getLocalizedStaticText("en", "bookNow"), "Book Now");
  assert.equal(getLocalizedStaticText("zh", "bookNow"), "立即预订");
});

test("uses populated Chinese tour values and lists, otherwise English", () => {
  assert.equal(getLocalizedTourValue("zh", "九天", "9 days"), "九天");
  assert.equal(getLocalizedTourValue("zh", "", "9 days"), "9 days");
  assert.deepEqual(
    getLocalizedTourList("zh", ["蒙特利尔", "渥太华"], ["Montreal", "Ottawa"]),
    ["蒙特利尔", "渥太华"],
  );
  assert.deepEqual(
    getLocalizedTourList("zh", [], ["Montreal", "Ottawa"]),
    ["Montreal", "Ottawa"],
  );
});
