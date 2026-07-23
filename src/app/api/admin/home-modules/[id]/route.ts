import { EXPECTED_HOME_MODULE_IDS } from "@/lib/content-rules";
import { canonicalizeHomeModule } from "@/lib/home-content";
import { publishHomeModule, saveHomeModuleDraft } from "@/lib/supabase-home-content";
import type { HomeModuleId, HomeModuleRecord } from "@/types/cms";

type UpdatePayload =
  | { action: "save"; module: HomeModuleRecord }
  | { action: "publish" };

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
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

      const savedModule = await saveHomeModuleDraft(canonicalModule);
      return Response.json({ module: savedModule });
    }

    if (payload.action === "publish") {
      const publishedModule = await publishHomeModule(rawId);
      return Response.json({ module: publishedModule });
    }

    return Response.json({ error: "Unsupported homepage module action" }, { status: 400 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to update homepage module" },
      { status: 500 },
    );
  }
}

function isHomeModuleId(value: string): value is HomeModuleId {
  return EXPECTED_HOME_MODULE_IDS.includes(value as HomeModuleId);
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
