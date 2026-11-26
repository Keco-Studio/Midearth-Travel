import type { Tour } from "../data/tours.ts";
import { formatCadCents, parseCadPriceToCents } from "./cad-price.ts";
import type { ContentData } from "./content-values.ts";

export const HOT_SALES_DATA_KEY = "promotionsData";

export type HotSalePromotion = {
  tourSlug: string;
  salePrice: string;
  offerDescription: string;
  localizedOfferDescription: string;
};

export type ResolvedHotSalePromotion = HotSalePromotion & {
  tour: Tour;
  originalPrice: string | null;
  salePrice: string | null;
};

export class HotSalesPublishError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "HotSalesPublishError";
  }
}

export function parseHotSalePromotions(content: ContentData): HotSalePromotion[] {
  const serialized = content[HOT_SALES_DATA_KEY];
  if (typeof serialized !== "string") return [];

  try {
    const parsed = JSON.parse(serialized) as unknown;
    if (!Array.isArray(parsed)) return [];

    const seen = new Set<string>();
    return parsed.flatMap((value) => {
      const promotion = normalizePromotion(value);
      if (!promotion || seen.has(promotion.tourSlug)) return [];
      seen.add(promotion.tourSlug);
      return [promotion];
    });
  } catch {
    return [];
  }
}

export function serializeHotSalePromotions(
  promotions: readonly HotSalePromotion[],
): string {
  return JSON.stringify(promotions);
}

export function getTourOriginalPrice(tour: Pick<Tour, "fares">): string | null {
  const prices = (tour.fares ?? [])
    .map((fare) => parseCadPriceToCents(fare.price))
    .filter((price): price is number => price !== null);

  return prices.length > 0 ? formatCadCents(Math.min(...prices)) : null;
}

export function validateHotSalesForPublish(
  content: ContentData,
  tours: readonly Tour[],
): void {
  const toursBySlug = new Map(tours.map((tour) => [tour.slug, tour]));

  for (const promotion of parseHotSalePromotions(content)) {
    const tour = toursBySlug.get(promotion.tourSlug);
    if (!tour) {
      throw new HotSalesPublishError(
        `Hot Sales promotion must reference an existing tour: ${promotion.tourSlug}.`,
      );
    }

    if (
      !promotion.salePrice &&
      !promotion.offerDescription &&
      !promotion.localizedOfferDescription
    ) {
      throw new HotSalesPublishError(
        `${tour.title} needs a discounted price or offer description.`,
      );
    }

    if (!promotion.salePrice) continue;

    const saleCents = parseCadPriceToCents(promotion.salePrice);
    if (saleCents === null || saleCents <= 0) {
      throw new HotSalesPublishError(
        `${tour.title} needs a valid CAD discounted price.`,
      );
    }

    const originalPrice = getTourOriginalPriceCents(tour);
    if (originalPrice === null) {
      throw new HotSalesPublishError(
        `${tour.title} needs an original fare before adding a discounted price.`,
      );
    }
    if (saleCents >= originalPrice) {
      throw new HotSalesPublishError(
        `${tour.title} discounted price must be lower than its original fare.`,
      );
    }
  }
}

export function getPublishedHotSalePromotions(
  content: ContentData,
  tours: readonly Tour[],
): ResolvedHotSalePromotion[] {
  const toursBySlug = new Map(tours.map((tour) => [tour.slug, tour]));

  return parseHotSalePromotions(content).flatMap((promotion) => {
    const tour = toursBySlug.get(promotion.tourSlug);
    if (!tour) return [];

    const saleCents = promotion.salePrice
      ? parseCadPriceToCents(promotion.salePrice)
      : null;
    const originalCents = getTourOriginalPriceCents(tour);
    const hasDescription = Boolean(
      promotion.offerDescription || promotion.localizedOfferDescription,
    );
    const hasValidSale =
      saleCents !== null &&
      saleCents > 0 &&
      originalCents !== null &&
      saleCents < originalCents;

    if (!hasDescription && !hasValidSale) return [];

    return [
      {
        ...promotion,
        tour,
        originalPrice:
          originalCents === null ? null : formatCadCents(originalCents),
        salePrice: hasValidSale ? formatCadCents(saleCents) : null,
      },
    ];
  });
}

function normalizePromotion(value: unknown): HotSalePromotion | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const raw = value as Record<string, unknown>;
  const tourSlug = typeof raw.tourSlug === "string" ? raw.tourSlug.trim() : "";
  if (!tourSlug) return null;

  return {
    tourSlug,
    salePrice: typeof raw.salePrice === "string" ? raw.salePrice.trim() : "",
    offerDescription:
      typeof raw.offerDescription === "string"
        ? raw.offerDescription.trim()
        : "",
    localizedOfferDescription:
      typeof raw.localizedOfferDescription === "string"
        ? raw.localizedOfferDescription.trim()
        : "",
  };
}

function getTourOriginalPriceCents(tour: Pick<Tour, "fares">): number | null {
  const prices = (tour.fares ?? [])
    .map((fare) => parseCadPriceToCents(fare.price))
    .filter((price): price is number => price !== null);
  return prices.length > 0 ? Math.min(...prices) : null;
}
