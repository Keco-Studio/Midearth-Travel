import type { TourRecord } from "../types/cms.ts";
import { resolveTourDestinationCategoryIds } from "./tour-destination-categories.ts";
import { normalizeRichText } from "./rich-text-content.ts";

export const TOUR_EDITOR_STORAGE_KEY = "midearth-cms.tour-editor.v1";

export type TourEditorStorage = {
  version: 1;
  records: TourRecord[];
};

type RequiredTourField = "title" | "slug" | "region" | "duration" | "tourType";

export type TourEditorValidation =
  | { ok: true; value: TourRecord }
  | { ok: false; errors: Partial<Record<RequiredTourField, string>> };

const stringFields = [
  "slug",
  "code",
  "title",
  "localizedTitle",
  "image",
  "region",
  "subregion",
  "duration",
  "localizedDuration",
  "tourType",
  "departureCity",
  "localizedDepartureCity",
  "departures",
  "localizedDepartures",
  "highlights",
  "localizedHighlights",
  "description",
  "localizedDescription",
  "admissions",
  "localizedAdmissions",
  "cancellation",
  "localizedCancellation",
  "importantNotice",
  "localizedImportantNotice",
  "included",
  "localizedIncluded",
  "notIncluded",
  "localizedNotIncluded",
  "pdfTitle",
  "localizedPdfTitle",
  "pdfFileName",
  "galleryImages",
  "updatedAt",
] as const satisfies readonly (keyof TourRecord)[];

const booleanFields = [
  "specialOffer",
  "specialDeals",
  "vacationPackage",
  "travelNewsPackage",
  "busTourPackage",
] as const satisfies readonly (keyof TourRecord)[];

const emptyStorage = (): TourEditorStorage => ({ version: 1, records: [] });

export function validateTourEditorRecord(record: TourRecord): TourEditorValidation {
  const value = trimTourRecord(record);
  const errors: Partial<Record<RequiredTourField, string>> = {};

  if (!value.title) errors.title = "Enter an English title";
  if (!value.slug) errors.slug = "Enter a slug";
  if (!value.region && value.destinationCategoryIds.length === 0) {
    errors.region = "Select at least one Where to Go category";
  }
  if (!value.duration) errors.duration = "Enter an English duration";
  if (!value.tourType) errors.tourType = "Select a tour type";

  return Object.keys(errors).length > 0 ? { ok: false, errors } : { ok: true, value };
}

export function parseTourEditorStorage(raw: string | null): TourEditorStorage {
  if (!raw) {
    return emptyStorage();
  }

  try {
    const value: unknown = JSON.parse(raw);

    if (!isRecord(value) || value.version !== 1 || !Array.isArray(value.records)) {
      return emptyStorage();
    }

    if (!value.records.every(isTourRecord)) {
      return emptyStorage();
    }

    return { version: 1, records: value.records };
  } catch {
    return emptyStorage();
  }
}

export function applyTourEditorRecords(
  sourceRecords: TourRecord[],
  savedRecords: TourRecord[],
): TourRecord[] {
  const savedBySlug = new Map(savedRecords.map((record) => [record.slug, record]));

  return sourceRecords.map((source) => savedBySlug.get(source.slug) ?? source);
}

export function buildTourEditorStorage(
  sourceRecords: TourRecord[],
  currentRecords: TourRecord[],
): TourEditorStorage {
  const currentBySlug = new Map(currentRecords.map((record) => [record.slug, record]));

  return {
    version: 1,
    records: sourceRecords.map((source) => {
      const current = currentBySlug.get(source.slug) ?? source;
      return {
        ...current,
        image: current.image.startsWith("blob:") ? source.image : current.image,
        essentials: { ...current.essentials },
        fares: { ...current.fares },
      };
    }),
  };
}

export function replaceTourEditorRecord(
  records: TourRecord[],
  updatedRecord: TourRecord,
): TourRecord[] {
  return records.map((record) =>
    record.slug === updatedRecord.slug ? updatedRecord : record,
  );
}

