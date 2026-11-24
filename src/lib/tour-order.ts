import type { TourRecord } from "../types/cms.ts";

export function parseTourOrderInput(value: unknown): string[] {
  if (!value || typeof value !== "object") {
    throw new Error("A valid tour order is required");
  }

  const orderedSlugs = (value as { orderedSlugs?: unknown }).orderedSlugs;
  if (
    !Array.isArray(orderedSlugs) ||
    orderedSlugs.length === 0 ||
    !orderedSlugs.every((slug) => typeof slug === "string" && slug.trim())
  ) {
    throw new Error("A valid tour order is required");
  }

  return orderedSlugs.map((slug) => slug.trim());
}

function hasDisplayOrder(record: TourRecord): boolean {
  return Number.isInteger(record.displayOrder) && (record.displayOrder ?? -1) >= 0;
}

export function orderTourRecords(records: readonly TourRecord[]): TourRecord[] {
  return records
    .map((record, index) => ({ record, index }))
    .sort((left, right) => {
      const leftHasOrder = hasDisplayOrder(left.record);
      const rightHasOrder = hasDisplayOrder(right.record);

      if (leftHasOrder && rightHasOrder) {
        return left.record.displayOrder! - right.record.displayOrder! || left.index - right.index;
      }
      if (leftHasOrder) return -1;
      if (rightHasOrder) return 1;
      return left.index - right.index;
    })
    .map(({ record }, displayOrder) => ({ ...record, displayOrder }));
}

export function applyTourSlugOrder(
  records: readonly TourRecord[],
  orderedSlugs: readonly string[],
): TourRecord[] {
  const bySlug = new Map(records.map((record) => [record.slug, record]));
  const uniqueSlugs = new Set(orderedSlugs);

  if (
    orderedSlugs.length !== records.length ||
    uniqueSlugs.size !== records.length ||
    orderedSlugs.some((slug) => !bySlug.has(slug))
  ) {
    throw new Error("Tour order must include every tour exactly once");
  }

  return orderedSlugs.map((slug, displayOrder) => ({
    ...bySlug.get(slug)!,
    displayOrder,
  }));
}

export function moveTourRecord(
  records: readonly TourRecord[],
  slug: string,
  offset: -1 | 1,
): TourRecord[] {
  const ordered = orderTourRecords(records);
  const index = ordered.findIndex((record) => record.slug === slug);
  const nextIndex = index + offset;

  if (index < 0 || nextIndex < 0 || nextIndex >= ordered.length) {
    return ordered;
  }

  [ordered[index], ordered[nextIndex]] = [ordered[nextIndex], ordered[index]];
  return ordered.map((record, displayOrder) => ({ ...record, displayOrder }));
}

export function moveTourRecordToPosition(
  records: readonly TourRecord[],
  slug: string,
  position: number,
): TourRecord[] {
  const ordered = orderTourRecords(records);
  if (!Number.isInteger(position) || position < 1 || position > ordered.length) {
    throw new RangeError(`Tour position must be between 1 and ${ordered.length}`);
  }

  const currentIndex = ordered.findIndex((record) => record.slug === slug);
  if (currentIndex < 0 || currentIndex === position - 1) return ordered;

  const [record] = ordered.splice(currentIndex, 1);
  ordered.splice(position - 1, 0, record);
  return ordered.map((entry, displayOrder) => ({ ...entry, displayOrder }));
}
