import "server-only";

import { homeModuleSeeds } from "@/data/cms-seed";
import {
  canonicalizeHomeModule,
  canonicalizeHomeModuleForPublish,
  createDraftHomeModuleRow,
  createPublishedHomeModuleRow,
  mergeHomeModuleRows,
  toHomeModuleRow,
  type HomeModuleRow,
} from "@/lib/home-content";
import { createStorageObjectPath } from "@/lib/inline-image-upload";
import {
  createHotSalesContentFromTours,
  createHotSalesTourPatches,
  syncHotSalesContentFromTour,
  type HotSalesTourPatch,
} from "@/lib/hot-sales-sync";
import { normalizeHotSalesContent } from "@/lib/hot-sales";
import { loadPublishedHomeModulesStrictWithRequest } from "@/lib/published-content-loaders";
import {
  mergeTourRows,
  toTourRow,
  type TourRow,
} from "@/lib/tour-content";
import { validateTourEditorRecord } from "@/lib/tour-editor-state";
import type { HomeModuleId, HomeModuleRecord, TourRecord } from "@/types/cms";

const HOME_MODULES_TABLE = "home_modules";
const HOME_MEDIA_BUCKET = "homepage-media";

type SupabaseConfig = {
  url: string;
  key: string;
};

type HotSalesPersistenceResult = {
  home_module: HomeModuleRow;
  tours: TourRow[];
};

type HotSalesTourSave = TourRow & {
  kind: "tour";
  expected_updated_at: string;
};

type HotSalesTourOperation = HotSalesTourPatch | HotSalesTourSave;

export class HotSalesConflictError extends Error {
  constructor() {
    super("Hot Sales changed in another editor. Refresh and review the latest promotion values before saving again.");
    this.name = "HotSalesConflictError";
  }
}

export async function loadAdminHomeModules(): Promise<HomeModuleRecord[]> {
  const rows = await ensureHomeModuleRows();
  return mergeHomeModuleRows(rows, "draft");
}

export async function loadPublishedHomeModules(): Promise<HomeModuleRecord[]> {
  try {
    const rows = await ensureHomeModuleRows();
    return mergeHomeModuleRows(rows, "published");
  } catch (error) {
    console.error("Unable to load published homepage content from Supabase", error);
    return mergeHomeModuleRows([], "published");
  }
}

export async function saveHotSalesModuleDraft(
  module: HomeModuleRecord,
  expectedUpdatedAt: string,
): Promise<HomeModuleRecord> {
  const canonicalModule = canonicalizeHomeModule(module);
  const normalizedModule = {
    ...canonicalModule,
    data: normalizeHotSalesContent(canonicalModule.data),
  };
  const existing = await getHomeModuleRow("hotSales");
  const baseRow = existing ?? toHomeModuleRow(getSeedModule("hotSales"));
  const nextRow = createDraftHomeModuleRow(baseRow, normalizedModule);
  const result = await persistHotSalesState(nextRow, [], expectedUpdatedAt);
  return getMergedModule([result.home_module], "hotSales", "draft");
}

export async function publishHotSalesModule(
  expectedUpdatedAt: string,
  tours: readonly TourRecord[],
): Promise<{ module: HomeModuleRecord; tours: TourRecord[] }> {
  const existing = await getHomeModuleRow("hotSales");
  const baseRow = existing ?? toHomeModuleRow(getSeedModule("hotSales"));
  const canonicalDraftBase = canonicalizeHomeModuleForPublish(
    getMergedModule([baseRow], "hotSales", "draft"),
  );
  const canonicalDraft = {
    ...canonicalDraftBase,
    data: normalizeHotSalesContent(canonicalDraftBase.data),
  };
  const canonicalRow: HomeModuleRow = {
    ...baseRow,
    module_index: canonicalDraft.index,
    name: canonicalDraft.name,
    description: canonicalDraft.description,
    fields: canonicalDraft.fields,
    draft_data: canonicalDraft.data,
  };
  const nextHomeRow = createPublishedHomeModuleRow(canonicalRow);
  const updatedAt = nextHomeRow.updated_at;
  const tourPatches = createHotSalesTourPatches(
    canonicalDraft.data,
    tours,
    updatedAt,
  );
  const result = await persistHotSalesState(
    nextHomeRow,
    tourPatches,
    expectedUpdatedAt,
  );

  return {
    module: getMergedModule([result.home_module], "hotSales", "published"),
    tours: mergeTourRows(result.tours),
  };
}

