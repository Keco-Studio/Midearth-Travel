import { tourSeeds } from "../data/cms-seed.ts";
import { tours, type Tour, type TourFare } from "../data/tours.ts";
import type { ContentStatus, TourRecord } from "../types/cms.ts";
import { richTextToPlainText } from "./rich-text-content.ts";
import { validateTourEditorRecord } from "./tour-editor-state.ts";

export type TourRow = {
  slug: string;
  status: ContentStatus;
  data: TourRecord;
  updated_at: string;
};

export function toTourRow(record: TourRecord): TourRow {
  return {
    slug: record.slug,
    status: record.status,
    data: record,
    updated_at: record.updatedAt,
  };
}

export function mergeTourRows(rows: readonly TourRow[]): TourRecord[] {
  const rowsBySlug = new Map(rows.map((row) => [row.slug, row]));
  const merged = tourSeeds.map((seed) => {
    const row = rowsBySlug.get(seed.slug);
    rowsBySlug.delete(seed.slug);
    return row
      ? normalizeStoredTour(row, seed) ?? cloneTourRecord(seed)
      : cloneTourRecord(seed);
  });

  for (const row of rowsBySlug.values()) {
    const normalized = normalizeStoredTour(row);
    if (normalized) {
      merged.push(normalized);
    }
  }

  return merged;
}

export function mapTourRecordToPublicTour(record: TourRecord): Tour {
  const base = tours.find((tour) => tour.slug === record.slug);
  const seed = tourSeeds.find((tour) => tour.slug === record.slug);
  const descriptionChanged = seed ? record.description !== seed.description : true;
  const description = descriptionChanged
    ? richTextToPlainText(record.description) || base?.description || ""
    : base?.description ?? richTextToPlainText(record.description);
  const highlights = splitList(record.highlights);
  const departures = splitList(record.departures);
  const fares = mapFares(record);
  const gallery = base?.gallery?.length
    ? [record.image, ...base.gallery.filter((image) => image !== base.image && image !== record.image)]
    : [record.image];

  return {
    ...base,
    slug: record.slug,
    code: record.code || undefined,
    title: record.title,
    pageTitle: record.title,
    region: record.region,
    duration: record.duration,
    description,
    image: record.image,
    tags: highlights.length > 0 ? highlights : base?.tags ?? [],
    tourType: record.tourType,
    departures: departures.length > 0 ? departures : undefined,
    highlights: highlights.length > 0 ? highlights : undefined,
    fares: fares.length > 0 ? fares : undefined,
    featured: record.specialOffer,
    hotSale: record.specialDeals,
    gallery,
  };
}

function normalizeStoredTour(
  row: TourRow,
  fallback?: TourRecord,
): TourRecord | null {
  const candidate = {
    ...(fallback ?? row.data),
    ...row.data,
    slug: row.slug,
    status: row.status,
    updatedAt: row.updated_at,
    fares: { ...(fallback?.fares ?? row.data.fares), ...row.data.fares },
  };
  const validation = validateTourEditorRecord(candidate);
  return validation.ok ? validation.value : fallback ? cloneTourRecord(fallback) : null;
}

function cloneTourRecord(record: TourRecord): TourRecord {
  return { ...record, fares: { ...record.fares } };
}

function splitList(value: string): string[] {
  return value
    .split(/[,\n]/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function mapFares(record: TourRecord): TourFare[] {
  const values: Array<[string, string]> = [
    ["Quad", record.fares.quad],
    ["Triple", record.fares.triple],
    ["Double", record.fares.double],
    ["Single", record.fares.single],
    ["Child", record.fares.child],
  ];

  return values
    .filter((entry): entry is [string, string] => Boolean(entry[1].trim()))
    .map(([label, price]) => ({ label, price: price.trim() }));
}
