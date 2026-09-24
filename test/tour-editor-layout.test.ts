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
  "Trip essentials",
  "Pricing",
  "Tour descriptions",
  "Policies and exclusions",
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
    "onFinish={handleFinish}",
    "void handleImageSelection(file)",
    "onImageUpload",
    "onClick={removeImage}",
    "void handlePdfSelection(file)",
    "onClick={removePdf}",
    "onClick={onCancel}",
    'htmlType="submit"',
  ]) {
    assert.ok(editorSource.includes(contract), `missing interaction contract: ${contract}`);
  }
});

test("tour editor exposes all persisted tour detail fields", () => {
  for (const field of [
    'name="departureCity"',
    'name="localizedDepartureCity"',
    'name={["essentials", "departureTime"]}',
    'name={["essentials", "meetingPlace"]}',
    'name={["essentials", "localizedMeetingPlace"]}',
    'name={["essentials", "hotels"]}',
    'name={["essentials", "localizedHotels"]}',
    'name={["essentials", "escortedCoach"]}',
    'name={["essentials", "localizedEscortedCoach"]}',
    'name="admissions"',
    'name="localizedAdmissions"',
    'name="cancellation"',
    'name="localizedCancellation"',
    'name="importantNotice"',
    'name="localizedImportantNotice"',
    'name="included"',
    'name="localizedIncluded"',
    'name="notIncluded"',
    'name="localizedNotIncluded"',
  ]) {
    assert.ok(editorSource.includes(field), `missing tour detail field: ${field}`);
  }
});

test("tour editor marks the Chinese title as a Chinese text input", () => {
  assert.match(
    editorSource,
    /name="localizedTitle"[\s\S]{0,180}<Input lang="zh-CN" inputMode="text" className="font-zh" \/>/,
  );
});

test("tour editor separates the URL slug from the localized tour type", () => {
  assert.match(
    editorSource,
    /name="slug" label="Slug \(URL identifier\)"[\s\S]{0,120}<Input readOnly \/>/,
  );
  assert.match(
    editorSource,
    /name="localizedTourType" label="Tour type \(Chinese\)"[\s\S]{0,180}<Input lang="zh-CN" inputMode="text" className="font-zh" \/>/,
  );
  assert.match(
    editorSource,
    /name="tourType" label="Tour type \(English\)" rules=\{requiredRules\.tourType\}[\s\S]{0,80}<Input \/>/,
  );
  assert.doesNotMatch(editorSource, /TourTypeAutoComplete/);
});

test("tour editor accepts only local PDF uploads", () => {
  assert.ok(editorSource.includes('accept="application/pdf,.pdf"'));
  assert.ok(editorSource.includes('void handlePdfSelection(file)'));
  assert.ok(editorSource.includes('onClick={removePdf}'));
  assert.doesNotMatch(editorSource, /label="PDF URL"/);
  assert.doesNotMatch(editorSource, /placeholder="https:\/\/\.\.\.\/itinerary\.pdf"/);
});

test("tour editor manages gallery images through local uploads", () => {
  assert.ok(editorSource.includes("handleGallerySelection"));
  assert.ok(editorSource.includes("multiple"));
  assert.ok(editorSource.includes("galleryImages: galleryImages.join"));
  assert.doesNotMatch(editorSource, /name="galleryImages"/);
  assert.doesNotMatch(editorSource, /One image URL per line/);
});

test("tour editor shows a selected PDF while its upload is in progress", () => {
  assert.ok(editorSource.includes('setPdfFileName(file.name)'));
  assert.ok(editorSource.includes('const previousPdfFileName = pdfFileName'));
  assert.ok(editorSource.includes('setPdfFileName(previousPdfFileName)'));
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
