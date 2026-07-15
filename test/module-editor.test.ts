import assert from "node:assert/strict";
import test from "node:test";
import {
  getFieldValue,
  getModuleFieldViewModels,
  validateModuleData,
} from "../src/lib/module-editor.ts";
import type { HomeModuleRecord } from "../src/types/cms.ts";

const sampleModule: HomeModuleRecord = {
  id: "hero",
  index: 2,
  name: "Hero",
  description: "Hero content",
  status: "draft",
  publishedVersion: 7,
  draftVersion: 8,
  updatedAt: "2026-07-06T09:00:00Z",
  fields: [
    { key: "titleMain", label: "Main title", type: "text", required: true, maxLength: 8 },
    { key: "isVisible", label: "Visible", type: "toggle" },
  ],
  data: {
    titleMain: "Travel",
    isVisible: true,
  },
};

test("reads typed field values from module data", () => {
  assert.equal(getFieldValue(sampleModule, "titleMain"), "Travel");
  assert.equal(getFieldValue(sampleModule, "isVisible"), true);
  assert.equal(getFieldValue(sampleModule, "missing"), "");
});

test("creates field view models with values and validation errors", () => {
  const moduleWithInvalidData = {
    ...sampleModule,
    data: {
      titleMain: "Too long title",
      isVisible: true,
    },
  };

  assert.deepEqual(getModuleFieldViewModels(moduleWithInvalidData), [
    {
      definition: sampleModule.fields[0],
      value: "Too long title",
      errors: ["Main title must be 8 characters or fewer."],
    },
    {
      definition: sampleModule.fields[1],
      value: true,
      errors: [],
    },
  ]);
});

test("validates all module fields", () => {
  const invalidModule = {
    ...sampleModule,
    data: {
      titleMain: "",
      isVisible: true,
    },
  };

  assert.deepEqual(validateModuleData(invalidModule), {
    titleMain: ["Main title is required."],
  });
});
