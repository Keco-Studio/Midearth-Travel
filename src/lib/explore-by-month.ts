import {
  destinationsByMonth,
  type MonthDestination,
  type MonthEntry,
} from "../data/destinations-by-month.ts";

export const EXPLORE_MONTHS_DATA_KEY = "monthsData";

export type ExploreTourLookup = {
  slug: string;
  title: string;
  region: string;
  tourType: string;
  image: string;
};

export function serializeMonthEntries(entries: MonthEntry[]): string {
  return JSON.stringify(entries);
}

export function parseMonthEntries(value: unknown): MonthEntry[] {
  if (typeof value !== "string" || !value.trim()) {
    return cloneMonths(destinationsByMonth);
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return cloneMonths(destinationsByMonth);
    }

    const months = parsed
      .map(normalizeMonthEntry)
      .filter((entry): entry is MonthEntry => Boolean(entry));

    return months.length > 0 ? months : cloneMonths(destinationsByMonth);
  } catch {
    return cloneMonths(destinationsByMonth);
  }
}

export function getExploreByMonthEntries(content: Record<string, unknown>): MonthEntry[] {
  return parseMonthEntries(content[EXPLORE_MONTHS_DATA_KEY]);
}

export function createEmptyDestination(): MonthDestination {
  return {
    id: createDestinationId(),
    tourSlug: "",
    desc: "",
    name: "",
    region: "",
    tag: "",
    image: "",
    href: "",
  };
}

/** Fill card fields from Tour Library when a tourSlug is set; keep legacy rows as-is. */
export function resolveExploreByMonthEntries(
  entries: MonthEntry[],
  tours: readonly ExploreTourLookup[],
): MonthEntry[] {
  const bySlug = new Map(tours.map((tour) => [tour.slug, tour]));

  return entries.map((month) => ({
    ...month,
    destinations: month.destinations.flatMap((dest) => {
      const slug = dest.tourSlug?.trim();
      if (!slug) {
        return dest.name?.trim() ? [dest] : [];
      }

      const tour = bySlug.get(slug);
      if (!tour) return [];

      return [
        {
          id: dest.id,
          tourSlug: slug,
          name: tour.title,
          region: tour.region,
          tag: tour.tourType,
          desc: dest.desc,
          image: tour.image || "/hero/hero-coast.jpg",
          href: `/tours/${tour.slug}`,
        },
      ];
    }),
  }));
}

function createDestinationId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `dest-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function normalizeMonthEntry(value: unknown): MonthEntry | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const entry = value as Partial<MonthEntry>;
  if (typeof entry.month !== "string" || typeof entry.label !== "string") return null;

  const destinations = Array.isArray(entry.destinations)
    ? entry.destinations
        .map(normalizeDestination)
        .filter((dest): dest is MonthDestination => Boolean(dest))
    : [];

  return {
    month: entry.month,
    label: entry.label,
    destinations,
  };
}

function normalizeDestination(value: unknown): MonthDestination | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const dest = value as Partial<MonthDestination> & { href?: string };
  const desc = typeof dest.desc === "string" ? dest.desc : "";
  const name = typeof dest.name === "string" ? dest.name : "";
  const href = typeof dest.href === "string" ? dest.href : "";
  const tourSlug =
    typeof dest.tourSlug === "string" && dest.tourSlug.trim()
      ? dest.tourSlug.trim()
      : extractTourSlugFromHref(href);

  if (!tourSlug && !name.trim()) return null;

  return {
    id:
      typeof dest.id === "string" && dest.id.trim()
        ? dest.id.trim()
        : createDestinationId(),
    tourSlug,
    name,
    region: typeof dest.region === "string" ? dest.region : "",
    tag: typeof dest.tag === "string" ? dest.tag : "",
    desc,
    image: typeof dest.image === "string" ? dest.image : "",
    href,
  };
}

function extractTourSlugFromHref(href: string): string {
  const match = href.trim().match(/^\/tours\/([^/?#]+)/);
  return match?.[1] ?? "";
}

function cloneMonths(entries: MonthEntry[]): MonthEntry[] {
  return entries.map((entry) => ({
    ...entry,
    destinations: entry.destinations.map((dest) => ({
      ...dest,
      id: dest.id?.trim() || createDestinationId(),
      tourSlug: dest.tourSlug?.trim() || extractTourSlugFromHref(dest.href ?? ""),
    })),
  }));
}
