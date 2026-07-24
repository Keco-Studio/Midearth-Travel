import "server-only";

import { siteSettingsSeed } from "@/data/site-settings";
import {
  rowToSiteSettings,
  siteSettingsToRow,
  type GlobalSettingsRow,
} from "@/lib/global-settings";
import type { SiteSettings } from "@/types/cms";

const TABLE = "global_settings";

export async function loadGlobalSettings(): Promise<SiteSettings> {
  try {
    const rows = await request<GlobalSettingsRow[]>(
      `/rest/v1/${TABLE}?select=*&id=eq.site&limit=1`,
    );

    if (rows[0]) {
      return rowToSiteSettings(rows[0]);
    }

    return saveGlobalSettings(siteSettingsSeed);
  } catch (error) {
    console.error("Unable to load global settings", error);
    return { ...siteSettingsSeed };
  }
}

export async function saveGlobalSettings(
  settings: SiteSettings,
): Promise<SiteSettings> {
  const rows = await request<GlobalSettingsRow[]>(
    `/rest/v1/${TABLE}?on_conflict=id`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=representation",
      },
      body: JSON.stringify([siteSettingsToRow(settings)]),
    },
  );

  return rowToSiteSettings(rows[0]);
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/$/, "");
  const key = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )?.trim();

  if (!url || !key) {
    throw new Error("Supabase is not configured");
  }

  const response = await fetch(`${url}${path}`, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      ...init.headers,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error((await response.text()) || "Supabase request failed");
  }

  return response.json() as Promise<T>;
}
