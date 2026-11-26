import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import postcss, { type Rule } from "postcss";
import type { Tour } from "../src/data/tours.ts";
import { destinationCategorySeeds } from "../src/lib/destination-categories.ts";
import {
  getHotSaleDescription,
  getHotSalePricePresentation,
  getHotSaleRegionBadge,
  getPublishedHotSalePromotions,
  serializeHotSalePromotions,
} from "../src/lib/hot-sales.ts";

const cardCss = postcss.parse(
  readFileSync(
    new URL("../src/components/packages-section.module.css", import.meta.url),
    "utf8",
  ),
);

function cardDeclarationsFor(selector: string): Map<string, string> {
  const rule = cardCss.nodes.find(
    (node): node is Rule => node.type === "rule" && node.selector === selector,
  );

  assert.ok(rule, `expected ${selector} CSS rule`);

  return new Map(
    rule.nodes.flatMap((node) =>
      node.type === "decl" ? [[node.prop, node.value] as const] : [],
    ),
  );
}

const tour: Tour = {
  slug: "cruise",
  title: "Coastal Cruise",
  region: "Europe",
  duration: "8 days",
  description: "A coastal cruise",
  image: "/cruise.jpg",
  tags: [],
  tourType: "Cruise",
  fares: [{ label: "Double", price: "$1,299" }],
};

test("presents original and discounted prices only for numeric promotions", () => {
  const [promotion] = getPublishedHotSalePromotions(
    {
      promotionsData: serializeHotSalePromotions([
        {
          tourSlug: "cruise",
          salePrice: "999",
          offerDescription: "Last minute",
          localizedOfferDescription: "尾单优惠",
        },
      ]),
    },
    [tour],
  );

  assert.deepEqual(getHotSalePricePresentation(promotion!), {
    originalPrice: "CAD $1,299.00",
    salePrice: "CAD $999.00",
    strikeOriginalPrice: true,
  });
});

test("keeps the normal price unstruck for description-only promotions", () => {
  const [promotion] = getPublishedHotSalePromotions(
    {
      promotionsData: serializeHotSalePromotions([
        {
          tourSlug: "cruise",
          salePrice: "",
          offerDescription: "3rd & 4th guests 50% off",
          localizedOfferDescription: "第三、四人半价",
        },
      ]),
    },
    [tour],
  );

  assert.deepEqual(getHotSalePricePresentation(promotion!), {
    originalPrice: "CAD $1,299.00",
    salePrice: null,
    strikeOriginalPrice: false,
  });
  assert.equal(getHotSaleDescription(promotion!, "en"), "3rd & 4th guests 50% off");
  assert.equal(getHotSaleDescription(promotion!, "zh"), "第三、四人半价");
});

test("uses the same live localized region badge as the standard tour cards", () => {
  const categories = destinationCategorySeeds.map((category) =>
    category.id === "europe"
      ? {
          ...category,
          titleEn: "European Escapes",
          titleZh: "欧洲精选",
        }
      : category,
  );
  const promotionalTour: Tour = {
    ...tour,
    destinationCategoryIds: ["europe"],
  };

  assert.equal(
    getHotSaleRegionBadge(promotionalTour, categories, "en"),
    "European Escapes",
  );
  assert.equal(
    getHotSaleRegionBadge(promotionalTour, categories, "zh"),
    "欧洲精选",
  );
});

test("positions the Hot Sales region badge at the image's top-right corner", () => {
  const imageLink = cardDeclarationsFor(".imageLink");
  const regionBadge = cardDeclarationsFor(".regionBadge");

  assert.equal(imageLink.get("position"), "relative");
  assert.equal(regionBadge.get("position"), "absolute");
  assert.equal(regionBadge.get("top"), "14px");
  assert.equal(regionBadge.get("right"), "14px");
  assert.equal(regionBadge.has("left"), false);
});
