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
    url.toLocaleLowerCase("en").startsWith("https://") ||
    url.toLocaleLowerCase("en").startsWith("http://") ||
    url.toLocaleLowerCase("en").startsWith("data:image/")
  );
}

export function createStorageObjectPath(
  moduleId: string,
  fieldKey: string,
  fileName: string,
  timestamp = Date.now(),
): string {
  const normalizedFileName = fileName.toLocaleLowerCase("en");
  const extensionMatch = normalizedFileName.match(/\.([a-z0-9]+)$/);
  const extension = extensionMatch?.[1] ?? "jpg";
  const baseName = normalizedFileName
    .replace(/\.[a-z0-9]+$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "image";
  const safeModuleId = toSafePathSegment(moduleId, "module");
  const safeFieldKey = toSafePathSegment(fieldKey, "image");

  return `${safeModuleId}/${safeFieldKey}/${timestamp}-${baseName}.${extension}`;
}

export function isSupportedImageUploadContentType(
  contentType: string | null,
): boolean {
  const normalized = contentType?.toLocaleLowerCase("en") ?? "";
  return (
    normalized.startsWith("multipart/form-data") ||
    normalized.startsWith("application/x-www-form-urlencoded")
  );
}

function toSafePathSegment(value: string, fallback: string): string {
  return value.toLocaleLowerCase("en").replace(/[^a-z0-9]+/g, "") || fallback;
}
