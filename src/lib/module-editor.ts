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
