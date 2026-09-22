import assert from "node:assert/strict";
import test from "node:test";
import {
  getLocalizedContent,
  getLocalizedStaticText,
  getLocalizedTourList,
  getLocalizedTourValue,
  resolveStoredLanguage,
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

test("resolves listing card and tour detail labels from the selected language", () => {
  assert.equal(getLocalizedStaticText("en", "tripCount", { count: 1 }), "1 trip");
  assert.equal(getLocalizedStaticText("en", "tripCount", { count: 2 }), "2 trips");
  assert.equal(getLocalizedStaticText("zh", "tripCount", { count: 2 }), "2 个行程");
  assert.equal(getLocalizedStaticText("zh", "viewTour"), "查看");
  assert.equal(getLocalizedStaticText("zh", "from"), "起价");
  assert.equal(getLocalizedStaticText("zh", "dayByDay"), "每日行程");
  assert.equal(getLocalizedStaticText("zh", "tourFares"), "行程价格");
  assert.equal(getLocalizedStaticText("zh", "callForQuote"), "请联系我们获取报价。价格因季节和房型而异。");
  assert.equal(getLocalizedStaticText("zh", "hotSales"), "热门优惠");
  assert.equal(getLocalizedStaticText("zh", "category"), "分类");
  assert.equal(getLocalizedStaticText("zh", "regionHeader"), "地区");
});

test("resolves persisted language before the provider exposes localized UI", () => {
  assert.equal(resolveStoredLanguage("zh"), "zh");
  assert.equal(resolveStoredLanguage("en"), "en");
  assert.equal(resolveStoredLanguage(null), "en");
  assert.equal(resolveStoredLanguage("unsupported"), "en");
});

test("interpolates an optional tour code into the localized booking CTA", () => {
  assert.equal(
    getLocalizedStaticText("en", "bookingCtaDescription", { tourCode: " for tour EH-12" }),
    "Email us to reserve your seats, or call our Ottawa office - we'll confirm availability and next steps for tour EH-12.",
  );
  assert.equal(
    getLocalizedStaticText("zh", "bookingCtaDescription", { tourCode: "（行程编号 EH-12）" }),
    "请通过电子邮件预留座位，或致电渥太华办公室，我们将确认可用情况和后续安排（行程编号 EH-12）。",
  );
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
