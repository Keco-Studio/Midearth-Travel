import {
  loadGlobalSettings,
  saveGlobalSettings,
} from "@/lib/supabase-global-settings";
import { syncContactFieldsToFinalCta } from "@/lib/office-address-sync";
import { revalidatePublicSite } from "@/lib/revalidate-public-site";
import type { SiteSettings } from "@/types/cms";

export async function GET() {
  return Response.json({ settings: await loadGlobalSettings() });
}

export async function PUT(request: Request) {
  try {
    const payload = (await request.json()) as { settings?: SiteSettings };

    if (!isSiteSettings(payload.settings)) {
      return Response.json({ error: "Invalid settings payload" }, { status: 400 });
    }

    const settings = await saveGlobalSettings(payload.settings);
    const finalCtaModule = await syncContactFieldsToFinalCta(settings);
    revalidatePublicSite();

    return Response.json({ settings, finalCtaModule });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to save settings" },
      { status: 400 },
    );
  }
}

function isSiteSettings(value: unknown): value is SiteSettings {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const settings = value as Partial<SiteSettings>;
  return [
    settings.siteName,
    settings.tagline,
    settings.primaryPhoneLabel,
    settings.primaryPhoneHref,
    settings.secondaryPhoneLabel,
    settings.secondaryPhoneHref,
    settings.emailLabel,
    settings.emailHref,
    settings.officeAddress,
  ].every((entry) => typeof entry === "string");
}
