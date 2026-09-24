import test from "node:test";
import assert from "node:assert/strict";
import {
  getLocalizedServicePage,
  type ServicePageFields,
} from "../src/data/services.ts";
import { normalizePageFields } from "../src/lib/home-collections.ts";

const englishPage: ServicePageFields = {
  title: "FLIGHTS",
  intro: "English introduction",
  signOff: "Thanks",
  disclaimer: "English disclaimer",
  quoteLabel: "Flights",
  metaTitle: "Flights | Midearth Travel",
  metaDescription: "English metadata",
  deals: [{ id: "deal-1", route: "Ottawa - Shanghai", priceLabel: "$****" }],
};

test("normalizes optional Chinese service page fields without losing legacy English content", () => {
  const page = normalizePageFields({
    ...englishPage,
    titleZh: "机票",
    introZh: "中文介绍",
    quoteLabelZh: "机票预订",
  }, englishPage, "Flights");

  assert.equal(page.title, "FLIGHTS");
  assert.equal(page.titleZh, "机票");
  assert.equal(page.introZh, "中文介绍");
  assert.equal(page.quoteLabelZh, "机票预订");
  assert.deepEqual(page.deals, englishPage.deals);
});

test("selects Chinese service page copy and falls back per field when Chinese is blank", () => {
  const page = normalizePageFields({
    ...englishPage,
    titleZh: "机票",
    introZh: "中文介绍",
    quoteLabelZh: "",
  }, englishPage, "Flights");

  const localized = getLocalizedServicePage(page, "zh");

  assert.equal(localized.title, "机票");
  assert.equal(localized.intro, "中文介绍");
  assert.equal(localized.quoteLabel, "Flights");
  assert.equal(localized.metaTitle, englishPage.metaTitle);
});
