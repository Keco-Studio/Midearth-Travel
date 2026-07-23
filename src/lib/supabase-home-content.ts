import "server-only";

import { homeModuleSeeds } from "@/data/cms-seed";
import {
  canonicalizeHomeModule,
  createDraftHomeModuleRow,
  createPublishedHomeModuleRow,
  mergeHomeModuleRows,
  toHomeModuleRow,
  type HomeModuleRow,
} from "@/lib/home-content";
import { createStorageObjectPath } from "@/lib/inline-image-upload";
import type { HomeModuleId, HomeModuleRecord } from "@/types/cms";

const HOME_MODULES_TABLE = "home_modules";
const HOME_MEDIA_BUCKET = "homepage-media";

type SupabaseConfig = {
  url: string;
  key: string;
};

export async function loadAdminHomeModules(): Promise<HomeModuleRecord[]> {
  const rows = await ensureHomeModuleRows();
  return mergeHomeModuleRows(rows, "draft");
}

export async function loadPublishedHomeModules(): Promise<HomeModuleRecord[]> {
  try {
    const rows = await listHomeModuleRows();
    return mergeHomeModuleRows(rows, "published");
  } catch (error) {
    console.error("Unable to load published homepage content from Supabase", error);
    return mergeHomeModuleRows([], "published");
  }
}

export async function saveHomeModuleDraft(
  module: HomeModuleRecord,
): Promise<HomeModuleRecord> {
  const canonicalModule = canonicalizeHomeModule(module);
  const existing = await getHomeModuleRow(module.id);
  const baseRow = existing ?? toHomeModuleRow(getSeedModule(module.id));
  const savedRows = await upsertHomeModuleRows([
    createDraftHomeModuleRow(baseRow, canonicalModule),
  ]);

  return getMergedModule(savedRows, module.id, "draft");
}

export async function publishHomeModule(id: HomeModuleId): Promise<HomeModuleRecord> {
  const existing = await getHomeModuleRow(id);
  const baseRow = existing ?? toHomeModuleRow(getSeedModule(id));
  const canonicalDraft = canonicalizeHomeModule(
    getMergedModule([baseRow], id, "draft"),
  );
  const canonicalRow: HomeModuleRow = {
    ...baseRow,
    module_index: canonicalDraft.index,
    name: canonicalDraft.name,
    description: canonicalDraft.description,
    fields: canonicalDraft.fields,
    draft_data: canonicalDraft.data,
  };
  const savedRows = await upsertHomeModuleRows([
    createPublishedHomeModuleRow(canonicalRow),
  ]);

  return getMergedModule(savedRows, id, "published");
}

export async function uploadHomeModuleImage(input: {
  moduleId: HomeModuleId;
  fieldKey: string;
  file: File;
}): Promise<string> {
  const config = getSupabaseConfig();
  const objectPath = createStorageObjectPath(
    input.moduleId,
    input.fieldKey,
    input.file.name,
  );
  const encodedPath = objectPath.split("/").map(encodeURIComponent).join("/");
  const response = await fetch(
    `${config.url}/storage/v1/object/${HOME_MEDIA_BUCKET}/${encodedPath}`,
    {
      method: "POST",
      headers: {
        apikey: config.key,
        Authorization: `Bearer ${config.key}`,
        "Content-Type": input.file.type || "application/octet-stream",
        "x-upsert": "false",
      },
      body: input.file,
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(await getSupabaseError(response, "Image upload failed"));
  }

  return `${config.url}/storage/v1/object/public/${HOME_MEDIA_BUCKET}/${encodedPath}`;
}

async function ensureHomeModuleRows(): Promise<HomeModuleRow[]> {
  const rows = await listHomeModuleRows();
  const storedIds = new Set(rows.map((row) => row.id));
  const missingRows = homeModuleSeeds
    .filter((module) => !storedIds.has(module.id))
    .map(toHomeModuleRow);

  if (missingRows.length === 0) {
    return rows;
  }

  await upsertHomeModuleRows(missingRows);
  return listHomeModuleRows();
}

async function listHomeModuleRows(): Promise<HomeModuleRow[]> {
  return supabaseJson<HomeModuleRow[]>(
    `/rest/v1/${HOME_MODULES_TABLE}?select=*&order=module_index.asc`,
  );
}

async function getHomeModuleRow(id: HomeModuleId): Promise<HomeModuleRow | null> {
  const rows = await supabaseJson<HomeModuleRow[]>(
    `/rest/v1/${HOME_MODULES_TABLE}?select=*&id=eq.${encodeURIComponent(id)}&limit=1`,
  );
  return rows[0] ?? null;
}

async function upsertHomeModuleRows(rows: HomeModuleRow[]): Promise<HomeModuleRow[]> {
  return supabaseJson<HomeModuleRow[]>(
    `/rest/v1/${HOME_MODULES_TABLE}?on_conflict=id`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=representation",
      },
      body: JSON.stringify(rows),
    },
  );
}

async function supabaseJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const config = getSupabaseConfig();
  const response = await fetch(`${config.url}${path}`, {
    ...init,
    headers: {
      apikey: config.key,
      Authorization: `Bearer ${config.key}`,
      ...init.headers,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(await getSupabaseError(response, "Supabase request failed"));
  }

  return response.json() as Promise<T>;
}

function getSupabaseConfig(): SupabaseConfig {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/$/, "");
  const key = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )?.trim();

  if (!url || !key) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  return { url, key };
}

async function getSupabaseError(response: Response, fallback: string): Promise<string> {
  const body = await response.text();

  if (!body) {
    return `${fallback} (${response.status})`;
  }

  try {
    const parsed = JSON.parse(body) as { message?: string; error?: string };
    return parsed.message ?? parsed.error ?? `${fallback} (${response.status})`;
  } catch {
    return body;
  }
}

function getSeedModule(id: HomeModuleId): HomeModuleRecord {
  const seedModule = homeModuleSeeds.find((entry) => entry.id === id);

  if (!seedModule) {
    throw new Error(`Unknown homepage module: ${id}`);
  }

  return seedModule;
}

function getMergedModule(
  rows: HomeModuleRow[],
  id: HomeModuleId,
  mode: "draft" | "published",
): HomeModuleRecord {
  const mergedModule = mergeHomeModuleRows(rows, mode).find((entry) => entry.id === id);

  if (!mergedModule) {
    throw new Error(`Supabase did not return homepage module: ${id}`);
  }

  return mergedModule;
}
