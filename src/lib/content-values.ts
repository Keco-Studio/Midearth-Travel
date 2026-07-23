import type { ContentValue } from "@/types/cms";

export type ContentData = Record<string, ContentValue>;

export function getStringContent(
  data: ContentData,
  key: string,
  fallback: string,
): string {
  const value = data[key];
  return typeof value === "string" ? value : fallback;
}

export function getBooleanContent(
  data: ContentData,
  key: string,
  fallback: boolean,
): boolean {
  const value = data[key];
  return typeof value === "boolean" ? value : fallback;
}