function trimTourRecord(record: TourRecord): TourRecord {
  const essentials = record.essentials ?? {
    departureTime: "",
    meetingPlace: "",
    localizedMeetingPlace: "",
    hotels: "",
    localizedHotels: "",
    escortedCoach: "",
    localizedEscortedCoach: "",
  };
  const fares = record.fares ?? {
    child: "",
    single: "",
    double: "",
    triple: "",
    quad: "",
  };

  return {
    ...record,
    slug: safeTrim(record.slug),
    code: safeTrim(record.code),
    title: safeTrim(record.title),
    localizedTitle: safeTrim(record.localizedTitle),
    image: safeTrim(record.image),
    region: safeTrim(record.region),
    subregion: safeTrim(record.subregion),
    duration: safeTrim(record.duration),
    localizedDuration: safeTrim(record.localizedDuration),
    tourType: safeTrim(record.tourType),
    departureCity: safeTrim(record.departureCity),
    localizedDepartureCity: safeTrim(record.localizedDepartureCity),
    departures: safeTrim(record.departures),
    localizedDepartures: safeTrim(record.localizedDepartures),
    highlights: safeTrim(record.highlights),
    localizedHighlights: safeTrim(record.localizedHighlights),
    description: normalizeRichText(record.description ?? ""),
    localizedDescription: normalizeRichText(record.localizedDescription ?? ""),
    admissions: safeTrim(record.admissions),
    localizedAdmissions: safeTrim(record.localizedAdmissions),
    cancellation: safeTrim(record.cancellation),
    localizedCancellation: safeTrim(record.localizedCancellation),
    importantNotice: safeTrim(record.importantNotice),
    localizedImportantNotice: safeTrim(record.localizedImportantNotice),
    included: safeTrim(record.included),
    localizedIncluded: safeTrim(record.localizedIncluded),
    notIncluded: safeTrim(record.notIncluded),
    localizedNotIncluded: safeTrim(record.localizedNotIncluded),
    essentials: {
      departureTime: safeTrim(essentials.departureTime),
      meetingPlace: safeTrim(essentials.meetingPlace),
      localizedMeetingPlace: safeTrim(essentials.localizedMeetingPlace),
      hotels: safeTrim(essentials.hotels),
      localizedHotels: safeTrim(essentials.localizedHotels),
      escortedCoach: safeTrim(essentials.escortedCoach),
      localizedEscortedCoach: safeTrim(essentials.localizedEscortedCoach),
    },
    fares: {
      child: safeTrim(fares.child),
      single: safeTrim(fares.single),
      double: safeTrim(fares.double),
      triple: safeTrim(fares.triple),
      quad: safeTrim(fares.quad),
    },
    pdfTitle: safeTrim(record.pdfTitle),
    localizedPdfTitle: safeTrim(record.localizedPdfTitle),
    pdfFileName: safeTrim(record.pdfFileName),
    galleryImages: safeTrim(record.galleryImages),
    destinationCategoryIds: resolveTourDestinationCategoryIds(record),
    updatedAt: safeTrim(record.updatedAt),
  };
}

function safeTrim(value: string | null | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

function isTourRecord(value: unknown): value is TourRecord {
  if (!isRecord(value)) {
    return false;
  }

  if (!stringFields.every((field) => {
    if (field === "galleryImages") {
      return value[field] === undefined || typeof value[field] === "string";
    }
    return typeof value[field] === "string";
  })) {
    return false;
  }

  if (!booleanFields.every((field) => typeof value[field] === "boolean")) {
    return false;
  }

  return (
    (value.status === "published" ||
      value.status === "draft" ||
      value.status === "unpublished") &&
    isFareFields(value.fares) &&
    isEssentialFields(value.essentials)
  );
}

function isEssentialFields(value: unknown): value is TourRecord["essentials"] {
  if (!isRecord(value)) {
    return false;
  }

  return [
    "departureTime",
    "meetingPlace",
    "localizedMeetingPlace",
    "hotels",
    "localizedHotels",
    "escortedCoach",
    "localizedEscortedCoach",
  ].every((field) => typeof value[field] === "string");
}

function isFareFields(value: unknown): value is TourRecord["fares"] {
  if (!isRecord(value)) {
    return false;
  }

  return ["child", "single", "double", "triple", "quad"].every(
    (field) => typeof value[field] === "string",
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
