import type { TourRecord } from "../types/cms.ts";

export const TOUR_TYPE_STORAGE_KEY = "midearth-cms.tour-library.v1";
export const DEFAULT_TOUR_TYPES = ["Bus Tour", "Group Tour", "Sun Destinations"] as const;

export type TourTypeStorageState = {
  version: 1;
  customTypes: string[];
  overrides: Record<string, string>;
};

export type NewTourTypeValidation =
  | { ok: true; value: string }
  | { ok: false; reason: "required" | "duplicate" };

export function validateNewTourType(
  value: string,
  existingTypes: string[],
): NewTourTypeValidation {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    return { ok: false, reason: "required" };
  }

  const normalizedKey = normalizedValue.toLocaleLowerCase("en");
  const duplicateExists = existingTypes.some(
    (tourType) => tourType.trim().toLocaleLowerCase("en") === normalizedKey,
  );

  if (duplicateExists) {
    return { ok: false, reason: "duplicate" };
  }

  return { ok: true, value: normalizedValue };
}

export function parseTourTypeStorage(raw: string | null): TourTypeStorageState {
  if (!raw) {
    return createEmptyTourTypeStorageState();
  }

  try {
    const parsed: unknown = JSON.parse(raw);

    if (
      !isRecord(parsed) ||
      parsed.version !== 1 ||
      !Array.isArray(parsed.customTypes) ||
      !isRecord(parsed.overrides)
    ) {
      return createEmptyTourTypeStorageState();
    }

    const overrides = Object.entries(parsed.overrides).reduce<Record<string, string>>(
      (result, [slug, value]) => {
        if (typeof value === "string" && value.trim()) {
          result[slug] = value.trim();
        }
        return result;
      },
      {},
    );

    return {
      version: 1,
      customTypes: uniqueTourTypes(parsed.customTypes),
      overrides,
    };
  } catch {
    return createEmptyTourTypeStorageState();
  }
}

export function applyTourTypeOverrides(
  tours: TourRecord[],
  overrides: Record<string, string>,
): TourRecord[] {
  return tours.map((tour) => {
    const override = overrides[tour.slug]?.trim();

    return override ? { ...tour, tourType: override } : tour;
  });
}

export function getTourTypeOptions(tours: TourRecord[], customTypes: string[]): string[] {
  return uniqueTourTypes([
    ...DEFAULT_TOUR_TYPES,
    ...tours.map((tour) => tour.tourType),
    ...customTypes,
  ]);
}

export function buildTourTypeStorageState(
  sourceTours: TourRecord[],
  currentTours: TourRecord[],
  customTypes: string[],
): TourTypeStorageState {
  const sourceBySlug = new Map(sourceTours.map((tour) => [tour.slug, tour]));
  const overrides = currentTours.reduce<Record<string, string>>((result, tour) => {
    const sourceTour = sourceBySlug.get(tour.slug);
    const currentType = tour.tourType.trim();

    if (sourceTour && currentType && currentType !== sourceTour.tourType) {
      result[tour.slug] = currentType;
    }

    return result;
  }, {});

  return {
    version: 1,
    customTypes: uniqueTourTypes(customTypes),
    overrides,
  };
}

function createEmptyTourTypeStorageState(): TourTypeStorageState {
  return {
    version: 1,
    customTypes: [],
    overrides: {},
  };
}

function uniqueTourTypes(values: unknown[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    if (typeof value !== "string") {
      continue;
    }

    const normalizedValue = value.trim();
    const normalizedKey = normalizedValue.toLocaleLowerCase("en");

    if (!normalizedValue || seen.has(normalizedKey)) {
      continue;
    }

    seen.add(normalizedKey);
    result.push(normalizedValue);
  }

  return result;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
