import assert from "node:assert/strict";
import test from "node:test";
import { homeModuleSeeds } from "../src/data/cms-seed.ts";
import {
  canonicalizeHomeModule,
  createDraftHomeModuleRow,
  createPublishedHomeModuleRow,
  getBooleanContent,
  getStringContent,
  mergeHomeModuleRows,
  toHomeModuleRow,
  type HomeModuleRow,
} from "../src/lib/home-content.ts";

const heroSeed = homeModuleSeeds.find((module) => module.id === "hero");

if (!heroSeed) {
  throw new Error("Hero seed is required for tests");
}

const storedHero: HomeModuleRow = {
  id: "hero",
  module_index: 2,
  name: "Hero",
  description: "Stored hero",
  status: "draft",
  published_version: 3,
  draft_version: 4,
  fields: heroSeed.fields,
  published_data: {
    ...heroSeed.data,
    titleMain: "Published title",
  },
  draft_data: {
    ...heroSeed.data,
    titleMain: "Draft title",
  },
  updated_at: "2026-07-23T10:00:00.000Z",
};

test("merges stored rows over the fixed seed registry", () => {
  const modules = mergeHomeModuleRows([storedHero], "published");
  const hero = modules.find((module) => module.id === "hero");

  assert.equal(modules.length, homeModuleSeeds.length);
  assert.equal(modules[0].id, "navbar");
  assert.equal(hero?.description, heroSeed.description);
  assert.equal(hero?.data.titleMain, "Published title");
});

test("uses draft data for the admin view without changing published data", () => {
  const draftHero = mergeHomeModuleRows([storedHero], "draft").find(
    (module) => module.id === "hero",
  );
  const publishedHero = mergeHomeModuleRows([storedHero], "published").find(
    (module) => module.id === "hero",
  );

  assert.equal(draftHero?.data.titleMain, "Draft title");
  assert.equal(publishedHero?.data.titleMain, "Published title");
});

test("serializes seed modules into initial Supabase rows", () => {
  const row = toHomeModuleRow(heroSeed);

  assert.equal(row.id, "hero");
  assert.deepEqual(row.draft_data, heroSeed.data);
  assert.deepEqual(row.published_data, heroSeed.data);
  assert.equal(row.module_index, 2);
});

test("reads typed values and falls back when stored data has the wrong type", () => {
  const data = {
    title: "Stored title",
    visible: true,
    invalidTitle: false,
    invalidVisible: "yes",
  };

  assert.equal(getStringContent(data, "title", "Fallback"), "Stored title");
  assert.equal(getStringContent(data, "invalidTitle", "Fallback"), "Fallback");
  assert.equal(getBooleanContent(data, "visible", false), true);
  assert.equal(getBooleanContent(data, "invalidVisible", false), false);
});

test("saving a draft preserves the published homepage data", () => {
  const editedModule = {
    ...heroSeed,
    data: {
      ...heroSeed.data,
      titleMain: "New draft title",
    },
  };
  const row = createDraftHomeModuleRow(storedHero, editedModule, "2026-07-23T11:00:00.000Z");

  assert.equal(row.status, "draft");
  assert.equal(row.draft_version, 5);
  assert.equal(row.draft_data?.titleMain, "New draft title");
  assert.equal(row.published_data.titleMain, "Published title");
});

test("publishing promotes the saved draft and increments the published version", () => {
  const row = createPublishedHomeModuleRow(storedHero, "2026-07-23T12:00:00.000Z");

  assert.equal(row.status, "published");
  assert.equal(row.published_version, 4);
  assert.equal(row.draft_version, null);
  assert.equal(row.published_data.titleMain, "Draft title");
  assert.equal(row.draft_data?.titleMain, "Draft title");
});

test("canonicalizes saved modules against the fixed seed schema", () => {
  const candidate = {
    ...heroSeed,
    name: "Client controlled name",
    fields: [
      ...heroSeed.fields,
      { key: "script", label: "Script", type: "text" as const },
    ],
    data: {
      ...heroSeed.data,
      titleMain: "Canonical title",
      script: "alert(1)",
    },
  };
  const canonical = canonicalizeHomeModule(candidate);

  assert.equal(canonical.name, heroSeed.name);
  assert.deepEqual(canonical.fields, heroSeed.fields);
  assert.equal(canonical.data.titleMain, "Canonical title");
  assert.equal(canonical.data.script, undefined);
});

test("rejects invalid required, typed, and link values before persistence", () => {
  assert.throws(
    () =>
      canonicalizeHomeModule({
        ...heroSeed,
        data: { ...heroSeed.data, titleMain: "" },
      }),
    /Main title is required/,
  );
  assert.throws(
    () =>
      canonicalizeHomeModule({
        ...homeModuleSeeds.find((module) => module.id === "exploreByMonth")!,
        data: {
          ...homeModuleSeeds.find((module) => module.id === "exploreByMonth")!.data,
          isVisible: "yes",
        },
      }),
    /Visible on public site must be a boolean/,
  );
  assert.throws(
    () =>
      canonicalizeHomeModule({
        ...heroSeed,
        data: { ...heroSeed.data, primaryButtonLink: "javascript:alert(1)" },
      }),
    /Primary button link must use a supported URL/,
  );
});
