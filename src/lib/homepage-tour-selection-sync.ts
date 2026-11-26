import {
  assignTourToExploreMonth,
  findExploreMonthForTour,
  getExploreByMonthEntries,
  isExploreMonthKey,
  serializeMonthEntries,
  EXPLORE_MONTHS_DATA_KEY,
} from "./explore-by-month.ts";
import type { ContentData } from "./content-values.ts";
import {
  addTopPickSlug,
  parseTopPickSlugs,
  removeTopPickSlug,
  serializeTopPickSlugs,
  TOP_PICKS_DATA_KEY,
} from "./top-picks.ts";
import type { TourRecord } from "../types/cms.ts";

type TourSelectionSource = Pick<TourRecord, "slug" | "specialOffer"> & {
  exploreMonth?: unknown;
};

export type HomepageTourSelectionPatch = {
  kind: "projection";
  slug: string;
  data: Partial<
    Pick<
      TourRecord,
      "specialOffer" | "travelNewsPackage"
    > & { exploreMonth: string }
  >;
  updated_at: string;
};

export function syncHomepageSelectionsFromTour({
  topPicksContent,
  exploreContent,
  tour,
}: {
  topPicksContent: ContentData;
  exploreContent: ContentData;
  tour: TourSelectionSource;
}): { topPicksContent: ContentData; exploreContent: ContentData } {
  const currentTopPicks = parseTopPickSlugs(topPicksContent);
  const nextTopPicks = tour.specialOffer
    ? addTopPickSlug(currentTopPicks, tour.slug)
    : removeTopPickSlug(currentTopPicks, tour.slug);
  const exploreMonth = isExploreMonthKey(tour.exploreMonth)
    ? tour.exploreMonth
    : "";
  const nextMonths = assignTourToExploreMonth(
    getExploreByMonthEntries(exploreContent),
    tour.slug,
    exploreMonth,
  );

  return {
    topPicksContent: {
      ...topPicksContent,
      [TOP_PICKS_DATA_KEY]: serializeTopPickSlugs(nextTopPicks),
    },
    exploreContent: {
      ...exploreContent,
      [EXPLORE_MONTHS_DATA_KEY]: serializeMonthEntries(nextMonths),
    },
  };
}

export function createTopPicksTourPatches(
  content: ContentData,
  tours: readonly Pick<TourRecord, "slug">[],
  updatedAt: string,
): HomepageTourSelectionPatch[] {
  const selected = new Set(parseTopPickSlugs(content));
  return tours.map((tour) => ({
    kind: "projection",
    slug: tour.slug,
    data: { specialOffer: selected.has(tour.slug) },
    updated_at: updatedAt,
  }));
}

export function createExploreByMonthTourPatches(
  content: ContentData,
  tours: readonly Pick<TourRecord, "slug">[],
  updatedAt: string,
): HomepageTourSelectionPatch[] {
  const entries = getExploreByMonthEntries(content);
  return tours.map((tour) => {
    const exploreMonth = findExploreMonthForTour(entries, tour.slug);
    return {
      kind: "projection",
      slug: tour.slug,
      data: {
        exploreMonth,
        travelNewsPackage: Boolean(exploreMonth),
      },
      updated_at: updatedAt,
    };
  });
}
