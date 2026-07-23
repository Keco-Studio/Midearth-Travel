import { isSupportedImageUploadContentType, validateInlineImageFile } from "@/lib/inline-image-upload";
import { uploadServiceImage } from "@/lib/supabase-home-collections";

export async function POST(request: Request) {
  try {
    if (!isSupportedImageUploadContentType(request.headers.get("content-type"))) {
      return Response.json({ error: "Select an image file" }, { status: 400 });
    }
    const formData = await request.formData();
    const file = formData.get("file");
    const id = formData.get("id");
    if (!(file instanceof File) || typeof id !== "string" || !id) {
      return Response.json({ error: "Service and image are required" }, { status: 400 });
    }
    const validation = validateInlineImageFile(file);
    if (!validation.ok) return Response.json({ error: validation.error }, { status: 400 });
    return Response.json({ url: await uploadServiceImage(id, file) });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Service image upload failed" },
      { status: 500 },
    );
  }
}
