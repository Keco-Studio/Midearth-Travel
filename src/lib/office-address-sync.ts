import { canonicalizeSiteSettings } from "@/lib/global-settings";
import {
  loadAdminHomeModules,
  patchFinalCtaContactFields,
} from "@/lib/supabase-home-content";
import {
  loadGlobalSettings,
  saveGlobalSettings,
} from "@/lib/supabase-global-settings";
import type { ContentValue, HomeModuleRecord, SiteSettings } from "@/types/cms";

export type FinalCtaContactFields = {
  phoneLabel: string;
  phoneHref: string;
  emailLabel: string;
  emailHref: string;
  officeAddress: string;
};

export function contactFieldsFromSettings(
  settings: SiteSettings,
): FinalCtaContactFields {
  return {
    phoneLabel: settings.primaryPhoneLabel.trim(),
    phoneHref: settings.primaryPhoneHref.trim(),
    emailLabel: settings.emailLabel.trim(),
    emailHref: settings.emailHref.trim(),
    officeAddress: settings.officeAddress.trim(),
  };
}

export function contactFieldsFromFinalCta(
  module: HomeModuleRecord,
): FinalCtaContactFields {
  return {
    phoneLabel: String(module.data.phoneLabel ?? "").trim(),
    phoneHref: String(module.data.phoneHref ?? "").trim(),
    emailLabel: String(module.data.emailLabel ?? "").trim(),
    emailHref: String(module.data.emailHref ?? "").trim(),
    officeAddress: String(module.data.officeAddress ?? "").trim(),
  };
}

export function withSyncedFinalCtaContactFields(
  modules: HomeModuleRecord[],
  settings: SiteSettings,
): HomeModuleRecord[] {
  const contact = contactFieldsFromSettings(settings);

  return modules.map((module) => {
    if (module.id !== "finalCta") {
      return module;
    }

    return {
      ...module,
      data: {
        ...module.data,
        ...contactToModuleData(contact, module.data),
      },
    };
  });
}

/** @deprecated Use withSyncedFinalCtaContactFields */
export function withSyncedFinalCtaOfficeAddress(
  modules: HomeModuleRecord[],
  officeAddress: string,
): HomeModuleRecord[] {
  return modules.map((module) => {
    if (module.id !== "finalCta") {
      return module;
    }

    return {
      ...module,
      data: {
        ...module.data,
        officeAddress: officeAddress.trim() || String(module.data.officeAddress ?? ""),
      },
    };
  });
}

export async function syncContactFieldsToFinalCta(
  settings: SiteSettings,
): Promise<HomeModuleRecord | null> {
  const contact = contactFieldsFromSettings(settings);
  const modules = await loadAdminHomeModules();
  const finalCta = modules.find((module) => module.id === "finalCta");

  if (!finalCta) {
    return null;
  }

  if (sameContactFields(contactFieldsFromFinalCta(finalCta), contact)) {
    return finalCta;
  }

  return patchFinalCtaContactFields(contact);
}

export async function syncContactFieldsToGlobalSettings(
  module: HomeModuleRecord,
): Promise<SiteSettings> {
  const contact = contactFieldsFromFinalCta(module);
  const settings = await loadGlobalSettings();
  const next = canonicalizeSiteSettings({
    ...settings,
    primaryPhoneLabel: contact.phoneLabel || settings.primaryPhoneLabel,
    primaryPhoneHref: contact.phoneHref || settings.primaryPhoneHref,
    emailLabel: contact.emailLabel || settings.emailLabel,
    emailHref: contact.emailHref || settings.emailHref,
    officeAddress: contact.officeAddress || settings.officeAddress,
  });

  if (
    next.primaryPhoneLabel === settings.primaryPhoneLabel &&
    next.primaryPhoneHref === settings.primaryPhoneHref &&
    next.emailLabel === settings.emailLabel &&
    next.emailHref === settings.emailHref &&
    next.officeAddress === settings.officeAddress
  ) {
    return settings;
  }

  return saveGlobalSettings(next);
}

/** @deprecated Use syncContactFieldsToFinalCta */
export async function syncOfficeAddressToFinalCta(
  officeAddress: string,
): Promise<HomeModuleRecord | null> {
  const settings = await loadGlobalSettings();
  return syncContactFieldsToFinalCta({
    ...settings,
    officeAddress,
  });
}

/** @deprecated Use syncContactFieldsToGlobalSettings */
export async function syncOfficeAddressToGlobalSettings(
  officeAddress: string,
): Promise<SiteSettings> {
  const settings = await loadGlobalSettings();
  return syncContactFieldsToGlobalSettings({
    id: "finalCta",
    index: 8,
    name: "Final CTA",
    description: "",
    status: "published",
    publishedVersion: 1,
    draftVersion: null,
    updatedAt: new Date().toISOString(),
    fields: [],
    data: {
      ...contactFieldsFromSettings(settings),
      officeAddress,
    },
  });
}

function contactToModuleData(
  contact: FinalCtaContactFields,
  existing: Record<string, ContentValue>,
): Record<string, ContentValue> {
  const phoneHref = contact.phoneHref || String(existing.phoneHref ?? "");
  return {
    phoneLabel: contact.phoneLabel || String(existing.phoneLabel ?? ""),
    phoneHref,
    emailLabel: contact.emailLabel || String(existing.emailLabel ?? ""),
    emailHref: contact.emailHref || String(existing.emailHref ?? ""),
    officeAddress: contact.officeAddress || String(existing.officeAddress ?? ""),
    // Keep the booking CTA phone link aligned with the primary phone.
    primaryButtonLink: phoneHref || String(existing.primaryButtonLink ?? ""),
  };
}

function sameContactFields(
  left: FinalCtaContactFields,
  right: FinalCtaContactFields,
): boolean {
  return (
    left.phoneLabel === right.phoneLabel &&
    left.phoneHref === right.phoneHref &&
    left.emailLabel === right.emailLabel &&
    left.emailHref === right.emailHref &&
    left.officeAddress === right.officeAddress
  );
}
