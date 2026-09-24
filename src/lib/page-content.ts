import { getStringContent, type ContentData } from "./content-values.ts";

export const DEFAULT_PUBLIC_PAGE_BACKGROUND = "/hero/hero-coast.jpg";

export function getPageBackgroundImage(
  pageContent: ContentData,
  heroContent: ContentData,
): string {
  return (
    getStringContent(pageContent, "backgroundImage", "").trim() ||
    getStringContent(heroContent, "backgroundImage", "").trim() ||
    DEFAULT_PUBLIC_PAGE_BACKGROUND
  );
}
