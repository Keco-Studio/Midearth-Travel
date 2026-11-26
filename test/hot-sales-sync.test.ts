import assert from "node:assert/strict";
import test from "node:test";
import { tourSeeds } from "../src/data/cms-seed.ts";
import {
  HOT_SALES_DATA_KEY,
  parseHotSalePromotions,
  serializeHotSalePromotions,
} from "../src/lib/hot-sales.ts";
import {
  applyHotSalesContentToTourRecords,
  createHotSalesTourPatches,
  createHotSalesContentFromTours,
  syncHotSalesContentFromTour,
} from "../src/lib/hot-sales-sync.ts";

const firstTour = tourSeeds[0];
const secondTour = tourSeeds[1];

test("adds and updates one Tour Library promotion without changing other entries", () => {
  const initialContent = {
    [HOT_SALES_DATA_KEY]: serializeHotSalePromotions([
      {
        tourSlug: firstTour.slug,
        salePrice: "599",
        offerDescription: "First offer",
        localizedOfferDescription: "第一个优惠",
      },
    ]),
  };
  const added = syncHotSalesContentFromTour(initialContent, {
    ...secondTour,
    specialDeals: true,
    salePrice: "249",
    hotSaleDescription: "Last minute departure",
    localizedHotSaleDescription: "即将成团",
  });

  assert.deepEqual(parseHotSalePromotions(added), [
    {
      tourSlug: firstTour.slug,
      salePrice: "599",
      offerDescription: "First offer",
      localizedOfferDescription: "第一个优惠",
    },
    {
      tourSlug: secondTour.slug,
      salePrice: "249",
      offerDescription: "Last minute departure",
      localizedOfferDescription: "即将成团",
    },
  ]);

  const updated = syncHotSalesContentFromTour(added, {
    ...secondTour,
    specialDeals: true,
    salePrice: "229",
    hotSaleDescription: "Updated offer",
    localizedHotSaleDescription: "更新优惠",
  });
  assert.equal(parseHotSalePromotions(updated)[1]?.salePrice, "229");
  assert.equal(parseHotSalePromotions(updated)[0]?.salePrice, "599");
});

test("turning Hot sale off in Tour Library removes only that promotion", () => {
  const content = {
    [HOT_SALES_DATA_KEY]: serializeHotSalePromotions([
      {
        tourSlug: firstTour.slug,
        salePrice: "599",
        offerDescription: "",
        localizedOfferDescription: "",
      },
      {
        tourSlug: secondTour.slug,
        salePrice: "249",
        offerDescription: "",
        localizedOfferDescription: "",
      },
    ]),
  };

  assert.deepEqual(
    parseHotSalePromotions(
      syncHotSalesContentFromTour(content, {
        ...firstTour,
        specialDeals: false,
      }),
    ).map((promotion) => promotion.tourSlug),
    [secondTour.slug],
  );
});

test("publishing Homepage Hot Sales projects membership and offer fields to tours", () => {
  const content = {
    [HOT_SALES_DATA_KEY]: serializeHotSalePromotions([
      {
        tourSlug: secondTour.slug,
        salePrice: "249",
        offerDescription: "Last minute departure",
        localizedOfferDescription: "即将成团",
      },
    ]),
  };
  const records = applyHotSalesContentToTourRecords(content, [
    { ...firstTour, specialDeals: true, salePrice: "599" },
    secondTour,
  ]);

  assert.equal(records[0]?.specialDeals, false);
  assert.equal(records[0]?.salePrice, "");
  assert.equal(records[1]?.specialDeals, true);
  assert.equal(records[1]?.salePrice, "249");
  assert.equal(records[1]?.hotSaleDescription, "Last minute departure");
  assert.equal(records[1]?.localizedHotSaleDescription, "即将成团");
});

test("publishing Homepage Hot Sales creates promotion-only Tour patches", () => {
  const content = {
    [HOT_SALES_DATA_KEY]: serializeHotSalePromotions([
      {
        tourSlug: secondTour.slug,
        salePrice: "249",
        offerDescription: "Last minute departure",
        localizedOfferDescription: "即将成团",
      },
    ]),
  };

  assert.deepEqual(
    createHotSalesTourPatches(
      content,
      [
        { ...firstTour, displayOrder: 9 },
        { ...secondTour, displayOrder: 3 },
      ],
      "2026-11-26T12:00:00.000Z",
    ),
    [
      {
        kind: "promotion",
        slug: firstTour.slug,
        data: {
          specialDeals: false,
          salePrice: "",
          hotSaleDescription: "",
          localizedHotSaleDescription: "",
        },
        updated_at: "2026-11-26T12:00:00.000Z",
      },
      {
        kind: "promotion",
        slug: secondTour.slug,
        data: {
          specialDeals: true,
          salePrice: "249",
          hotSaleDescription: "Last minute departure",
          localizedHotSaleDescription: "即将成团",
        },
        updated_at: "2026-11-26T12:00:00.000Z",
      },
    ],
  );
});

test("seeds a missing Hot Sales module from current Tour Library promotions", () => {
  const content = createHotSalesContentFromTours(
    {
      sectionTitleEn: "Hot Sales",
      promotionsData: "[]",
    },
    [
      {
        ...firstTour,
        specialDeals: true,
        salePrice: "",
        hotSaleDescription: "",
        localizedHotSaleDescription: "",
      },
      {
        ...secondTour,
        specialDeals: true,
        salePrice: "249",
        hotSaleDescription: "Last minute departure",
        localizedHotSaleDescription: "即将成团",
      },
      {
        ...firstTour,
        slug: "draft-hot-sale",
        status: "draft",
        specialDeals: true,
        salePrice: "199",
        hotSaleDescription: "Draft-only offer",
        localizedHotSaleDescription: "仅草稿优惠",
      },
    ],
  );

  assert.deepEqual(parseHotSalePromotions(content), [
    {
      tourSlug: firstTour.slug,
      salePrice: "",
      offerDescription: "Limited-time offer",
      localizedOfferDescription: "限时优惠",
    },
    {
      tourSlug: secondTour.slug,
      salePrice: "249",
      offerDescription: "Last minute departure",
      localizedOfferDescription: "即将成团",
    },
  ]);
});
