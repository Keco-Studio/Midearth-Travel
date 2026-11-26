import assert from "node:assert/strict";
import test from "node:test";
import {
  addHotSalePromotion,
  getTourRecordOriginalPrice,
  HOT_SALES_DATA_KEY,
  moveHotSalePromotion,
  normalizeHotSalesContent,
  parseHotSalePromotions,
  removeHotSalePromotion,
  serializeHotSalePromotions,
  updateHotSalePromotion,
  type HotSalePromotion,
} from "../src/lib/hot-sales.ts";
import type { TourRecord } from "../src/types/cms.ts";

const first: HotSalePromotion = {
  tourSlug: "first",
  salePrice: "",
  offerDescription: "First offer",
  localizedOfferDescription: "",
};
const second: HotSalePromotion = {
  tourSlug: "second",
  salePrice: "199",
  offerDescription: "",
  localizedOfferDescription: "第二个优惠",
};

test("adds each tour to the Hot Sales editor at most once", () => {
  assert.deepEqual(addHotSalePromotion([first], "second"), [
    first,
    {
      tourSlug: "second",
      salePrice: "",
      offerDescription: "",
      localizedOfferDescription: "",
    },
  ]);
  assert.deepEqual(addHotSalePromotion([first], " first "), [first]);
  assert.deepEqual(addHotSalePromotion([first], "  "), [first]);
});

test("updates one Hot Sales promotion without changing list order", () => {
  assert.deepEqual(
    updateHotSalePromotion([first, second], "second", {
      salePrice: " 149 ",
      offerDescription: " Last minute ",
    }),
    [
      first,
      {
        ...second,
        salePrice: " 149 ",
        offerDescription: " Last minute ",
      },
    ],
  );
});

test("trims Hot Sales values only when content crosses a persistence boundary", () => {
  const content = {
    [HOT_SALES_DATA_KEY]: serializeHotSalePromotions([
      {
        ...first,
        salePrice: " 149 ",
        offerDescription: "Last ",
      },
    ]),
  };

  assert.equal(parseHotSalePromotions(content)[0]?.offerDescription, "Last ");
  assert.deepEqual(parseHotSalePromotions(normalizeHotSalesContent(content)), [
    {
      ...first,
      salePrice: "149",
      offerDescription: "Last",
    },
  ]);
});

test("moves and removes Hot Sales promotions by tour slug", () => {
  assert.deepEqual(
    moveHotSalePromotion([first, second], "second", "up").map(
      (promotion) => promotion.tourSlug,
    ),
    ["second", "first"],
  );
  assert.deepEqual(moveHotSalePromotion([first, second], "first", "up"), [
    first,
    second,
  ]);
  assert.deepEqual(removeHotSalePromotion([first, second], "first"), [second]);
});

test("shows the lowest Tour Library fare as read-only original price", () => {
  const record = {
    fares: {
      child: "",
      single: "$1,299",
      double: "CAD $899",
      triple: "$749.50",
      quad: "Call for quote",
    },
  } as TourRecord;

  assert.equal(getTourRecordOriginalPrice(record), "CAD $749.50");
  assert.equal(
    getTourRecordOriginalPrice({
      ...record,
      fares: { child: "", single: "", double: "", triple: "", quad: "" },
    }),
    null,
  );
});
