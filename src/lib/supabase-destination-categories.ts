import "server-only";

import {
  destinationCategorySeeds,
  mergeDestinationCategoryRows,
  toDestinationCategoryRow,
  type DestinationCategory,
  type DestinationCategoryRow,
} from "@/lib/destination-categories";

const TABLE = "destination_categories";

export async function loadDestinationCategories(): Promise<DestinationCategory[]> {
  try {
    const rows = await ensureRows();
    return mergeDestinationCategoryRows(rows);
  } catch (error) {
    console.error("Unable to load destination category names", error);
    return mergeDestinationCategoryRows([]);
  }
}

export async function saveDestinationCategories(
  categories: Array<Pick<DestinationCategory, "id" | "titleEn" | "titleZh">>,
): Promise<DestinationCategory[]> {
  const inputById = new Map(categories.map((category) => [category.id, category]));
  const canonical = destinationCategorySeeds.map((seed) => {
    const input = inputById.get(seed.id);
    const titleEn = input?.titleEn.trim() ?? "";
    const titleZh = input?.titleZh.trim() ?? "";

    if (!titleEn || !titleZh) {
      throw new Error("English and Chinese destination names are required");
    }

    if (titleEn.length > 80 || titleZh.length > 80) {
      throw new Error("Destination names must be 80 characters or fewer");
    }

    return { ...seed, title: titleEn, titleEn, titleZh };
  });
  const rows = canonical.map(toDestinationCategoryRow);
  await upsertRows(rows);
  return mergeDestinationCategoryRows(await listRows());
}

async function ensureRows(): Promise<DestinationCategoryRow[]> {
  const rows = await listRows();
  const storedIds = new Set(rows.map((row) => row.id));
  const missing = destinationCategorySeeds
    .filter((category) => !storedIds.has(category.id))
    .map(toDestinationCategoryRow);

  if (missing.length > 0) {
    await upsertRows(missing);
    return listRows();
  }

  return rows;
}

async function listRows(): Promise<DestinationCategoryRow[]> {
  return supabaseJson<DestinationCategoryRow[]>(
    `/rest/v1/${TABLE}?select=*&order=sort_order.asc`,
  );
}

async function upsertRows(rows: DestinationCategoryRow[]): Promise<void> {
  await supabaseJson<DestinationCategoryRow[]>(`/rest/v1/${TABLE}?on_conflict=id`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify(rows),
  });
}

async function supabaseJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/$/, "");
  const key = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )?.trim();

  if (!url || !key) throw new Error("Supabase is not configured");

  const response = await fetch(`${url}${path}`, {
    ...init,
    headers: { apikey: key, Authorization: `Bearer ${key}`, ...init.headers },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Supabase request failed (${response.status})`);
  }

  if (response.status === 204 || response.headers.get("content-length") === "0") {
    return [] as T;
  }

  return response.json() as Promise<T>;
}
