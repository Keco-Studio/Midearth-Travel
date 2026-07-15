import assert from "node:assert/strict";
import test from "node:test";
import {
  TOUR_EDITOR_STORAGE_KEY,
  applyTourEditorRecords,
  buildTourEditorStorage,
  parseTourEditorStorage,
  replaceTourEditorRecord,
  validateTourEditorRecord,
} from "../src/lib/tour-editor-state.ts";
import { mapTravelToursToRecords } from "../src/lib/travel-data-mapper.ts";

test("uses isolated versioned tour editor storage", () => {
  assert.equal(TOUR_EDITOR_STORAGE_KEY, "midearth-cms.tour-editor.v1");
});

test("validates and trims editable tour fields", () => {
  const record = mapTravelToursToRecords()[0];
  const validation = validateTourEditorRecord({
    ...record,
    title: "  Updated title  ",
    localizedTitle: "  Local title  ",
    fares: { ...record.fares, child: "  $100  " },
  });

  assert.equal(validation.ok, true);
  if (validation.ok) {
    assert.equal(validation.value.title, "Updated title");
    assert.equal(validation.value.localizedTitle, "Local title");
    assert.equal(validation.value.fares.child, "$100");
  }
});

test("rejects missing required editor fields", () => {
  const record = mapTravelToursToRecords()[0];

  assert.deepEqual(
    validateTourEditorRecord({
      ...record,
      title: " ",
      slug: " ",
      region: " ",
      duration: " ",
      tourType: " ",
    }),
    {
      ok: false,
      errors: {
        title: "Enter an English title",
        slug: "Enter a slug",
        region: "Enter a region",
        duration: "Enter an English duration",
        tourType: "Select a tour type",
      },
    },
  );
});

test("parses complete saved records and ignores malformed storage", () => {
  const record = mapTravelToursToRecords()[0];
  const stored = { version: 1 as const, records: [record] };

  assert.deepEqual(parseTourEditorStorage(JSON.stringify(stored)), stored);
  assert.deepEqual(parseTourEditorStorage("{"), { version: 1, records: [] });
  assert.deepEqual(parseTourEditorStorage(JSON.stringify({ version: 2, records: [record] })), {
    version: 1,
    records: [],
  });
  assert.deepEqual(
    parseTourEditorStorage(JSON.stringify({ version: 1, records: [{ slug: "partial" }] })),
    { version: 1, records: [] },
  );
});

test("applies saved records only to known tour slugs", () => {
  const source = mapTravelToursToRecords();
  const edited = { ...source[0], title: "Edited" };
  const unknown = { ...source[0], slug: "unknown", title: "Unknown" };
  const result = applyTourEditorRecords(source, [edited, unknown]);

  assert.equal(result[0].title, "Edited");
  assert.equal(result.length, source.length);
  assert.equal(result.some(({ slug }) => slug === "unknown"), false);
});

test("keeps temporary image previews out of browser storage", () => {
  const source = mapTravelToursToRecords();
  const current = source.map((record, index) =>
    index === 0 ? { ...record, title: "Edited", image: "blob:preview" } : record,
  );
  const stored = buildTourEditorStorage(source, current);

  assert.equal(stored.records[0].title, "Edited");
  assert.equal(stored.records[0].image, source[0].image);
});

test("replaces only the edited tour record", () => {
  const source = mapTravelToursToRecords();
  const edited = { ...source[0], title: "Edited" };
  const result = replaceTourEditorRecord(source, edited);

  assert.equal(result[0].title, "Edited");
  assert.equal(result[1], source[1]);
});

test("normalizes tour descriptions before an editor update is saved", () => {
  const record = mapTravelToursToRecords()[0];
  const validation = validateTourEditorRecord({
    ...record,
    description: "Day 1\nVisit Ottawa",
    localizedDescription: "<p><br></p>",
  });

  assert.equal(validation.ok, true);
  if (validation.ok) {
    assert.equal(validation.value.description, "<p>Day 1<br />Visit Ottawa</p>");
    assert.equal(validation.value.localizedDescription, "");
  }
});
