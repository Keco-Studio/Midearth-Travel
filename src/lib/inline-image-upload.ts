export const MAX_INLINE_IMAGE_BYTES = 5 * 1024 * 1024;

type ImageFileMetadata = {
  type: string;
  size: number;
};

export type InlineImageValidation =
  | { ok: true }
  | { ok: false; error: "Select an image file" | "Image must be 5 MB or smaller" };

export function validateInlineImageFile(file: ImageFileMetadata): InlineImageValidation {
  if (!file.type.toLocaleLowerCase("en").startsWith("image/")) {
    return { ok: false, error: "Select an image file" };
  }

  if (file.size > MAX_INLINE_IMAGE_BYTES) {
    return { ok: false, error: "Image must be 5 MB or smaller" };
  }

  return { ok: true };
}

export function isPreviewableImageUrl(value: string): boolean {
  const url = value.trim();
  return (
    (url.startsWith("/") && !url.startsWith("//")) ||
    url.toLocaleLowerCase("en").startsWith("data:image/")
  );
}
