import type { Tour } from "../data/tours.ts";
import type { ContentData } from "./content-values.ts";

export const TOP_PICKS_DATA_KEY = "selectedToursData";

export type TopPickMoveDirection = "up" | "down";

export function hasTopPickSelection(content: ContentData): boolean {
  return typeof content[TOP_PICKS_DATA_KEY] === "string";
}

export function parseTopPickSlugs(content: ContentData): string[] {
  const value = content[TOP_PICKS_DATA_KEY];
  if (typeof value !== "string") return [];

  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return [];
    return uniqueSlugs(parsed);
  } catch {
    return [];
  }
}

export function serializeTopPickSlugs(slugs: readonly string[]): string {
  return JSON.stringify(uniqueSlugs(slugs));
}

export function addTopPickSlug(
  slugs: readonly string[],
  tourSlug: string,
): string[] {
  return uniqueSlugs([...slugs, tourSlug]);
}

export function removeTopPickSlug(
  slugs: readonly string[],
  tourSlug: string,
): string[] {
  const normalizedSlug = tourSlug.trim();
  return uniqueSlugs(slugs).filter((slug) => slug !== normalizedSlug);
}

export function moveTopPickSlug(
  slugs: readonly string[],
  tourSlug: string,
  direction: TopPickMoveDirection,
): string[] {
  const next = uniqueSlugs(slugs);
  const currentIndex = next.indexOf(tourSlug.trim());
  const nextIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

  if (currentIndex < 0 || nextIndex < 0 || nextIndex >= next.length) {
    return next;
  }

  [next[currentIndex], next[nextIndex]] = [next[nextIndex], next[currentIndex]];
  return next;
}

export function resolveTopPickTours(
  content: ContentData,
  tours: readonly Tour[],
): Tour[] {
  if (!hasTopPickSelection(content)) {
    return tours.filter((tour) => tour.featured);
  }

  const toursBySlug = new Map(tours.map((tour) => [tour.slug, tour]));
  return parseTopPickSlugs(content).flatMap((slug) => {
    const tour = toursBySlug.get(slug);
    return tour ? [tour] : [];
  });
}

function uniqueSlugs(values: readonly unknown[]): string[] {
  const seen = new Set<string>();
  return values.flatMap((value) => {
    if (typeof value !== "string") return [];
    const slug = value.trim();
    if (!slug || seen.has(slug)) return [];
    seen.add(slug);
    return [slug];
  });
}
