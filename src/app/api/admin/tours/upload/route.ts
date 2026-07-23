import {
  isSupportedImageUploadContentType,
  validateInlineImageFile,
} from "@/lib/inline-image-upload";
import { uploadTourImage } from "@/lib/supabase-tours";

export async function POST(request: Request) {
  try {
    if (!isSupportedImageUploadContentType(request.headers.get("content-type"))) {
      return Response.json({ error: "Select an image file" }, { status: 400 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const slug = formData.get("slug");

    if (!(file instanceof File) || typeof slug !== "string" || !slug.trim()) {
      return Response.json({ error: "Tour image and slug are required" }, { status: 400 });
    }

    const validation = validateInlineImageFile(file);
    if (!validation.ok) {
      return Response.json({ error: validation.error }, { status: 400 });
    }

    return Response.json({ url: await uploadTourImage({ slug, file }) });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Tour image upload failed" },
      { status: 500 },
    );
  }
}
