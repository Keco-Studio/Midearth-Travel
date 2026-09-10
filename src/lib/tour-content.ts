import { tourSeeds } from "../data/cms-seed.ts";
import { tours, type Tour, type TourFare, type TourPolicy } from "../data/tours.ts";
import type { ContentStatus, TourRecord } from "../types/cms.ts";
import { parseItineraryFromRichText, hasDayByDayHeading } from "./tour-itinerary-parser.ts";
import { richTextToPlainText } from "./rich-text-content.ts";
import { resolveTourDestinationCategoryIds } from "./tour-destination-categories.ts";
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
  galleryImages: "",
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
  return hasDayByDayHeading(text);
}

function resolvePublicDescription(
  record: TourRecord,
  base: Tour | undefined,
  seed: TourRecord | undefined,
): string {
  const plain = richTextToPlainText(record.description);

  if (isItineraryDescription(plain)) {
    // Day-by-day HTML belongs in itinerary; keep a short card/meta blurb instead.
    return base?.description || splitList(record.highlights).join(" · ") || "";
  }

  const descriptionChanged = seed ? record.description !== seed.description : true;
  if (descriptionChanged) {
    return plain || base?.description || "";
  }

  return base?.description ?? plain;
}

export function resolvePdfUrl(fileName: string): string | undefined {
  const trimmed = fileName.trim();
  if (!trimmed) return undefined;
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("/")
  ) {
    return trimmed;
  }
  return `/pdfs/${encodeURIComponent(trimmed)}`;
}

export function mapTourRecordToPublicTour(record: TourRecord): Tour {
  const base = tours.find((tour) => tour.slug === record.slug);
  const seed = tourSeeds.find((tour) => tour.slug === record.slug);
  const description = resolvePublicDescription(record, base, seed);
  const highlights = splitList(record.highlights);
  const localizedHighlights = splitList(record.localizedHighlights);
  const departures = splitList(record.departures);
  const localizedDepartures = splitList(record.localizedDepartures);
  const included = splitList(record.included);
  const localizedIncluded = splitList(record.localizedIncluded);
  const notIncluded = splitList(record.notIncluded);
  const localizedNotIncluded = splitList(record.localizedNotIncluded);
  const policies = mapPolicies(record);
  const fares = mapFares(record);
  const importedItinerary = parseItineraryFromRichText(record.description);
  const itinerary =
    importedItinerary.length > 0
      ? importedItinerary
      : base?.itinerary && base.itinerary.length > 0
        ? base.itinerary
        : [];
  const galleryUrls = record.galleryImages
    .split(/\r?\n/)
    .map((url) => url.trim())
    .filter(Boolean);
  const gallery =
    galleryUrls.length > 0
      ? [
          record.image,
          ...galleryUrls.filter((url) => url !== record.image),
        ].filter((url, index, all) => all.indexOf(url) === index)
      : base?.gallery?.length
        ? [
            record.image,
            ...base.gallery.filter(
              (image) => image !== base.image && image !== record.image,
            ),
          ]
        : [record.image];

  return {
    ...base,
    slug: record.slug,
    code: record.code || undefined,
    title: record.title,
    pageTitle: record.title,
    localizedTitle: record.localizedTitle.trim() || undefined,
    region: record.region,
    subregion: record.subregion.trim() || undefined,
    duration: record.duration,
    localizedDuration: record.localizedDuration.trim() || undefined,
    description,
    localizedDescription:
      richTextToPlainText(record.localizedDescription).trim() || undefined,
    image: record.image,
    tags: highlights.length > 0 ? highlights : base?.tags ?? [],
    tourType: record.tourType,
    departureCity: record.departureCity || undefined,
    localizedDepartureCity: record.localizedDepartureCity.trim() || undefined,
    departures: departures.length > 0 ? departures : undefined,
    localizedDepartures:
      localizedDepartures.length > 0 ? localizedDepartures : undefined,
    highlights: highlights.length > 0 ? highlights : undefined,
    localizedHighlights:
      localizedHighlights.length > 0 ? localizedHighlights : undefined,
    itinerary: itinerary.length > 0 ? itinerary : undefined,
    essentials: {
      departureTime: record.essentials.departureTime,
      meetingPlace: record.essentials.meetingPlace,
      ...(record.essentials.localizedMeetingPlace.trim()
        ? { localizedMeetingPlace: record.essentials.localizedMeetingPlace.trim() }
        : {}),
      hotels: record.essentials.hotels,
      ...(record.essentials.localizedHotels.trim()
        ? { localizedHotels: record.essentials.localizedHotels.trim() }
        : {}),
      escortedCoach: record.essentials.escortedCoach,
      ...(record.essentials.localizedEscortedCoach.trim()
        ? {
            localizedEscortedCoach:
              record.essentials.localizedEscortedCoach.trim(),
          }
        : {}),
    },
    policies: policies.length > 0 ? policies : undefined,
    included,
    localizedIncluded:
      localizedIncluded.length > 0 ? localizedIncluded : undefined,
    notIncluded,
    localizedNotIncluded:
      localizedNotIncluded.length > 0 ? localizedNotIncluded : undefined,
    fares: fares.length > 0 ? fares : undefined,
    featured: record.specialOffer,
    hotSale: record.specialDeals,
    busTourPackage: record.busTourPackage,
    vacationPackage: record.vacationPackage,
    destinationCategoryIds: resolveTourDestinationCategoryIds(record),
    gallery,
    pdfTitle: record.pdfTitle.trim() || undefined,
    localizedPdfTitle: record.localizedPdfTitle.trim() || undefined,
    pdfUrl: resolvePdfUrl(record.pdfFileName),
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
