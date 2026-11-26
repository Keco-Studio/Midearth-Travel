import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const homeEditorSource = readFileSync(
  new URL("../src/components/home-module-editor.tsx", import.meta.url),
  "utf8",
);

test("Homepage Our Top Picks uses a dedicated ordered tour editor", () => {
  const topPicksEditorSource = readFileSync(
    new URL("../src/components/top-picks-editor.tsx", import.meta.url),
    "utf8",
  );

  assert.match(homeEditorSource, /module\.id === "toursSection"[\s\S]*<TopPicksEditor/);
  assert.match(homeEditorSource, /field\.definition\.key === TOP_PICKS_DATA_KEY/);
  assert.doesNotMatch(homeEditorSource, /This page only edits the section eyebrow and title/);
  assert.match(topPicksEditorSource, /parseTopPickSlugs/);
  assert.match(topPicksEditorSource, /addTopPickSlug/);
  assert.match(topPicksEditorSource, /moveTopPickSlug/);
  assert.match(topPicksEditorSource, /removeTopPickSlug/);
  assert.match(topPicksEditorSource, /Tour to add to Our Top Picks/);
  assert.match(topPicksEditorSource, /No Our Top Picks tours selected/);
});
