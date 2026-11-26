import {
  addHotSalePromotion,
  HOT_SALES_DATA_KEY,
  parseHotSalePromotions,
  removeHotSalePromotion,
  serializeHotSalePromotions,
  updateHotSalePromotion,
} from "./hot-sales.ts";
import type { ContentData } from "./content-values.ts";
import type { TourRecord } from "../types/cms.ts";

export type HotSalesTourPatch = {
  kind: "promotion";
  slug: string;
  data: Pick<
    TourRecord,
    | "specialDeals"
    | "salePrice"
    | "hotSaleDescription"
    | "localizedHotSaleDescription"
  >;
  updated_at: string;
};

export function syncHotSalesContentFromTour(
  content: ContentData,
  tour: TourRecord,
): ContentData {
  const current = parseHotSalePromotions(content);
  const next = tour.specialDeals
    ? updateHotSalePromotion(
        addHotSalePromotion(current, tour.slug),
        tour.slug,
        {
          salePrice: tour.salePrice,
          offerDescription: tour.hotSaleDescription,
          localizedOfferDescription: tour.localizedHotSaleDescription,
        },
      )
    : removeHotSalePromotion(current, tour.slug);

  return {
    ...content,
    [HOT_SALES_DATA_KEY]: serializeHotSalePromotions(next),
  };
}

export function applyHotSalesContentToTourRecords(
  content: ContentData,
  tours: readonly TourRecord[],
): TourRecord[] {
  const promotionsBySlug = new Map(
    parseHotSalePromotions(content).map((promotion) => [
      promotion.tourSlug,
      promotion,
    ]),
  );

  return tours.map((tour) => {
    const promotion = promotionsBySlug.get(tour.slug);
    return {
      ...tour,
      specialDeals: Boolean(promotion),
      salePrice: promotion?.salePrice ?? "",
      hotSaleDescription: promotion?.offerDescription ?? "",
      localizedHotSaleDescription:
        promotion?.localizedOfferDescription ?? "",
    };
  });
}

export function createHotSalesTourPatches(
  content: ContentData,
  tours: readonly TourRecord[],
  updatedAt: string,
): HotSalesTourPatch[] {
  return applyHotSalesContentToTourRecords(content, tours).map((tour) => ({
    kind: "promotion",
    slug: tour.slug,
    data: {
      specialDeals: tour.specialDeals,
      salePrice: tour.salePrice,
      hotSaleDescription: tour.hotSaleDescription,
      localizedHotSaleDescription: tour.localizedHotSaleDescription,
    },
    updated_at: updatedAt,
  }));
}

export function createHotSalesContentFromTours(
  seedContent: ContentData,
  tours: readonly TourRecord[],
): ContentData {
  const promotions = tours
    .filter((tour) => tour.status === "published" && tour.specialDeals)
    .map((tour) => ({
      tourSlug: tour.slug,
      salePrice: tour.salePrice,
      offerDescription: tour.hotSaleDescription || "Limited-time offer",
      localizedOfferDescription:
        tour.localizedHotSaleDescription || "限时优惠",
    }));

  return {
    ...seedContent,
    [HOT_SALES_DATA_KEY]: serializeHotSalePromotions(promotions),
  };
}
