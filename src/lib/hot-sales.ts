import type { Tour } from "../data/tours.ts";
import { formatCadCents, parseCadPriceToCents } from "./cad-price.ts";
import type { ContentData } from "./content-values.ts";
import {
  destinationCategorySeeds,
  type DestinationCategory,
} from "./destination-categories.ts";
import { getTourRegionBadge } from "./tour-destination-categories.ts";
import type { TourRecord } from "../types/cms.ts";

export const HOT_SALES_DATA_KEY = "promotionsData";

export type HotSalePromotion = {
  tourSlug: string;
  salePrice: string;
  offerDescription: string;
  localizedOfferDescription: string;
};

export type ResolvedHotSalePromotion = Omit<HotSalePromotion, "salePrice"> & {
  tour: Tour;
  originalPrice: string | null;
  salePrice: string | null;
};

export type HotSaleMoveDirection = "up" | "down";

export type HotSalePricePresentation = {
  originalPrice: string | null;
  salePrice: string | null;
  strikeOriginalPrice: boolean;
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

export function normalizeHotSalesContent(content: ContentData): ContentData {
  const promotions = parseHotSalePromotions(content).map((promotion) => ({
    ...promotion,
    salePrice: promotion.salePrice.trim(),
    offerDescription: promotion.offerDescription.trim(),
    localizedOfferDescription: promotion.localizedOfferDescription.trim(),
  }));

  return {
    ...content,
    [HOT_SALES_DATA_KEY]: serializeHotSalePromotions(promotions),
  };
}

export function addHotSalePromotion(
  promotions: readonly HotSalePromotion[],
  tourSlug: string,
): HotSalePromotion[] {
  const normalizedSlug = tourSlug.trim();
  if (
    !normalizedSlug ||
    promotions.some((promotion) => promotion.tourSlug === normalizedSlug)
  ) {
    return [...promotions];
  }

  return [
    ...promotions,
    {
      tourSlug: normalizedSlug,
      salePrice: "",
      offerDescription: "",
      localizedOfferDescription: "",
    },
  ];
}

export function updateHotSalePromotion(
  promotions: readonly HotSalePromotion[],
  tourSlug: string,
  patch: Partial<Omit<HotSalePromotion, "tourSlug">>,
): HotSalePromotion[] {
  return promotions.map((promotion) =>
    promotion.tourSlug === tourSlug
      ? {
          ...promotion,
          ...normalizePromotionPatch(patch),
        }
      : promotion,
  );
}

export function moveHotSalePromotion(
  promotions: readonly HotSalePromotion[],
  tourSlug: string,
  direction: HotSaleMoveDirection,
): HotSalePromotion[] {
  const currentIndex = promotions.findIndex(
    (promotion) => promotion.tourSlug === tourSlug,
  );
  const nextIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
  if (
    currentIndex < 0 ||
    nextIndex < 0 ||
    nextIndex >= promotions.length
  ) {
    return [...promotions];
  }

  const next = [...promotions];
  [next[currentIndex], next[nextIndex]] = [next[nextIndex], next[currentIndex]];
  return next;
}

export function removeHotSalePromotion(
  promotions: readonly HotSalePromotion[],
  tourSlug: string,
): HotSalePromotion[] {
  return promotions.filter((promotion) => promotion.tourSlug !== tourSlug);
}

export function getTourRecordOriginalPrice(
  tour: Pick<TourRecord, "fares">,
): string | null {
  const prices = Object.values(tour.fares)
    .map(parseCadPriceToCents)
    .filter((price): price is number => price !== null);
  return prices.length > 0 ? formatCadCents(Math.min(...prices)) : null;
}

export function getTourOriginalPrice(tour: Pick<Tour, "fares">): string | null {
  const prices = (tour.fares ?? [])
    .map((fare) => parseCadPriceToCents(fare.price))
    .filter((price): price is number => price !== null);

  return prices.length > 0 ? formatCadCents(Math.min(...prices)) : null;
}

export function getHotSaleRegionBadge(
  tour: Tour,
  categories: readonly DestinationCategory[] = destinationCategorySeeds,
  lang: "en" | "zh" = "en",
): string {
  return getTourRegionBadge(tour, categories, lang);
}

export function validateTourRecordHotSale(
  tour: Pick<
    TourRecord,
    | "title"
    | "specialDeals"
    | "salePrice"
    | "hotSaleDescription"
    | "localizedHotSaleDescription"
    | "fares"
  >,
): void {
  if (!tour.specialDeals) return;

  const salePrice = tour.salePrice.trim();
  const hasDescription = Boolean(
    tour.hotSaleDescription.trim() || tour.localizedHotSaleDescription.trim(),
  );
  if (!salePrice && !hasDescription) {
    throw new HotSalesPublishError(
      `${tour.title} needs a discounted price or offer description.`,
    );
  }
  if (!salePrice) return;

  const saleCents = parseCadPriceToCents(salePrice);
  if (saleCents === null || saleCents <= 0) {
    throw new HotSalesPublishError(
      `${tour.title} needs a valid CAD discounted price.`,
    );
  }

  const originalPrice = Object.values(tour.fares)
    .map(parseCadPriceToCents)
    .filter((price): price is number => price !== null)
    .reduce<number | null>(
      (lowest, price) => (lowest === null ? price : Math.min(lowest, price)),
      null,
    );
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

    const salePrice = promotion.salePrice.trim();
    const offerDescription = promotion.offerDescription.trim();
    const localizedOfferDescription =
      promotion.localizedOfferDescription.trim();
    if (!salePrice && !offerDescription && !localizedOfferDescription) {
      throw new HotSalesPublishError(
        `${tour.title} needs a discounted price or offer description.`,
      );
    }

    if (!salePrice) continue;

    const saleCents = parseCadPriceToCents(salePrice);
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

    const salePrice = promotion.salePrice.trim();
    const offerDescription = promotion.offerDescription.trim();
    const localizedOfferDescription =
      promotion.localizedOfferDescription.trim();
    const saleCents = salePrice
      ? parseCadPriceToCents(salePrice)
      : null;
    const originalCents = getTourOriginalPriceCents(tour);
    const hasDescription = Boolean(
      offerDescription || localizedOfferDescription,
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
        offerDescription,
        localizedOfferDescription,
        tour,
        originalPrice:
          originalCents === null ? null : formatCadCents(originalCents),
        salePrice: hasValidSale ? formatCadCents(saleCents) : null,
      },
    ];
  });
}

