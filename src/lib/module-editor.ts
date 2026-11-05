import { validateFieldDefinition } from "./content-rules.ts";
import type { ContentValue, FieldDefinition, HomeModuleRecord } from "../types/cms.ts";

export type FieldViewModel = {
  definition: FieldDefinition;
  value: ContentValue | "";
  errors: string[];
};

export type ModuleValidationResult = Record<string, string[]>;

export function getHomeModuleEditorKey(module: HomeModuleRecord): string {
  return `${module.id}:${module.updatedAt}:${module.draftVersion ?? "published"}`;
}

export function getFieldSectionHeader(
  moduleId: HomeModuleRecord["id"],
  fieldKey: string,
): string | null {
  if (moduleId === "bookingPage") {
    if (fieldKey === "confirmationEmailSubjectEn") {
      return "Payment success email — English";
    }
    if (fieldKey === "confirmationEmailSubjectZh") {
      return "Payment success email — Chinese";
    }
  }
  if (moduleId === "bookingPage" || moduleId === "contactPage") {
    return fieldKey === "backgroundImage" ? "Page media & copy" : null;
  }
  if (moduleId !== "hero") return null;
  const cardMatch = /^card(\d)IconImage$/.exec(fieldKey);
  if (cardMatch) return `Feature card ${cardMatch[1]}`;
  if (fieldKey === "stat1Value") return "Stats";
  if (fieldKey === "primaryButtonText") return "Buttons";
  if (fieldKey === "backgroundImage") return "Hero media & headline";
  return null;
}

export function getFieldValue(module: HomeModuleRecord, key: string): ContentValue | "" {
  return module.data[key] ?? "";
}

export function getModuleFieldViewModels(module: HomeModuleRecord): FieldViewModel[] {
  return module.fields.map((definition) => {
    const value = getFieldValue(module, definition.key);

    return {
      definition,
      value,
      errors: validateFieldDefinition({
        ...definition,
        value,
      }),
    };
  });
}

export function validateModuleData(module: HomeModuleRecord): ModuleValidationResult {
  return getModuleFieldViewModels(module).reduce<ModuleValidationResult>((result, field) => {
    if (field.errors.length > 0) {
      result[field.definition.key] = field.errors;
    }

    return result;
  }, {});
}
