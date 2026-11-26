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
import {
  createExploreByMonthTourPatches,
  createTopPicksTourPatches,
  syncHomepageSelectionsFromTour,
  type HomepageTourSelectionPatch,
} from "@/lib/homepage-tour-selection-sync";
import { normalizeHotSalesContent } from "@/lib/hot-sales";
import {
  hasTopPickSelection,
  serializeTopPickSlugs,
  TOP_PICKS_DATA_KEY,
} from "@/lib/top-picks";
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

type LinkedSelectionModuleId = "toursSection" | "exploreByMonth";

type LinkedHomeOperation = {
  row: HomeModuleRow;
  expected_updated_at: string;
};

type LinkedTourSave = TourRow & {
  kind: "tour";
  expected_updated_at: string;
};

type LinkedTourOperation = HomepageTourSelectionPatch | LinkedTourSave;

type LinkedHomepageTourPersistenceResult = {
  home_modules: HomeModuleRow[];
  tours: TourRow[];
};

export class HotSalesConflictError extends Error {
  constructor() {
    super("Hot Sales changed in another editor. Refresh and review the latest promotion values before saving again.");
    this.name = "HotSalesConflictError";
  }
}

export class HomepageTourSelectionConflictError extends Error {
  constructor() {
    super(
      "This Homepage selection changed in another editor. Refresh and review the latest Tour selections before saving again.",
    );
    this.name = "HomepageTourSelectionConflictError";
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

export async function saveTourAndSyncHomepageSelections(
  record: TourRecord,
): Promise<{ tour: TourRecord; linkedModules: HomeModuleRecord[] }> {
  const validation = validateTourEditorRecord(record);
  if (!validation.ok) {
    throw new Error(Object.values(validation.errors)[0] ?? "Invalid tour record");
  }

  await loadAdminHomeModules();
  const [hotSalesRow, topPicksRow, exploreByMonthRow] = await Promise.all([
    getHomeModuleRow("hotSales"),
    getHomeModuleRow("toursSection"),
    getHomeModuleRow("exploreByMonth"),
  ]);
  if (!hotSalesRow || !topPicksRow || !exploreByMonthRow) {
    throw new Error("Linked Homepage modules are unavailable");
  }

  const updatedAt = new Date().toISOString();
  const expectedTourUpdatedAt = validation.value.updatedAt;
  const tour = { ...validation.value, updatedAt };
  const publishedSelections = syncHomepageSelectionsFromTour({
    topPicksContent: getStoredHomeData(topPicksRow, "published"),
    exploreContent: getStoredHomeData(exploreByMonthRow, "published"),
    tour,
  });
  const draftSelections = syncHomepageSelectionsFromTour({
    topPicksContent: getStoredHomeData(topPicksRow, "draft"),
    exploreContent: getStoredHomeData(exploreByMonthRow, "draft"),
    tour,
  });
  const nextHotSalesRow: HomeModuleRow = {
    ...hotSalesRow,
    published_data: syncHotSalesContentFromTour(
      getStoredHomeData(hotSalesRow, "published"),
      tour,
    ),
    draft_data: syncHotSalesContentFromTour(
      getStoredHomeData(hotSalesRow, "draft"),
      tour,
    ),
    updated_at: updatedAt,
  };
  const nextTopPicksRow: HomeModuleRow = {
    ...topPicksRow,
    published_data: publishedSelections.topPicksContent,
    draft_data: draftSelections.topPicksContent,
    updated_at: updatedAt,
  };
  const nextExploreByMonthRow: HomeModuleRow = {
    ...exploreByMonthRow,
    published_data: publishedSelections.exploreContent,
    draft_data: draftSelections.exploreContent,
    updated_at: updatedAt,
  };
  const result = await persistLinkedHomepageTourState(
    [
      {
        row: nextHotSalesRow,
        expected_updated_at: hotSalesRow.updated_at,
      },
      {
        row: nextTopPicksRow,
        expected_updated_at: topPicksRow.updated_at,
      },
      {
        row: nextExploreByMonthRow,
        expected_updated_at: exploreByMonthRow.updated_at,
      },
    ],
    [
      {
        kind: "tour",
        ...toTourRow(tour),
        expected_updated_at: expectedTourUpdatedAt,
      },
    ],
  );
  const savedTour = mergeTourRows(result.tours).find(
    (entry) => entry.slug === tour.slug,
  );
  if (!savedTour) throw new Error(`Supabase did not return tour: ${tour.slug}`);

  return {
    tour: savedTour,
    linkedModules: result.home_modules.map((row) =>
      getMergedModule([row], row.id, "draft"),
    ),
  };
}

export async function saveLinkedSelectionModuleDraft(
  module: HomeModuleRecord,
  expectedUpdatedAt: string,
): Promise<HomeModuleRecord> {
  assertLinkedSelectionModuleId(module.id);
  const canonicalModule = canonicalizeHomeModule(module);
  const existing = await getHomeModuleRow(module.id);
  if (!existing) {
    throw new Error(`Homepage module is unavailable: ${module.id}`);
  }

  const nextRow = createDraftHomeModuleRow(existing, canonicalModule);
  const result = await persistLinkedHomepageTourState(
    [{ row: nextRow, expected_updated_at: expectedUpdatedAt }],
    [],
  );
  return getMergedModule(result.home_modules, module.id, "draft");
}

export async function publishLinkedSelectionModule(
  id: LinkedSelectionModuleId,
  expectedUpdatedAt: string,
  tours: readonly TourRecord[],
): Promise<{ module: HomeModuleRecord; tours: TourRecord[] }> {
  const existing = await getHomeModuleRow(id);
  if (!existing) {
    throw new Error(`Homepage module is unavailable: ${id}`);
  }

  const canonicalDraft = canonicalizeHomeModuleForPublish(
    getMergedModule([existing], id, "draft"),
  );
  const canonicalRow: HomeModuleRow = {
    ...existing,
    module_index: canonicalDraft.index,
    name: canonicalDraft.name,
    description: canonicalDraft.description,
    fields: canonicalDraft.fields,
    draft_data: canonicalDraft.data,
  };
  const nextRow = createPublishedHomeModuleRow(canonicalRow);
  const updatedAt = nextRow.updated_at;
  const tourPatches = id === "toursSection"
    ? createTopPicksTourPatches(nextRow.published_data, tours, updatedAt)
    : createExploreByMonthTourPatches(nextRow.published_data, tours, updatedAt);
  const result = await persistLinkedHomepageTourState(
    [{ row: nextRow, expected_updated_at: expectedUpdatedAt }],
    tourPatches,
  );

  return {
    module: getMergedModule(result.home_modules, id, "published"),
    tours: mergeTourRows(result.tours),
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

async function persistLinkedHomepageTourState(
  homeModules: LinkedHomeOperation[],
  tours: LinkedTourOperation[],
): Promise<LinkedHomepageTourPersistenceResult> {
  try {
    const config = getSupabaseServiceConfig();
    return await supabaseJson<LinkedHomepageTourPersistenceResult>(
      "/rest/v1/rpc/persist_linked_homepage_tour_state",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          p_home_modules: homeModules,
          p_tours: tours,
        }),
      },
      config,
    );
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes("HOMEPAGE_SELECTION_CONFLICT") ||
        error.message.includes("HOMEPAGE_SELECTION_TOUR_CONFLICT"))
    ) {
      throw new HomepageTourSelectionConflictError();
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

function getStoredHomeData(
  row: HomeModuleRow,
  mode: "draft" | "published",
): HomeModuleRecord["data"] {
  const seed = getSeedModule(row.id);
  const value = mode === "draft"
    ? row.draft_data ?? row.published_data
    : row.published_data;
  return isRecord(value) ? value as HomeModuleRecord["data"] : seed.data;
}

function assertLinkedSelectionModuleId(
  id: HomeModuleId,
): asserts id is LinkedSelectionModuleId {
  if (id !== "toursSection" && id !== "exploreByMonth") {
    throw new Error(`Homepage module is not a linked Tour selection: ${id}`);
  }
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
  let rows = await listHomeModuleRows();
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

  if (missingRows.length > 0) {
    await upsertHomeModuleRows(missingRows);
    rows = await listHomeModuleRows();
  }

  return backfillStoredTopPicksSelection(rows);
}

async function backfillStoredTopPicksSelection(
  rows: HomeModuleRow[],
): Promise<HomeModuleRow[]> {
  const stored = rows.find((row) => row.id === "toursSection");
  const publishedData = stored && isRecord(stored.published_data)
    ? stored.published_data as HomeModuleRecord["data"]
    : null;

  if (!stored || (publishedData && hasTopPickSelection(publishedData))) {
    return rows;
  }

  const { loadAdminTours } = await import("@/lib/supabase-tours");
  const tours = await loadAdminTours();
  const serializedSelection = serializeTopPickSlugs(
    tours.filter((tour) => tour.specialOffer).map((tour) => tour.slug),
  );
  const draftData = isRecord(stored.draft_data)
    ? stored.draft_data as HomeModuleRecord["data"]
    : null;
  const nextRow: HomeModuleRow = {
    ...stored,
    published_data: {
      ...(publishedData ?? {}),
      [TOP_PICKS_DATA_KEY]: serializedSelection,
    },
    draft_data: draftData && !hasTopPickSelection(draftData)
      ? { ...draftData, [TOP_PICKS_DATA_KEY]: serializedSelection }
      : stored.draft_data,
    updated_at: new Date().toISOString(),
  };

  try {
    const result = await persistLinkedHomepageTourState(
      [{ row: nextRow, expected_updated_at: stored.updated_at }],
      [],
    );
    const saved = result.home_modules[0];
    return saved
      ? rows.map((row) => row.id === saved.id ? saved : row)
      : rows;
  } catch (error) {
    if (error instanceof HomepageTourSelectionConflictError) {
      return listHomeModuleRows();
    }
    throw error;
  }
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
      "Linked Homepage persistence requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
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
