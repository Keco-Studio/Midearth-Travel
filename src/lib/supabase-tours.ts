import "server-only";

import { tourSeeds } from "@/data/cms-seed";
import { tours, type Tour } from "@/data/tours";
import { createStorageObjectPath } from "@/lib/inline-image-upload";
import { mapTourRecordToPublicTour, mergeTourRows, toTourRow, type TourRow } from "@/lib/tour-content";
import { validateTourEditorRecord } from "@/lib/tour-editor-state";
import type { TourRecord } from "@/types/cms";

const TOURS_TABLE = "tours";
const TOUR_MEDIA_BUCKET = "tour-media";

export async function loadAdminTours(): Promise<TourRecord[]> {
  const rows = await ensureTourRows();
  return mergeTourRows(rows);
}

export async function loadPublishedTours(): Promise<Tour[]> {
  try {
    const rows = await listTourRows();
    return mergeTourRows(rows)
      .filter((record) => record.status === "published")
      .map(mapTourRecordToPublicTour);
  } catch (error) {
    console.error("Unable to load published tours from Supabase", error);
    return tours;
  }
}

export async function saveTour(record: TourRecord): Promise<TourRecord> {
  const validation = validateTourEditorRecord(record);
  if (!validation.ok) {
    throw new Error(Object.values(validation.errors)[0] ?? "Invalid tour record");
  }

  const value = {
    ...validation.value,
    updatedAt: new Date().toISOString(),
  };
  const rows = await upsertTourRows([toTourRow(value)]);
  const saved = mergeTourRows(rows).find((entry) => entry.slug === value.slug);

  if (!saved) {
    throw new Error(`Supabase did not return tour: ${value.slug}`);
  }

  return saved;
}

export async function uploadTourImage(input: {
  slug: string;
  file: File;
}): Promise<string> {
  const config = getSupabaseConfig();
  const objectPath = createStorageObjectPath("tours", input.slug, input.file.name);
  const encodedPath = objectPath.split("/").map(encodeURIComponent).join("/");
  const response = await fetch(
    `${config.url}/storage/v1/object/${TOUR_MEDIA_BUCKET}/${encodedPath}`,
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
    throw new Error(await getSupabaseError(response, "Tour image upload failed"));
  }

  return `${config.url}/storage/v1/object/public/${TOUR_MEDIA_BUCKET}/${encodedPath}`;
}

async function ensureTourRows(): Promise<TourRow[]> {
  const rows = await listTourRows();
  const storedSlugs = new Set(rows.map((row) => row.slug));
  const missing = tourSeeds
    .filter((record) => !storedSlugs.has(record.slug))
    .map(toTourRow);

  if (missing.length > 0) {
    await upsertTourRows(missing);
    return listTourRows();
  }

  return rows;
}

async function listTourRows(): Promise<TourRow[]> {
  return supabaseJson<TourRow[]>(`/rest/v1/${TOURS_TABLE}?select=*`);
}

async function upsertTourRows(rows: TourRow[]): Promise<TourRow[]> {
  return supabaseJson<TourRow[]>(`/rest/v1/${TOURS_TABLE}?on_conflict=slug`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify(rows),
  });
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
    throw new Error(await getSupabaseError(response, "Supabase tour request failed"));
  }

  return response.json() as Promise<T>;
}

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/$/, "");
  const key = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )?.trim();

  if (!url || !key) {
    throw new Error("Supabase is not configured");
  }

  return { url, key };
}

async function getSupabaseError(response: Response, fallback: string): Promise<string> {
  const body = await response.text();
  if (!body) return `${fallback} (${response.status})`;

  try {
    const parsed = JSON.parse(body) as { message?: string; error?: string };
    return parsed.message ?? parsed.error ?? fallback;
  } catch {
    return body;
  }
}
