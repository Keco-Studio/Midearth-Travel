import assert from "node:assert/strict";
import test from "node:test";
import type { Tour } from "../src/data/tours.ts";
import {
  getPublishedHotSalePromotions,
  getTourOriginalPrice,
  parseHotSalePromotions,
  serializeHotSalePromotions,
  validateHotSalesForPublish,
} from "../src/lib/hot-sales.ts";

const pricedTour: Tour = {
  slug: "maritime",
  title: "Maritime",
  region: "Canada",
  duration: "7 days",
  description: "Coastal tour",
  image: "/maritime.jpg",
  tags: [],
  tourType: "Bus Tour",
  fares: [
    { label: "Double", price: "$969" },
    { label: "Quad", price: "CAD $639.00" },
    { label: "Single", price: "$1,699" },
  ],
};

test("normalizes stored Hot Sales promotions and removes duplicate tours", () => {
  const promotions = parseHotSalePromotions({
    promotionsData: JSON.stringify([
      {
        tourSlug: " maritime ",
        salePrice: " 599 ",
        offerDescription: " Last minute departure ",
        localizedOfferDescription: " 即将成团 ",
      },
      {
        tourSlug: "maritime",
        salePrice: "500",
        offerDescription: "Duplicate",
        localizedOfferDescription: "",
      },
      { tourSlug: "", salePrice: "99" },
    ]),
  });

  assert.deepEqual(promotions, [
    {
      tourSlug: "maritime",
      salePrice: "599",
      offerDescription: "Last minute departure",
      localizedOfferDescription: "即将成团",
    },
  ]);
  assert.deepEqual(
    parseHotSalePromotions({ promotionsData: "not-json" }),
    [],
  );
  assert.equal(serializeHotSalePromotions(promotions), JSON.stringify(promotions));
});

test("derives the original Hot Sales price from the lowest valid fare", () => {
  assert.equal(getTourOriginalPrice(pricedTour), "CAD $639.00");
  assert.equal(getTourOriginalPrice({ ...pricedTour, fares: [] }), null);
  assert.equal(
    getTourOriginalPrice({
      ...pricedTour,
      fares: [{ label: "Adult", price: "Call for quote" }],
    }),
    null,
  );
});

test("accepts discounted and description-only promotions for publishing", () => {
  assert.doesNotThrow(() =>
    validateHotSalesForPublish(
      {
        promotionsData: serializeHotSalePromotions([
          {
            tourSlug: "maritime",
            salePrice: "599",
            offerDescription: "",
            localizedOfferDescription: "",
          },
        ]),
      },
      [pricedTour],
    ),
  );
  assert.doesNotThrow(() =>
    validateHotSalesForPublish(
      {
        promotionsData: serializeHotSalePromotions([
          {
            tourSlug: "maritime",
            salePrice: "",
            offerDescription: "3rd & 4th guests 50% off",
            localizedOfferDescription: "第三、四人半价",
          },
        ]),
      },
      [pricedTour],
    ),
  );
});

test("rejects invalid Hot Sales publication values", () => {
  const contentFor = (salePrice: string, offerDescription = "") => ({
    promotionsData: serializeHotSalePromotions([
      {
        tourSlug: "maritime",
        salePrice,
        offerDescription,
        localizedOfferDescription: "",
      },
    ]),
  });

  assert.throws(
    () => validateHotSalesForPublish(contentFor(""), [pricedTour]),
    /discounted price or offer description/i,
  );
  assert.throws(
    () => validateHotSalesForPublish(contentFor("Call"), [pricedTour]),
    /valid CAD/i,
  );
  assert.throws(
    () => validateHotSalesForPublish(contentFor("700"), [pricedTour]),
    /lower than/i,
  );
  assert.throws(
    () => validateHotSalesForPublish(contentFor("599"), []),
    /existing tour/i,
  );
  assert.throws(
    () =>
      validateHotSalesForPublish(contentFor("599"), [
        { ...pricedTour, fares: [] },
      ]),
    /original fare/i,
  );
});

test("resolves valid published Hot Sales entries in CMS order", () => {
  const content = {
    promotionsData: serializeHotSalePromotions([
      {
        tourSlug: "missing",
        salePrice: "10",
        offerDescription: "",
        localizedOfferDescription: "",
      },
      {
        tourSlug: "maritime",
        salePrice: "599",
        offerDescription: "Last minute departure",
        localizedOfferDescription: "即将成团",
      },
    ]),
  };

  assert.deepEqual(
    getPublishedHotSalePromotions(content, [pricedTour]).map((entry) => ({
      slug: entry.tour.slug,
      originalPrice: entry.originalPrice,
      salePrice: entry.salePrice,
    })),
    [{ slug: "maritime", originalPrice: "CAD $639.00", salePrice: "CAD $599.00" }],
  );
});
