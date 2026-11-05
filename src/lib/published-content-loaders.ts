import {
  canonicalizeHomeModule,
} from "./home-content.ts";
import {
  mapTourRecordToPublicTour,
} from "./tour-content.ts";
import { parseTourEditorRecord } from "./tour-editor-state.ts";
import type { Tour } from "../data/tours.ts";
import type { HomeModuleRecord } from "../types/cms.ts";

export type PublishedContentRequest = <T>(
  path: string,
  init?: RequestInit,
) => Promise<T>;

const confirmationEmailKeys = [
  "confirmationEmailSubjectEn",
  "confirmationEmailHeadingEn",
  "confirmationEmailBodyEn",
  "confirmationEmailClosingEn",
  "confirmationEmailSubjectZh",
  "confirmationEmailHeadingZh",
  "confirmationEmailBodyZh",
  "confirmationEmailClosingZh",
] as const;

const HOME_CONTENT_ERROR = "Unable to load published homepage content";
const TOURS_ERROR = "Unable to load published tours";

export async function loadPublishedHomeModulesStrictWithRequest(
  request: PublishedContentRequest,
): Promise<HomeModuleRecord[]> {
  let value: unknown;
  try {
    value = await request<unknown>(
      "/rest/v1/home_modules?select=*&order=module_index.asc",
    );
  } catch (error) {
    throw new Error(HOME_CONTENT_ERROR, { cause: error });
  }

  if (!Array.isArray(value)) throw new Error(HOME_CONTENT_ERROR);
  const row = value.find(
    (entry): entry is Record<string, unknown> => isRecord(entry) && entry.id === "bookingPage",
  );
  if (!row || !isRecord(row.published_data)) throw new Error(HOME_CONTENT_ERROR);
  if (!confirmationEmailKeys.every((key) =>
    typeof row.published_data[key] === "string" && row.published_data[key].trim()
  )) {
    throw new Error(HOME_CONTENT_ERROR);
  }

  try {
    return [canonicalizeHomeModule({
      id: "bookingPage",
      index: requireNumber(row.module_index, HOME_CONTENT_ERROR),
      name: requireString(row.name, HOME_CONTENT_ERROR),
      description: requireString(row.description, HOME_CONTENT_ERROR),
      status: requireContentStatus(row.status, HOME_CONTENT_ERROR),
      publishedVersion: requireNumber(row.published_version, HOME_CONTENT_ERROR),
      draftVersion: row.draft_version === null
        ? null
        : requireNumber(row.draft_version, HOME_CONTENT_ERROR),
      updatedAt: requireString(row.updated_at, HOME_CONTENT_ERROR),
      fields: Array.isArray(row.fields) ? row.fields as HomeModuleRecord["fields"] : [],
      data: row.published_data as HomeModuleRecord["data"],
    })];
  } catch (error) {
    if (error instanceof Error && error.message === HOME_CONTENT_ERROR) throw error;
    throw new Error(HOME_CONTENT_ERROR, { cause: error });
  }
}

export async function loadPublishedToursStrictWithRequest(
  request: PublishedContentRequest,
): Promise<Tour[]> {
  let value: unknown;
  try {
    value = await request<unknown>("/rest/v1/tours?select=*");
  } catch (error) {
    throw new Error(TOURS_ERROR, { cause: error });
  }

  if (!Array.isArray(value)) throw new Error(TOURS_ERROR);
  const records = value.map((row) => {
    if (
      !isRecord(row) ||
      typeof row.slug !== "string" ||
      typeof row.updated_at !== "string" ||
      !isRecord(row.data)
    ) {
      throw new Error(TOURS_ERROR);
    }
    const record = parseTourEditorRecord({
      ...row.data,
      slug: row.slug,
      status: row.status,
      updatedAt: row.updated_at,
    });
    if (!record) throw new Error(TOURS_ERROR);
    return record;
  });
  const published = records.filter((record) => record.status === "published");
  if (published.length === 0) throw new Error(TOURS_ERROR);
  return published.map(mapTourRecordToPublicTour);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireString(value: unknown, message: string): string {
  if (typeof value !== "string") throw new Error(message);
  return value;
}

function requireNumber(value: unknown, message: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) throw new Error(message);
  return value;
}

function requireContentStatus(
  value: unknown,
  message: string,
): HomeModuleRecord["status"] {
  if (value !== "published" && value !== "draft" && value !== "unpublished") {
    throw new Error(message);
  }
  return value;
}
