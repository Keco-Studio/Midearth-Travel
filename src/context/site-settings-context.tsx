"use client";

import { createContext, useContext } from "react";
import { siteSettingsSeed } from "@/data/site-settings";
import type { SiteSettings } from "@/types/cms";

const SiteSettingsContext = createContext<SiteSettings>(siteSettingsSeed);

export function SiteSettingsProvider({
  settings,
  children,
}: {
  settings: SiteSettings;
  children: React.ReactNode;
}) {
  return (
    <SiteSettingsContext.Provider value={settings}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings(): SiteSettings {
  return useContext(SiteSettingsContext);
}
