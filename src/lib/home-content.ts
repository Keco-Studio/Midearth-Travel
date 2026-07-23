import { homeModuleSeeds } from "../data/cms-seed.ts";
export { getBooleanContent, getStringContent } from "./content-values.ts";
import type {
  ContentStatus,
  ContentValue,
  FieldDefinition,
  HomeModuleId,
  HomeModuleRecord,
} from "../types/cms.ts";

export type HomeModuleRow = {
  id: HomeModuleId;
  module_index: number;
  name: string;
  description: string;
  status: ContentStatus;
  published_version: number;
  draft_version: number | null;
  fields: FieldDefinition[];
  published_data: Record<string, ContentValue>;
  draft_data: Record<string, ContentValue> | null;
  updated_at: string;
};

export type HomeModuleDataMode = "draft" | "published";

export function toHomeModuleRow(module: HomeModuleRecord): HomeModuleRow {
  return {
    id: module.id,
    module_index: module.index,
    name: module.name,
    description: module.description,
    status: module.status,
    published_version: module.publishedVersion,
    draft_version: module.draftVersion,
    fields: module.fields,
    published_data: module.data,
    draft_data: module.data,
    updated_at: module.updatedAt,
  };
}

export function createDraftHomeModuleRow(
  existing: HomeModuleRow,
  module: HomeModuleRecord,
  updatedAt = new Date().toISOString(),
): HomeModuleRow {
  return {
    ...existing,
    module_index: module.index,
    name: module.name,
    description: module.description,
    status: "draft",
    draft_version: (existing.draft_version ?? existing.published_version) + 1,
    fields: module.fields,
    draft_data: module.data,
    updated_at: updatedAt,
  };
}

export function createPublishedHomeModuleRow(
  existing: HomeModuleRow,
  updatedAt = new Date().toISOString(),
): HomeModuleRow {
  const publishedData = existing.draft_data ?? existing.published_data;

  return {
    ...existing,
    status: "published",
    published_version: existing.published_version + 1,
    draft_version: null,
    published_data: publishedData,
    draft_data: publishedData,
    updated_at: updatedAt,
  };
}

export function canonicalizeHomeModule(
  candidate: HomeModuleRecord,
): HomeModuleRecord {
  const seed = homeModuleSeeds.find((entry) => entry.id === candidate.id);

  if (!seed) {
    throw new Error(`Unknown homepage module: ${candidate.id}`);
  }

  const data = seed.fields.reduce<Record<string, ContentValue>>((result, field) => {
    const value = candidate.data[field.key] ?? seed.data[field.key] ?? defaultFieldValue(field);
    validateContentValue(field, value);
    result[field.key] = value;
    return result;
  }, {});

  return {
    ...candidate,
    index: seed.index,
    name: seed.name,
    description: seed.description,
    fields: seed.fields.map((field) => ({ ...field })),
    data,
  };
}

export function mergeHomeModuleRows(
  rows: readonly HomeModuleRow[],
  mode: HomeModuleDataMode,
): HomeModuleRecord[] {
  const rowsById = new Map(rows.map((row) => [row.id, row]));

  return homeModuleSeeds.map((seed) => {
    const row = rowsById.get(seed.id);

    if (!row) {
      return cloneModule(seed);
    }

    const storedData =
      mode === "draft" ? row.draft_data ?? row.published_data : row.published_data;

    const candidate: HomeModuleRecord = {
      id: seed.id,
      index: seed.index,
      name: row.name,
      description: row.description,
      status: row.status,
      publishedVersion: row.published_version,
      draftVersion: row.draft_version,
      updatedAt: row.updated_at,
      fields: Array.isArray(row.fields) ? row.fields : seed.fields,
      data: isContentRecord(storedData) ? storedData : seed.data,
    };

    try {
      return canonicalizeHomeModule(candidate);
    } catch {
      return cloneModule(seed);
    }
  });
}

export function getHomeModule(
  modules: readonly HomeModuleRecord[],
  id: HomeModuleId,
): HomeModuleRecord {
  const foundModule = modules.find((entry) => entry.id === id);
  const seed = homeModuleSeeds.find((entry) => entry.id === id);

  if (foundModule) {
    return foundModule;
  }

  if (!seed) {
    throw new Error(`Unknown homepage module: ${id}`);
  }

  return cloneModule(seed);
}

function cloneModule(module: HomeModuleRecord): HomeModuleRecord {
  return {
    ...module,
    fields: module.fields.map((field) => ({ ...field })),
    data: { ...module.data },
  };
}

function isContentRecord(value: unknown): value is Record<string, ContentValue> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  return Object.values(value).every(
    (entry) =>
      typeof entry === "string" ||
      typeof entry === "number" ||
      typeof entry === "boolean",
  );
}

function defaultFieldValue(field: FieldDefinition): ContentValue {
  if (field.type === "toggle") {
    return false;
  }

  if (field.type === "number") {
    return 0;
  }

  return "";
}

function validateContentValue(field: FieldDefinition, value: ContentValue): void {
  if (field.type === "toggle" && typeof value !== "boolean") {
    throw new Error(`${field.label} must be a boolean.`);
  }

  if (
    field.type === "number" &&
    (typeof value !== "number" || !Number.isFinite(value))
  ) {
    throw new Error(`${field.label} must be a number.`);
  }

  if (
    field.type !== "toggle" &&
    field.type !== "number" &&
    typeof value !== "string"
  ) {
    throw new Error(`${field.label} must be text.`);
  }

  if (field.required && value === "") {
    throw new Error(`${field.label} is required.`);
  }

  if (
    typeof value === "string" &&
    typeof field.maxLength === "number" &&
    value.length > field.maxLength
  ) {
    throw new Error(`${field.label} must be ${field.maxLength} characters or fewer.`);
  }

  if (field.type === "link" && typeof value === "string" && !isSupportedLink(value)) {
    throw new Error(`${field.label} must use a supported URL.`);
  }

  if (field.type === "image" && typeof value === "string" && !isSupportedImage(value)) {
    throw new Error(`${field.label} must use a supported image URL.`);
  }
}

function isSupportedLink(value: string): boolean {
  return (
    value === "" ||
    value.startsWith("#") ||
    (value.startsWith("/") && !value.startsWith("//")) ||
    /^(https?:|mailto:|tel:)/i.test(value)
  );
}

function isSupportedImage(value: string): boolean {
  return (
    value === "" ||
    (value.startsWith("/") && !value.startsWith("//")) ||
    /^https?:\/\//i.test(value)
  );
}
