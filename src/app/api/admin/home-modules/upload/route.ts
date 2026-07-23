import { EXPECTED_HOME_MODULE_IDS } from "@/lib/content-rules";
import {
  isSupportedImageUploadContentType,
  validateInlineImageFile,
} from "@/lib/inline-image-upload";
import { uploadHomeModuleImage } from "@/lib/supabase-home-content";
import type { HomeModuleId } from "@/types/cms";

export async function POST(request: Request) {
  try {
    if (!isSupportedImageUploadContentType(request.headers.get("content-type"))) {
      return Response.json({ error: "Select an image file" }, { status: 400 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const rawModuleId = formData.get("moduleId");
    const fieldKey = formData.get("fieldKey");

    if (!(file instanceof File)) {
      return Response.json({ error: "Select an image file" }, { status: 400 });
    }

    if (typeof rawModuleId !== "string" || !isHomeModuleId(rawModuleId)) {
      return Response.json({ error: "Unknown homepage module" }, { status: 400 });
    }

    if (typeof fieldKey !== "string" || !fieldKey.trim()) {
      return Response.json({ error: "Image field is required" }, { status: 400 });
    }

    const validation = validateInlineImageFile(file);
    if (!validation.ok) {
      return Response.json({ error: validation.error }, { status: 400 });
    }

    const url = await uploadHomeModuleImage({
      moduleId: rawModuleId,
      fieldKey,
      file,
    });

    return Response.json({ url });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Image upload failed" },
      { status: 500 },
    );
  }
}

function isHomeModuleId(value: string): value is HomeModuleId {
  return EXPECTED_HOME_MODULE_IDS.includes(value as HomeModuleId);
}
