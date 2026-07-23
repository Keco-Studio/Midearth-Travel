import { categoryMeta } from "@/data/categories";
import { getRegionBySlug } from "@/data/regions";
import { tours, type Tour } from "@/data/tours";

const regionMap: Record<string, string[]> = {
  "north-america": ["Canada", "USA"],
  asia: ["Asia"],
  europe: ["Europe"],
  "sun-destinations": [],
};

export function getToursForCategory(slug: string): Tour[] {
  return filterToursForCategory(tours, slug);
}

export function filterToursForCategory(sourceTours: Tour[], slug: string): Tour[] {
  if (slug === "all") return sourceTours;

  const meta = categoryMeta[slug];
  if (meta?.filterTourType) {
    return sourceTours.filter((t) => t.tourType === meta.filterTourType);
  }

  const region = getRegionBySlug(slug);
  if (region) {
    const regions = regionMap[slug];
    if (regions.length === 0) return [];
    return sourceTours.filter((t) => regions.includes(t.region));
  }

  return sourceTours;
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
