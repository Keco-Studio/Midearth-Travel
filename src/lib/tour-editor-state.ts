import type { TourRecord } from "../types/cms.ts";
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
  "departures",
  "localizedDepartures",
  "highlights",
  "localizedHighlights",
  "description",
  "localizedDescription",
  "pdfTitle",
  "localizedPdfTitle",
  "pdfFileName",
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
  if (!value.region) errors.region = "Enter a region";
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
  return {
    ...record,
    slug: record.slug.trim(),
    code: record.code.trim(),
    title: record.title.trim(),
    localizedTitle: record.localizedTitle.trim(),
    image: record.image.trim(),
    region: record.region.trim(),
    subregion: record.subregion.trim(),
    duration: record.duration.trim(),
    localizedDuration: record.localizedDuration.trim(),
    tourType: record.tourType.trim(),
    departures: record.departures.trim(),
    localizedDepartures: record.localizedDepartures.trim(),
    highlights: record.highlights.trim(),
    localizedHighlights: record.localizedHighlights.trim(),
    description: normalizeRichText(record.description),
    localizedDescription: normalizeRichText(record.localizedDescription),
    fares: {
      child: record.fares.child.trim(),
      single: record.fares.single.trim(),
      double: record.fares.double.trim(),
      triple: record.fares.triple.trim(),
      quad: record.fares.quad.trim(),
    },
    pdfTitle: record.pdfTitle.trim(),
    localizedPdfTitle: record.localizedPdfTitle.trim(),
    pdfFileName: record.pdfFileName.trim(),
    updatedAt: record.updatedAt.trim(),
  };
}

function isTourRecord(value: unknown): value is TourRecord {
  if (!isRecord(value)) {
    return false;
  }

  if (!stringFields.every((field) => typeof value[field] === "string")) {
    return false;
  }

  if (!booleanFields.every((field) => typeof value[field] === "boolean")) {
    return false;
  }

  return (
    (value.status === "published" ||
      value.status === "draft" ||
      value.status === "unpublished") &&
    isFareFields(value.fares)
  );
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
