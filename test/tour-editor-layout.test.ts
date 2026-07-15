import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const editorSource = readFileSync(
  new URL("../src/components/tour-editor.tsx", import.meta.url),
  "utf8",
);

const sectionTitles = [
  "Tour information",
  "Schedule and highlights",
  "Pricing",
  "Tour descriptions",
  "Media and PDF",
  "Publishing and categories",
];

test("tour editor preserves its section order and interaction handlers", () => {
  let previousIndex = -1;

  for (const title of sectionTitles) {
    const index = editorSource.indexOf(`title="${title}"`);
    assert.ok(index > previousIndex, `${title} must remain in its existing order`);
    previousIndex = index;
  }

  for (const contract of [
    "onFinish={onUpdate}",
    "beforeUpload={handleImageSelection}",
    "onClick={removeImage}",
    "beforeUpload={handlePdfSelection}",
    "onClick={removePdf}",
    "onClick={onCancel}",
    'htmlType="submit"',
  ]) {
    assert.ok(editorSource.includes(contract), `missing interaction contract: ${contract}`);
  }
});

test("tour editor exposes only presentational layout hooks", () => {
  for (const className of [
    "cms-tour-editor-form",
    "cms-tour-editor-section-heading",
    "cms-tour-editor-section-marker",
    "cms-tour-editor-section-body",
    "cms-tour-editor-price-grid",
    "cms-tour-editor-media-grid",
    "cms-tour-editor-publishing-grid",
    "cms-tour-editor-publishing-controls",
    "cms-tour-editor-toggle",
  ]) {
    assert.ok(editorSource.includes(className), `missing layout hook: ${className}`);
  }
});

const adminCss = readFileSync(
  new URL("../src/app/admin/admin.css", import.meta.url),
  "utf8",
);

test("tour editor styles are scoped and responsive", () => {
  for (const selector of [
    ".cms-tour-editor-form",
    ".cms-tour-editor-section-heading",
    ".cms-tour-editor-section-marker",
    ".cms-tour-editor-price-grid",
    ".cms-tour-editor-toggle",
    ".cms-tour-editor-publishing-controls",
  ]) {
    assert.ok(adminCss.includes(selector), `missing editor selector: ${selector}`);
  }

  assert.match(adminCss, /@media \(min-width: 1200px\)/);
  assert.match(adminCss, /@media \(max-width: 575px\)/);
  assert.match(adminCss, /grid-template-columns:\s*repeat\(5, minmax\(0, 1fr\)\)/);
  assert.match(adminCss, /background:\s*#c8953f/);
});
