import { canonicalizeSiteSettings } from "@/lib/global-settings";
import {
  loadAdminHomeModules,
  patchFinalCtaContactFields,
  patchHomeModuleDataFields,
} from "@/lib/supabase-home-content";
import {
  loadGlobalSettings,
  saveGlobalSettings,
} from "@/lib/supabase-global-settings";
import type { ContentValue, HomeModuleId, HomeModuleRecord, SiteSettings } from "@/types/cms";

export type FinalCtaContactFields = {
  phoneLabel: string;
  emailLabel: string;
  officeAddress: string;
};

export type SharedPhoneFields = {
  primaryPhoneLabel: string;
  secondaryPhoneLabel: string;
};

export function contactFieldsFromSettings(
  settings: SiteSettings,
): FinalCtaContactFields {
  return {
    phoneLabel: settings.primaryPhoneLabel.trim(),
    emailLabel: settings.emailLabel.trim(),
    officeAddress: settings.officeAddress.trim(),
  };
}

export function sharedPhonesFromSettings(settings: SiteSettings): SharedPhoneFields {
  return {
    primaryPhoneLabel: settings.primaryPhoneLabel.trim(),
    secondaryPhoneLabel: settings.secondaryPhoneLabel.trim(),
  };
}

export function contactFieldsFromFinalCta(
  module: HomeModuleRecord,
): FinalCtaContactFields {
  return {
    phoneLabel: String(module.data.phoneLabel ?? "").trim(),
    emailLabel: String(module.data.emailLabel ?? "").trim(),
    officeAddress: String(module.data.officeAddress ?? "").trim(),
  };
}

export function sharedPhonesFromModule(module: HomeModuleRecord): SharedPhoneFields {
  return {
    primaryPhoneLabel: String(module.data.primaryPhoneLabel ?? "").trim(),
    secondaryPhoneLabel: String(module.data.secondaryPhoneLabel ?? "").trim(),
  };
}

export function withSyncedFinalCtaContactFields(
  modules: HomeModuleRecord[],
  settings: SiteSettings,
): HomeModuleRecord[] {
  const contact = contactFieldsFromSettings(settings);
  const phones = sharedPhonesFromSettings(settings);

  return modules.map((module) => {
    if (module.id === "finalCta") {
      return {
        ...module,
        data: {
          ...module.data,
          ...contactToModuleData(contact, module.data),
        },
      };
    }

    if (module.id === "navbar" || module.id === "newsletter" || module.id === "footer") {
      return {
        ...module,
        data: {
          ...module.data,
          ...phones,
        },
      };
    }

    return module;
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

export async function syncSharedPhonesToModules(
  settings: SiteSettings,
): Promise<HomeModuleRecord[]> {
  const phones = sharedPhonesFromSettings(settings);
  const updated: HomeModuleRecord[] = [];

  for (const id of ["navbar", "newsletter", "footer"] as const) {
    const module = await patchHomeModuleDataFields(id, phones);
    updated.push(module);
  }

  return updated;
}

export async function syncContactFieldsToGlobalSettings(
  module: HomeModuleRecord,
): Promise<SiteSettings> {
  if (
    module.id === "navbar" ||
    module.id === "newsletter" ||
    module.id === "footer"
  ) {
    return syncSharedPhonesModuleToSettings(module);
  }

  const contact = contactFieldsFromFinalCta(module);
  const settings = await loadGlobalSettings();
  const next = canonicalizeSiteSettings({
    ...settings,
    primaryPhoneLabel: contact.phoneLabel || settings.primaryPhoneLabel,
    emailLabel: contact.emailLabel || settings.emailLabel,
    officeAddress: contact.officeAddress || settings.officeAddress,
  });

  if (
    next.primaryPhoneLabel === settings.primaryPhoneLabel &&
    next.emailLabel === settings.emailLabel &&
    next.officeAddress === settings.officeAddress
  ) {
    return settings;
  }

  return saveGlobalSettings(next);
}

async function syncSharedPhonesModuleToSettings(
  module: HomeModuleRecord,
): Promise<SiteSettings> {
  const phones = sharedPhonesFromModule(module);
  const settings = await loadGlobalSettings();
  const next = canonicalizeSiteSettings({
    ...settings,
    primaryPhoneLabel: phones.primaryPhoneLabel || settings.primaryPhoneLabel,
    secondaryPhoneLabel:
      phones.secondaryPhoneLabel || settings.secondaryPhoneLabel,
  });

  if (
    next.primaryPhoneLabel === settings.primaryPhoneLabel &&
    next.secondaryPhoneLabel === settings.secondaryPhoneLabel
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
  return {
    phoneLabel: contact.phoneLabel || String(existing.phoneLabel ?? ""),
    emailLabel: contact.emailLabel || String(existing.emailLabel ?? ""),
    officeAddress: contact.officeAddress || String(existing.officeAddress ?? ""),
  };
}

function sameContactFields(
  left: FinalCtaContactFields,
  right: FinalCtaContactFields,
): boolean {
  return (
    left.phoneLabel === right.phoneLabel &&
    left.emailLabel === right.emailLabel &&
    left.officeAddress === right.officeAddress
  );
}

export type PhoneSyncModuleId = Extract<
  HomeModuleId,
  "navbar" | "newsletter" | "footer"
>;
