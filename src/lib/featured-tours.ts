export const FEATURED_TOUR_SLUGS_KEY = "featuredSlugs";
export const MAX_FEATURED_TOURS = 4;

export function serializeFeaturedSlugs(slugs: string[]): string {
  return JSON.stringify(slugs);
}

export function parseFeaturedSlugs(value: unknown): string[] {
  if (typeof value !== "string" || !value.trim()) return [];

  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((entry): entry is string => typeof entry === "string")
      .map((slug) => slug.trim())
      .filter(Boolean)
      .slice(0, MAX_FEATURED_TOURS);
  } catch {
    return value
      .split(/[\n,]+/)
      .map((slug) => slug.trim())
      .filter(Boolean)
      .slice(0, MAX_FEATURED_TOURS);
  }
}

export function pickFeaturedTours<T extends { slug: string; featured?: boolean }>(
  tours: readonly T[],
  featuredSlugs: readonly string[],
): T[] {
  if (featuredSlugs.length > 0) {
    const bySlug = new Map(tours.map((tour) => [tour.slug, tour]));
    return featuredSlugs
      .map((slug) => bySlug.get(slug))
      .filter((tour): tour is T => Boolean(tour));
  }

  return tours.filter((tour) => tour.featured);
}
