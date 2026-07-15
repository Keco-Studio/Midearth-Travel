import assert from "node:assert/strict";
import test from "node:test";
import {
  MAX_INLINE_IMAGE_BYTES,
  isPreviewableImageUrl,
  validateInlineImageFile,
} from "../src/lib/inline-image-upload.ts";

test("accepts image files up to five megabytes", () => {
  assert.equal(MAX_INLINE_IMAGE_BYTES, 5 * 1024 * 1024);
  assert.deepEqual(
    validateInlineImageFile({ type: "image/png", size: MAX_INLINE_IMAGE_BYTES }),
    { ok: true },
  );
});

test("rejects non-image and oversized files", () => {
  assert.deepEqual(validateInlineImageFile({ type: "application/pdf", size: 1000 }), {
    ok: false,
    error: "Select an image file",
  });
  assert.deepEqual(
    validateInlineImageFile({ type: "image/jpeg", size: MAX_INLINE_IMAGE_BYTES + 1 }),
    {
      ok: false,
      error: "Image must be 5 MB or smaller",
    },
  );
});

test("allows local paths and image data URLs for previews", () => {
  assert.equal(isPreviewableImageUrl("/hero/hero1.jpg"), true);
  assert.equal(isPreviewableImageUrl("data:image/png;base64,AAAA"), true);
  assert.equal(isPreviewableImageUrl("https://example.com/image.jpg"), false);
  assert.equal(isPreviewableImageUrl("data:application/pdf;base64,AAAA"), false);
  assert.equal(isPreviewableImageUrl(""), false);
});
