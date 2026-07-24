import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const adminShellSource = readFileSync(
  new URL("../src/components/admin-shell.tsx", import.meta.url),
  "utf8",
);
const adminPageSource = readFileSync(
  new URL("../src/app/admin/page.tsx", import.meta.url),
  "utf8",
);
const destinationEditorSource = readFileSync(
  new URL("../src/components/destination-category-editor.tsx", import.meta.url),
  "utf8",
);
const collectionEditorsSource = readFileSync(
  new URL("../src/components/home-collection-editors.tsx", import.meta.url),
  "utf8",
);

test("homepage detail editors use the global draft and publish actions", () => {
  assert.ok(!destinationEditorSource.includes("Save names"));
  assert.ok(!collectionEditorsSource.includes("Save data"));

  assert.ok(!destinationEditorSource.includes("loading="));
  assert.ok(!collectionEditorsSource.includes("loading={loading}"));
  assert.ok(!destinationEditorSource.includes("useEffect"));
  assert.ok(!collectionEditorsSource.includes("loadCollection"));
  assert.ok(adminPageSource.includes("await Promise.all"));
  assert.ok(adminShellSource.includes("await saveSupplementalHomeData(activeModule.id)"));
  assert.ok(adminShellSource.includes("hasSupplementalUnsavedChanges"));
});