export async function saveTourAndSyncHotSales(
  record: TourRecord,
): Promise<{ tour: TourRecord; hotSalesModule: HomeModuleRecord }> {
  const validation = validateTourEditorRecord(record);
  if (!validation.ok) {
    throw new Error(Object.values(validation.errors)[0] ?? "Invalid tour record");
  }

  await loadAdminHomeModules();
  const existing = await getHomeModuleRow("hotSales");
  if (!existing) throw new Error("Hot Sales module is unavailable");

  const updatedAt = new Date().toISOString();
  const expectedTourUpdatedAt = validation.value.updatedAt;
  const tour = { ...validation.value, updatedAt };
  const nextHomeRow: HomeModuleRow = {
    ...existing,
    published_data: syncHotSalesContentFromTour(
      isRecord(existing.published_data)
        ? existing.published_data
        : getSeedModule("hotSales").data,
      tour,
    ),
    draft_data: syncHotSalesContentFromTour(
      isRecord(existing.draft_data)
        ? existing.draft_data
        : isRecord(existing.published_data)
          ? existing.published_data
          : getSeedModule("hotSales").data,
      tour,
    ),
    updated_at: updatedAt,
  };
  const result = await persistHotSalesState(
    nextHomeRow,
    [
      {
        kind: "tour",
        ...toTourRow(tour),
        expected_updated_at: expectedTourUpdatedAt,
      },
    ],
    existing.updated_at,
  );
  const savedTour = mergeTourRows(result.tours).find(
    (entry) => entry.slug === tour.slug,
  );
  if (!savedTour) throw new Error(`Supabase did not return tour: ${tour.slug}`);

  return {
    tour: savedTour,
    hotSalesModule: getMergedModule(
      [result.home_module],
      "hotSales",
      "draft",
    ),
  };
}

export function loadPublishedHomeModulesStrict(): Promise<HomeModuleRecord[]> {
  return loadPublishedHomeModulesStrictWithRequest(supabaseJson);
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
  const canonicalDraft = canonicalizeHomeModuleForPublish(
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

async function persistHotSalesState(
  homeModule: HomeModuleRow,
  tours: HotSalesTourOperation[],
  expectedUpdatedAt: string,
): Promise<HotSalesPersistenceResult> {
  try {
    const config = getSupabaseServiceConfig();
    return await supabaseJson<HotSalesPersistenceResult>(
      "/rest/v1/rpc/persist_hot_sales_state",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          p_home_module: homeModule,
          p_tours: tours,
          p_expected_home_updated_at: expectedUpdatedAt,
        }),
      },
      config,
    );
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes("HOT_SALES_CONFLICT") ||
        error.message.includes("HOT_SALES_TOUR_CONFLICT"))
    ) {
      throw new HotSalesConflictError();
    }
    throw error;
  }
}

/** Patch Final CTA contact fields without flipping publish status. */
export async function patchFinalCtaContactFields(contact: {
  phoneLabel: string;
  emailLabel: string;
  officeAddress: string;
  officeAddressZh: string;
}): Promise<HomeModuleRecord> {
  return patchHomeModuleDataFields("finalCta", {
    phoneLabel: contact.phoneLabel.trim(),
    emailLabel: contact.emailLabel.trim(),
    officeAddress: contact.officeAddress.trim(),
    officeAddressZh: contact.officeAddressZh.trim(),
  });
}

/** Patch selected draft+published fields on a homepage module without flipping status. */
export async function patchHomeModuleDataFields(
  id: HomeModuleId,
  patch: Record<string, string | number | boolean>,
): Promise<HomeModuleRecord> {
  const existing = await getHomeModuleRow(id);
  const seed = getSeedModule(id);
  const baseRow = existing ?? toHomeModuleRow(seed);
  const publishedData = {
    ...(isRecord(baseRow.published_data) ? baseRow.published_data : seed.data),
    ...patch,
  };
  const draftSource = baseRow.draft_data ?? baseRow.published_data;
  const draftData = {
    ...(isRecord(draftSource) ? draftSource : seed.data),
    ...patch,
  };

  const savedRows = await upsertHomeModuleRows([
    {
      ...baseRow,
      fields: seed.fields,
      published_data: publishedData,
      draft_data: draftData,
      updated_at: new Date().toISOString(),
    },
  ]);

  return getMergedModule(savedRows, id, "draft");
}

/** @deprecated Use patchFinalCtaContactFields */
export async function patchFinalCtaOfficeAddress(
  officeAddress: string,
): Promise<HomeModuleRecord> {
  const modules = await loadAdminHomeModules();
  const finalCta = modules.find((module) => module.id === "finalCta");
  return patchFinalCtaContactFields({
    phoneLabel: String(finalCta?.data.phoneLabel ?? ""),
    emailLabel: String(finalCta?.data.emailLabel ?? ""),
    officeAddress,
    officeAddressZh: String(finalCta?.data.officeAddressZh ?? ""),
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
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
  const missingModules = homeModuleSeeds.filter(
    (module) => !storedIds.has(module.id),
  );
  const missingRows = await Promise.all(
    missingModules.map(async (module) => {
      if (module.id !== "hotSales") return toHomeModuleRow(module);

      const { loadAdminTours } = await import("@/lib/supabase-tours");
      const tours = await loadAdminTours();
      return toHomeModuleRow({
        ...module,
        data: createHotSalesContentFromTours(module.data, tours),
      });
    }),
  );

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

async function supabaseJson<T>(
  path: string,
  init: RequestInit = {},
  config = getSupabaseConfig(),
): Promise<T> {
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

function getSupabaseServiceConfig(): SupabaseConfig {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !key) {
    throw new Error(
      "Hot Sales persistence requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
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
