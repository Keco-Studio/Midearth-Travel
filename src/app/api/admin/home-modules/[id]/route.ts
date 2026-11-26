import { assertAdminRequest } from "@/lib/admin-auth";
import { EXPECTED_CONTENT_MODULE_IDS } from "@/lib/content-rules";
import { canonicalizeHomeModule } from "@/lib/home-content";
import { HeroSlidesPublishError } from "@/lib/hero-slides";
import { HotSalesPublishError, validateHotSalesForPublish } from "@/lib/hot-sales";
import { mapTourRecordToPublicTour } from "@/lib/tour-content";
import {
  syncContactFieldsToFinalCta,
  syncContactFieldsToGlobalSettings,
  syncSharedPhonesToModules,
} from "@/lib/office-address-sync";
import { revalidatePublicSite } from "@/lib/revalidate-public-site";
import {
  HotSalesConflictError,
  loadAdminHomeModules,
  publishHomeModule,
  publishHotSalesModule,
  saveHomeModuleDraft,
  saveHotSalesModuleDraft,
} from "@/lib/supabase-home-content";
import { loadAdminTours } from "@/lib/supabase-tours";
import type { HomeModuleId, HomeModuleRecord, SiteSettings } from "@/types/cms";

type UpdatePayload =
  | { action: "save"; module: HomeModuleRecord; expectedUpdatedAt?: string }
  | { action: "publish"; expectedUpdatedAt?: string };

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const unauthorized = await assertAdminRequest();
  if (unauthorized) return unauthorized;

  try {
    const { id: rawId } = await params;

    if (!isHomeModuleId(rawId)) {
      return Response.json({ error: "Unknown homepage module" }, { status: 404 });
    }

    const payload = (await request.json()) as UpdatePayload;

    if (payload.action === "save") {
      if (!isHomeModuleRecord(payload.module) || payload.module.id !== rawId) {
        return Response.json({ error: "Invalid homepage module payload" }, { status: 400 });
      }

      let canonicalModule: HomeModuleRecord;
      try {
        canonicalModule = canonicalizeHomeModule(payload.module);
      } catch (error) {
        return Response.json(
          {
            error:
              error instanceof Error ? error.message : "Invalid homepage module payload",
          },
          { status: 400 },
        );
      }

      if (rawId === "hotSales" && !payload.expectedUpdatedAt) {
        return Response.json({ error: "Hot Sales revision is required" }, { status: 400 });
      }
      const savedModule = rawId === "hotSales"
        ? await saveHotSalesModuleDraft(
            canonicalModule,
            payload.expectedUpdatedAt!,
          )
        : await saveHomeModuleDraft(canonicalModule);
      const linked = await syncLinkedModules(savedModule);
      return Response.json({ module: savedModule, ...linked });
    }

    if (payload.action === "publish") {
      if (rawId === "hotSales") {
        if (!payload.expectedUpdatedAt) {
          return Response.json({ error: "Hot Sales revision is required" }, { status: 400 });
        }
        const [modules, tours] = await Promise.all([
          loadAdminHomeModules(),
          loadAdminTours(),
        ]);
        const hotSales = modules.find((module) => module.id === "hotSales");
        if (!hotSales) {
          return Response.json({ error: "Hot Sales module is unavailable" }, { status: 404 });
        }
        validateHotSalesForPublish(
          hotSales.data,
          tours.map(mapTourRecordToPublicTour),
        );
        const result = await publishHotSalesModule(
          payload.expectedUpdatedAt,
          tours,
        );
        revalidatePublicSite();
        return Response.json({ module: result.module, tours: result.tours });
      }
      const publishedModule = await publishHomeModule(rawId);
      const linked = await syncLinkedModules(publishedModule);
      revalidatePublicSite();
      return Response.json({ module: publishedModule, ...linked });
    }

    return Response.json({ error: "Unsupported homepage module action" }, { status: 400 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to update homepage module" },
      {
        status:
          error instanceof HeroSlidesPublishError ||
          error instanceof HotSalesPublishError
            ? 400
            : error instanceof HotSalesConflictError
              ? 409
            : 500,
      },
    );
  }
}

async function syncLinkedModules(module: HomeModuleRecord): Promise<{
  settings?: SiteSettings;
  linkedModules?: HomeModuleRecord[];
}> {
  if (
    module.id === "finalCta" ||
    module.id === "navbar" ||
    module.id === "newsletter" ||
    module.id === "footer"
  ) {
    const settings = await syncContactFieldsToGlobalSettings(module);
    if (
      module.id === "navbar" ||
      module.id === "newsletter" ||
      module.id === "footer"
    ) {
      const linkedModules = await syncSharedPhonesToModules(settings);
      await syncContactFieldsToFinalCta(settings);
      return { settings, linkedModules };
    }
    return { settings };
  }

  return {};
}

function isHomeModuleId(value: string): value is HomeModuleId {
  return EXPECTED_CONTENT_MODULE_IDS.includes(value as HomeModuleId);
}

function isHomeModuleRecord(value: unknown): value is HomeModuleRecord {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<HomeModuleRecord>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.index === "number" &&
    Array.isArray(candidate.fields) &&
    Boolean(candidate.data) &&
    typeof candidate.data === "object" &&
    !Array.isArray(candidate.data)
  );
}
