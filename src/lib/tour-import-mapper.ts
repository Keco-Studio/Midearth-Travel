import { tours } from "../data/tours.ts";
import type { ContentStatus, TourRecord } from "../types/cms.ts";
import { normalizeRichText } from "./rich-text-content.ts";

export type ExcelTourRow = Record<string, unknown>;

const codeToSlug = new Map(
  tours.flatMap((tour) => (tour.code ? [[tour.code.trim().toUpperCase(), tour.slug]] : [])),
);

function normalizeHeader(header: string): string {
  return header
    .replace(/\r?\n/g, "")
    .replace(/（Option）|\(Option\)|\(required\)|（required）/gi, "")
    .trim()
    .toLowerCase();
}

function buildColumnLookup(row: ExcelTourRow): Map<string, unknown> {
  const lookup = new Map<string, unknown>();
  for (const [key, value] of Object.entries(row)) {
    lookup.set(normalizeHeader(key), value);
  }
  return lookup;
}

function readString(lookup: Map<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = lookup.get(normalizeHeader(key));
    if (value === undefined || value === null) continue;
    const text = String(value).trim();
    if (text) return text;
  }
  return "";
}

function readBoolean(lookup: Map<string, unknown>, ...keys: string[]): boolean {
  for (const key of keys) {
    const value = lookup.get(normalizeHeader(key));
    if (value === true || value === "true" || value === "TRUE" || value === 1 || value === "1") {
      return true;
    }
    if (value === false || value === "false" || value === "FALSE" || value === 0 || value === "0") {
      return false;
    }
  }
  return false;
}

function readStatus(lookup: Map<string, unknown>): ContentStatus {
  const value = readString(lookup, "status").toLowerCase();
  if (value === "draft" || value === "unpublished" || value === "published") {
    return value;
  }
  return "published";
}

function readFare(lookup: Map<string, unknown>, key: string): string {
  const value = readString(lookup, key);
  if (!value || value === "0") return "";
  return value.startsWith("$") ? value : `$${value}`;
}

export function slugifyTourTitle(title: string): string {
  return title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function resolveTourSlug(code: string, title: string, usedSlugs: Set<string>): string {
  const knownSlug = codeToSlug.get(code.trim().toUpperCase());
  if (knownSlug) return knownSlug;

  const base = slugifyTourTitle(title) || slugifyTourTitle(code);
  if (!usedSlugs.has(base)) return base;

  const withCode = `${base}-${code.trim().toLowerCase()}`;
  if (!usedSlugs.has(withCode)) return withCode;

  let index = 2;
  while (usedSlugs.has(`${withCode}-${index}`)) {
    index += 1;
  }
  return `${withCode}-${index}`;
}

export function resolveTourType(lookup: Map<string, unknown>): string {
  if (readBoolean(lookup, "Bus Tours", "bus tours")) return "Bus Tour";
  if (readBoolean(lookup, "Sun Destinations", "sun destinations")) return "Sun Destinations";
  if (readString(lookup, "region").toLowerCase() === "sun destinations") return "Sun Destinations";
  if (readBoolean(lookup, "vacationPackage", "vacation package")) return "Group Tour";
  return "Group Tour";
}

export function mapExcelRowToTourRecord(
  row: ExcelTourRow,
  usedSlugs: Set<string>,
  updatedAt = new Date().toISOString(),
): TourRecord | null {
  const lookup = buildColumnLookup(row);
  const code = readString(lookup, "code");
  const title = readString(lookup, "title");

  if (!code || !title) return null;

  const slug = resolveTourSlug(code, title, usedSlugs);
  usedSlugs.add(slug);

  const busTour = readBoolean(lookup, "Bus Tours", "bus tours");
  const sunDestination =
    readBoolean(lookup, "Sun Destinations", "sun destinations") ||
    readString(lookup, "region").toLowerCase() === "sun destinations";
  const vacationPackage = readBoolean(lookup, "vacationPackage", "vacation package");

  return {
    slug,
    code,
    title,
    localizedTitle: readString(lookup, "ChineseTitle", "chinese title"),
    image: readString(lookup, "image"),
    region: readString(lookup, "region"),
    subregion: readString(lookup, "subregion"),
    duration: readString(lookup, "duration"),
    localizedDuration: "",
    tourType: resolveTourType(lookup),
    departureCity: readString(lookup, "departureCity", "departure city"),
    localizedDepartureCity: "",
    departures: readString(lookup, "departures"),
    localizedDepartures: "",
    highlights: readString(lookup, "highlights"),
    localizedHighlights: "",
    description: normalizeRichText(readString(lookup, "description")),
    localizedDescription: normalizeRichText(
      readString(lookup, "ChineseDescription", "chinese description"),
    ),
    admissions: readString(lookup, "admissions"),
    localizedAdmissions: readString(lookup, "ChineseAdmissions", "chinese admissions"),
    cancellation: readString(lookup, "cancellation"),
    localizedCancellation: readString(lookup, "ChineseCancellation", "chinese cancellation"),
    importantNotice: readString(lookup, "importantNotice", "important notice"),
    localizedImportantNotice: readString(
      lookup,
      "ChineseImportantNotice",
      "chinese important notice",
    ),
    included: readString(lookup, "INCLUDED", "included"),
    localizedIncluded: readString(lookup, "ChineseIncluded", "chinese included"),
    notIncluded: readString(lookup, "NOT INCLUDED", "not included"),
    localizedNotIncluded: readString(lookup, "ChineseNotIncluded", "chinese notincluded", "chinesenotincluded"),
    essentials: {
      departureTime: readString(lookup, "essentials.departureTime", "essentials.departuretime"),
      meetingPlace: readString(lookup, "essentials.meetingPlace", "essentials.meetingplace"),
      localizedMeetingPlace: "",
      hotels: readString(lookup, "essentials.hotels"),
      localizedHotels: readString(lookup, "essentials.ChineseHotels", "essentials.chinesehotels"),
      escortedCoach: readString(lookup, "essentials.escortedCoach", "essentials.escortedcoach"),
      localizedEscortedCoach: readString(
        lookup,
        "essentials.ChineseEscortedCoach",
        "essentials.chineseescortedcoach",
      ),
    },
    fares: {
      quad: readFare(lookup, "fares.quad"),
      triple: readFare(lookup, "fares.triple"),
      double: readFare(lookup, "fares.double"),
      single: readFare(lookup, "fares.single"),
      child: readFare(lookup, "fares.child"),
    },
    pdfTitle: readString(lookup, "pdfTitle", "pdf title") || "Download PDF for tour details",
    localizedPdfTitle: readString(lookup, "ChinesePdfTitle", "chinese pdf title"),
    pdfFileName: readString(lookup, "pdfFileName", "pdf file name"),
    specialOffer: readBoolean(lookup, "Our Top Picks", "our top picks"),
    specialDeals: false,
    vacationPackage: vacationPackage || (!busTour && !sunDestination),
    travelNewsPackage: readBoolean(lookup, "Explore by Month", "explore by month"),
    busTourPackage: busTour,
    status: readStatus(lookup),
    updatedAt: readString(lookup, "updatedAt", "updated at") || updatedAt,
  };
}

export function mapExcelRowsToTourRecords(rows: readonly ExcelTourRow[]): TourRecord[] {
  const usedSlugs = new Set<string>();
  const updatedAt = new Date().toISOString();
  const records: TourRecord[] = [];

  for (const row of rows) {
    const record = mapExcelRowToTourRecord(row, usedSlugs, updatedAt);
    if (record) records.push(record);
  }

  return records;
}
