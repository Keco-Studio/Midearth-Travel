import type { FieldDefinition, HomeModuleDefinition, HomeModuleId } from "../types/cms.ts";

export const EXPECTED_HOME_MODULE_IDS = [
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
] as const satisfies readonly HomeModuleId[];

export const HOME_MODULES: readonly HomeModuleDefinition[] = [
  { id: "navbar", name: "Navigation" },
  { id: "hero", name: "Hero" },
  { id: "toursSection", name: "Featured Tours" },
  { id: "categoryGrid", name: "Destination Categories" },
  { id: "exploreByMonth", name: "Explore By Month" },
  { id: "aboutSection", name: "Travel Services" },
  { id: "testimonials", name: "Testimonials" },
  { id: "finalCta", name: "Final CTA" },
  { id: "newsletter", name: "Quote Request" },
  { id: "footer", name: "Footer" },
];

export const FORBIDDEN_FIELD_KEYS = [
  "layout",
  "columns",
  "order",
  "width",
  "height",
  "style",
  "className",
  "css",
  "html",
  "script",
  "fontSize",
  "gridTemplate",
  "component",
  "moduleType",
] as const;

export function validateHomeModuleRegistry(
  modules: readonly Pick<HomeModuleDefinition, "id">[],
): string[] {
  const errors: string[] = [];

  EXPECTED_HOME_MODULE_IDS.forEach((expectedId, index) => {
    const actualId = modules[index]?.id;
    if (actualId !== expectedId) {
      errors.push(`Homepage module at position ${index + 1} must be ${expectedId}.`);
    }
  });

  if (modules.length !== EXPECTED_HOME_MODULE_IDS.length) {
    errors.push(
      `Homepage module registry must contain exactly ${EXPECTED_HOME_MODULE_IDS.length} modules.`,
    );
  }

  return errors;
}

export function validateFieldDefinition(field: FieldDefinition): string[] {
  const errors: string[] = [];

  if (FORBIDDEN_FIELD_KEYS.includes(field.key as (typeof FORBIDDEN_FIELD_KEYS)[number])) {
    errors.push(
      `Field key ${field.key} is not allowed because CMS content cannot control layout.`,
    );
  }

  if (field.required && isEmptyValue(field.value)) {
    errors.push(`${field.label} is required.`);
  }

  if (
    typeof field.value === "string" &&
    typeof field.maxLength === "number" &&
    field.value.length > field.maxLength
  ) {
    errors.push(`${field.label} must be ${field.maxLength} characters or fewer.`);
  }

  return errors;
}

function isEmptyValue(value: FieldDefinition["value"]): boolean {
  return value === undefined || value === null || value === "";
}