export function getHotSalePricePresentation(
  promotion: ResolvedHotSalePromotion,
): HotSalePricePresentation {
  return {
    originalPrice: promotion.originalPrice,
    salePrice: promotion.salePrice,
    strikeOriginalPrice: Boolean(
      promotion.originalPrice && promotion.salePrice,
    ),
  };
}

export function getHotSaleDescription(
  promotion: ResolvedHotSalePromotion,
  lang: "en" | "zh",
): string {
  return lang === "zh"
    ? promotion.localizedOfferDescription || promotion.offerDescription
    : promotion.offerDescription || promotion.localizedOfferDescription;
}

function normalizePromotion(value: unknown): HotSalePromotion | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const raw = value as Record<string, unknown>;
  const tourSlug = typeof raw.tourSlug === "string" ? raw.tourSlug.trim() : "";
  if (!tourSlug) return null;

  return {
    tourSlug,
    salePrice: typeof raw.salePrice === "string" ? raw.salePrice : "",
    offerDescription:
      typeof raw.offerDescription === "string"
        ? raw.offerDescription
        : "",
    localizedOfferDescription:
      typeof raw.localizedOfferDescription === "string"
        ? raw.localizedOfferDescription
        : "",
  };
}

function normalizePromotionPatch(
  patch: Partial<Omit<HotSalePromotion, "tourSlug">>,
): Partial<Omit<HotSalePromotion, "tourSlug">> {
  return { ...patch };
}

function getTourOriginalPriceCents(tour: Pick<Tour, "fares">): number | null {
  const prices = (tour.fares ?? [])
    .map((fare) => parseCadPriceToCents(fare.price))
    .filter((price): price is number => price !== null);
  return prices.length > 0 ? Math.min(...prices) : null;
}
