import {
  destinationCategorySeeds,
  type DestinationCategory,
} from "@/lib/destination-categories";
import type { TourRecord } from "@/types/cms";

const regionAliasToId: Record<string, string> = {
  "north america": "north-america",
  canada: "north-america",
  usa: "north-america",
  asia: "asia",
  europe: "europe",
  "sun destinations": "sun-destinations",
  caribbean: "sun-destinations",
};

/** Infer Where to Go category ids from legacy region / package flags. */
export function deriveDestinationCategoryIds(
  record: Pick<TourRecord, "region" | "tourType" | "busTourPackage" | "vacationPackage">,
): string[] {
  const ids: string[] = [];
  const regionId = regionAliasToId[record.region.trim().toLocaleLowerCase("en")];
  if (regionId) ids.push(regionId);

  if (record.tourType.trim().toLocaleLowerCase("en") === "sun destinations") {
    ids.push("sun-destinations");
  }
  if (record.busTourPackage) ids.push("bus-tours");
  if (record.vacationPackage) ids.push("vacation-packages");

  return uniqueIds(ids);
}

export function resolveTourDestinationCategoryIds(
  record: Pick<TourRecord, "region" | "tourType" | "busTourPackage" | "vacationPackage"> & {
    destinationCategoryIds?: string[] | null;
  },
): string[] {
  if (Array.isArray(record.destinationCategoryIds)) {
    return uniqueIds(record.destinationCategoryIds);
  }
  return deriveDestinationCategoryIds(record);
}

/** Keep legacy flags + region in sync with Destination names switches. */
export function applyDestinationCategoryAssignments(
  record: TourRecord,
  categories: readonly DestinationCategory[],
): TourRecord {
  const ids = uniqueIds(record.destinationCategoryIds ?? []);
  const selected = categories.filter((category) => ids.includes(category.id));
  const regionCategory = selected.find((category) => category.kind === "route");

  return {
    ...record,
    destinationCategoryIds: ids,
    busTourPackage: ids.includes("bus-tours"),
    vacationPackage: ids.includes("vacation-packages"),
    region: regionCategory?.titleEn ?? selected[0]?.titleEn ?? record.region,
  };
}

/** Live badge text from Destination names (falls back to stored region). */
export function getTourRegionBadge(
  tour: Pick<TourRecord, "region" | "destinationCategoryIds" | "tourType" | "busTourPackage" | "vacationPackage"> | {
    region: string;
    destinationCategoryIds?: string[];
    tourType?: string;
    busTourPackage?: boolean;
    vacationPackage?: boolean;
  },
  categories: readonly DestinationCategory[] = destinationCategorySeeds,
): string {
  const ids =
    Array.isArray(tour.destinationCategoryIds) && tour.destinationCategoryIds.length > 0
      ? uniqueIds(tour.destinationCategoryIds)
      : deriveDestinationCategoryIds({
          region: tour.region,
          tourType: tour.tourType ?? "",
          busTourPackage: tour.busTourPackage ?? false,
          vacationPackage: tour.vacationPackage ?? false,
        });

  if (ids.length > 0) {
    const matched = categories.filter((category) => ids.includes(category.id));
    const regionCategory = matched.find((category) => category.kind === "route");
    if (regionCategory?.titleEn.trim()) return regionCategory.titleEn.trim();
    if (matched[0]?.titleEn.trim()) return matched[0].titleEn.trim();
  }

  const regionLower = tour.region.trim().toLocaleLowerCase("en");

  const byCurrentTitle = categories.find(
    (category) => category.titleEn.trim().toLocaleLowerCase("en") === regionLower,
  );
  if (byCurrentTitle) return byCurrentTitle.titleEn.trim();

  // Old stored labels (e.g. "Sun Destinations") → current Destination names title
  const seedMatch = destinationCategorySeeds.find(
    (seed) => seed.titleEn.trim().toLocaleLowerCase("en") === regionLower,
  );
  if (seedMatch) {
    const live = categories.find((category) => category.id === seedMatch.id);
    if (live?.titleEn.trim()) return live.titleEn.trim();
  }

  const aliasId = regionAliasToId[regionLower];
  if (aliasId) {
    const byAlias = categories.find((category) => category.id === aliasId);
    if (byAlias?.titleEn.trim()) return byAlias.titleEn.trim();
  }

  return tour.region.trim();
}

function uniqueIds(ids: readonly string[]): string[] {
  return [...new Set(ids.map((id) => id.trim()).filter(Boolean))];
}
