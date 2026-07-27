import { tourSeeds } from "../data/cms-seed.ts";
import { tours, type Tour, type TourFare, type TourPolicy } from "../data/tours.ts";
import type { ContentStatus, TourRecord } from "../types/cms.ts";
import { richTextToPlainText } from "./rich-text-content.ts";
import { validateTourEditorRecord } from "./tour-editor-state.ts";

export type TourRow = {
  slug: string;
  status: ContentStatus;
  data: TourRecord;
  updated_at: string;
};

const emptyFareFields: TourRecord["fares"] = {
  child: "",
  single: "",
  double: "",
  triple: "",
  quad: "",
};

const emptyEssentialFields: TourRecord["essentials"] = {
  departureTime: "",
  meetingPlace: "",
  localizedMeetingPlace: "",
  hotels: "",
  localizedHotels: "",
  escortedCoach: "",
  localizedEscortedCoach: "",
};

const emptyTourDetailFields = {
  departureCity: "",
  localizedDepartureCity: "",
  admissions: "",
  localizedAdmissions: "",
  cancellation: "",
  localizedCancellation: "",
  importantNotice: "",
  localizedImportantNotice: "",
  included: "",
  localizedIncluded: "",
  notIncluded: "",
  localizedNotIncluded: "",
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

export function isItineraryDescription(text: string): boolean {
  return /Day\s+\d+:/i.test(text);
}

function resolvePublicDescription(
  record: TourRecord,
  base: Tour | undefined,
  seed: TourRecord | undefined,
): string {
  const plain = richTextToPlainText(record.description);

  if (isItineraryDescription(plain)) {
    return base?.description ?? "";
  }

  const descriptionChanged = seed ? record.description !== seed.description : true;
  if (descriptionChanged) {
    return plain || base?.description || "";
  }

  return base?.description ?? plain;
}

export function mapTourRecordToPublicTour(record: TourRecord): Tour {
  const base = tours.find((tour) => tour.slug === record.slug);
  const seed = tourSeeds.find((tour) => tour.slug === record.slug);
  const description = resolvePublicDescription(record, base, seed);
  const highlights = splitList(record.highlights);
  const departures = splitList(record.departures);
  const included = splitList(record.included);
  const notIncluded = splitList(record.notIncluded);
  const policies = mapPolicies(record);
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
    departureCity: record.departureCity || undefined,
    departures: departures.length > 0 ? departures : undefined,
    highlights: highlights.length > 0 ? highlights : undefined,
    essentials: {
      departureTime: record.essentials.departureTime,
      meetingPlace: record.essentials.meetingPlace,
      hotels: record.essentials.hotels,
      escortedCoach: record.essentials.escortedCoach,
    },
    policies: policies.length > 0 ? policies : undefined,
    included,
    notIncluded,
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
  const storedData = row.data as Partial<TourRecord>;
  const candidate = {
    ...emptyTourDetailFields,
    ...(fallback ?? {}),
    ...storedData,
    slug: row.slug,
    status: row.status,
    updatedAt: row.updated_at,
    fares: { ...emptyFareFields, ...fallback?.fares, ...storedData.fares },
    essentials: {
      ...emptyEssentialFields,
      ...fallback?.essentials,
      ...storedData.essentials,
    },
  } as TourRecord;
  const validation = validateTourEditorRecord(candidate);
  return validation.ok ? validation.value : fallback ? cloneTourRecord(fallback) : null;
}

function cloneTourRecord(record: TourRecord): TourRecord {
  return {
    ...record,
    essentials: { ...record.essentials },
    fares: { ...record.fares },
  };
}

function splitList(value: string): string[] {
  return value
    .split(/[,\n]/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function mapPolicies(record: TourRecord): TourPolicy[] {
  const policies: TourPolicy[] = [
    {
      title: "Admissions",
      content: record.admissions,
      icon: "ticket",
    },
    {
      title: "Cancellation",
      content: record.cancellation,
      icon: "shield",
    },
    {
      title: "Important notice",
      content: record.importantNotice,
      icon: "info",
      wide: true,
    },
  ];

  return policies.filter((policy) => Boolean(policy.content.trim()));
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
