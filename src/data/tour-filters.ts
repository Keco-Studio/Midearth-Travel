import { categoryMeta } from "@/data/categories";
import { getRegionBySlug } from "@/data/regions";
import { tours, type Tour } from "@/data/tours";

const regionMap: Record<string, string[]> = {
  "north-america": ["Canada", "USA", "North America"],
  asia: ["Asia"],
  europe: ["Europe"],
  "sun-destinations": ["Sun Destinations", "Caribbean"],
};

export function getToursForCategory(slug: string): Tour[] {
  return filterToursForCategory(tours, slug);
}

export function filterToursForCategory(sourceTours: Tour[], slug: string): Tour[] {
  if (slug === "all") return sourceTours;

  return sourceTours.filter((tour) => tourMatchesCategory(tour, slug));
}

function tourMatchesCategory(tour: Tour, slug: string): boolean {
  if (Array.isArray(tour.destinationCategoryIds)) {
    return tour.destinationCategoryIds.includes(slug);
  }

  if (slug === "bus-tours") {
    return typeof tour.busTourPackage === "boolean"
      ? tour.busTourPackage
      : tour.tourType === "Bus Tour";
  }

  if (slug === "vacation-packages") {
    return typeof tour.vacationPackage === "boolean"
      ? tour.vacationPackage
      : tour.tourType === "Group Tour";
  }

  const meta = categoryMeta[slug];
  if (meta?.filterTourType) {
    return tour.tourType === meta.filterTourType;
  }

  const region = getRegionBySlug(slug);
  if (region) {
    const regions = regionMap[slug] ?? [];
    const aliases = new Set(
      [...regions, region.title].map((value) => value.trim().toLocaleLowerCase("en")),
    );

    if (aliases.has(tour.region.trim().toLocaleLowerCase("en"))) {
      return true;
    }

    return (
      slug === "sun-destinations" &&
      tour.tourType.trim().toLocaleLowerCase("en") === "sun destinations"
    );
  }

  return false;
}

export function getCategoryTourCount(sourceTours: Tour[], slug: string): number {
  return filterToursForCategory(sourceTours, slug).length;
}

export function getTourRegions(sourceTours: Tour[] = tours): string[] {
  return [...new Set(sourceTours.map((t) => t.region))].sort();
}

export function parseDurationDays(duration: string): number {
  const match = duration.match(/\d+/);
  return match ? parseInt(match[0], 10) : 0;
}

export function getTourPriceLabel(tour: Tour): string {
  if (tour.fares?.length) {
    const prices = tour.fares
      .map((f) => parseInt(f.price.replace(/[^0-9]/g, ""), 10))
      .filter((n) => !Number.isNaN(n));
    if (prices.length) {
      return `from $${Math.min(...prices)}`;
    }
  }
  return "Contact for price";
}
