import assert from "node:assert/strict";
import test from "node:test";
import {
  FORBIDDEN_FIELD_KEYS,
  HOME_MODULES,
  validateFieldDefinition,
  validateHomeModuleRegistry,
} from "../src/lib/content-rules.ts";

test("keeps homepage modules fixed in the approved order", () => {
  assert.deepEqual(validateHomeModuleRegistry(HOME_MODULES), []);
  assert.deepEqual(
    HOME_MODULES.map((module) => module.id),
    [
      "navbar",
      "hero",
      "toursSection",
      "categoryGrid",
      "exploreByMonth",
      "aboutSection",
      "testimonials",
      "finalCta",
      "newsletter",
      "footer",
    ],
  );
});

test("rejects registry changes that would allow module creation or reorder", () => {
  const changedRegistry = [
    HOME_MODULES[1],
    HOME_MODULES[0],
    ...HOME_MODULES.slice(2),
  ];

  assert.deepEqual(validateHomeModuleRegistry(changedRegistry), [
    "Homepage module at position 1 must be navbar.",
    "Homepage module at position 2 must be hero.",
  ]);
});

test("rejects layout-control field keys", () => {
  assert.ok(FORBIDDEN_FIELD_KEYS.includes("className"));
  assert.deepEqual(
    validateFieldDefinition({
      key: "className",
      label: "Class name",
      type: "text",
    }),
    ["Field key className is not allowed because CMS content cannot control layout."],
  );
});

test("validates required text and maximum length rules", () => {
  assert.deepEqual(
    validateFieldDefinition({
      key: "titleMain",
      label: "Main title",
      type: "text",
      required: true,
      maxLength: 40,
      value: "",
    }),
    ["Main title is required."],
  );

  assert.deepEqual(
    validateFieldDefinition({
      key: "titleMain",
      label: "Main title",
      type: "text",
      maxLength: 4,
      value: "Travel",
    }),
    ["Main title must be 4 characters or fewer."],
  );
});
