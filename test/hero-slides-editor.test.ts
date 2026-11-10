import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const homeEditorSource = readFileSync(
  new URL("../src/components/home-module-editor.tsx", import.meta.url),
  "utf8",
);
const slideEditorSource = readFileSync(
  new URL("../src/components/hero-slides-editor.tsx", import.meta.url),
  "utf8",
);

test("uses a dedicated Hero slide editor instead of raw data fields", () => {
  assert.match(homeEditorSource, /import \{ HeroSlidesEditor \}/);
  assert.match(homeEditorSource, /module\.id === "hero"[\s\S]*<HeroSlidesEditor/);
  assert.match(homeEditorSource, /HERO_SLIDES_DATA_KEY/);
  assert.match(homeEditorSource, /field\.definition\.key === "backgroundImage"/);
  assert.match(homeEditorSource, /tours=\{tours\}/);
  assert.match(homeEditorSource, /onImageUpload=\{onImageUpload\}/);
});

test("supports every required slide management action", () => {
  assert.match(slideEditorSource, /createEmptyHeroSlide/);
  assert.match(slideEditorSource, /moveHeroSlide/);
  assert.match(slideEditorSource, /ArrowUpOutlined/);
  assert.match(slideEditorSource, /ArrowDownOutlined/);
  assert.match(slideEditorSource, /DeleteOutlined/);
  assert.match(slideEditorSource, /<Switch/);
  assert.match(slideEditorSource, /<Segmented/);
  assert.match(slideEditorSource, /<Select/);
  assert.match(slideEditorSource, /tour\.status === "published"/);
  assert.match(slideEditorSource, /<Upload/);
  assert.match(slideEditorSource, /validateInlineImageFile/);
});

test("uploads by stable slide id and synchronizes the compatibility background", () => {
  assert.match(slideEditorSource, /`slide-\$\{slide\.id\}`/);
  assert.match(slideEditorSource, /withHeroSlides\(content, next\)/);
  assert.match(slideEditorSource, /onChange\(HERO_SLIDES_DATA_KEY/);
  assert.match(slideEditorSource, /onChange\("backgroundImage"/);
});
