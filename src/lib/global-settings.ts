import { siteSettingsSeed } from "../data/site-settings.ts";
import type { SiteSettings } from "../types/cms.ts";

export type GlobalSettingsRow = {
  id: "site";
  site_name: string;
  tagline: string;
  primary_phone_label: string;
  primary_phone_href: string;
  secondary_phone_label: string;
  secondary_phone_href: string;
  email_label: string;
  email_href: string;
  office_address: string;
  updated_at: string;
};

export function canonicalizeSiteSettings(input: SiteSettings): SiteSettings {
  const settings = {
    siteName: input.siteName.trim(),
    tagline: input.tagline.trim(),
    primaryPhoneLabel: input.primaryPhoneLabel.trim(),
    primaryPhoneHref: input.primaryPhoneHref.trim(),
    secondaryPhoneLabel: input.secondaryPhoneLabel.trim(),
    secondaryPhoneHref: input.secondaryPhoneHref.trim(),
    emailLabel: input.emailLabel.trim(),
    emailHref: input.emailHref.trim(),
    officeAddress: input.officeAddress.trim(),
  };

  if (!settings.siteName || !settings.primaryPhoneLabel || !settings.primaryPhoneHref) {
    throw new Error("Site name and primary phone fields are required");
  }

  if (!settings.emailLabel || !settings.emailHref) {
    throw new Error("Email label and email href are required");
  }

  if (!settings.primaryPhoneHref.startsWith("tel:")) {
    throw new Error("Primary phone href must start with tel:");
  }

  if (
    settings.secondaryPhoneHref &&
    !settings.secondaryPhoneHref.startsWith("tel:")
  ) {
    throw new Error("Secondary phone href must start with tel:");
  }

  if (!settings.emailHref.startsWith("mailto:")) {
    throw new Error("Email href must start with mailto:");
  }

  const limits: Array<[keyof SiteSettings, number]> = [
    ["siteName", 40],
    ["tagline", 60],
    ["primaryPhoneLabel", 30],
    ["primaryPhoneHref", 80],
    ["secondaryPhoneLabel", 30],
    ["secondaryPhoneHref", 80],
    ["emailLabel", 80],
    ["emailHref", 120],
    ["officeAddress", 160],
  ];

  for (const [key, maxLength] of limits) {
    if (settings[key].length > maxLength) {
      throw new Error(`${key} must be ${maxLength} characters or fewer`);
    }
  }

  return settings;
}

export function siteSettingsToRow(
  settings: SiteSettings,
  updatedAt = new Date().toISOString(),
): GlobalSettingsRow {
  const value = canonicalizeSiteSettings(settings);

  return {
    id: "site",
    site_name: value.siteName,
    tagline: value.tagline,
    primary_phone_label: value.primaryPhoneLabel,
    primary_phone_href: value.primaryPhoneHref,
    secondary_phone_label: value.secondaryPhoneLabel,
    secondary_phone_href: value.secondaryPhoneHref,
    email_label: value.emailLabel,
    email_href: value.emailHref,
    office_address: value.officeAddress,
    updated_at: updatedAt,
  };
}

export function rowToSiteSettings(
  row: GlobalSettingsRow | null | undefined,
): SiteSettings {
  if (!row) {
    return { ...siteSettingsSeed };
  }

  return canonicalizeSiteSettings({
    siteName: row.site_name,
    tagline: row.tagline,
    primaryPhoneLabel: row.primary_phone_label,
    primaryPhoneHref: row.primary_phone_href,
    secondaryPhoneLabel: row.secondary_phone_label,
    secondaryPhoneHref: row.secondary_phone_href,
    emailLabel: row.email_label,
    emailHref: row.email_href,
    officeAddress: row.office_address,
  });
}
