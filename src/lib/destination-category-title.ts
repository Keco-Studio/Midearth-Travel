import {
  destinationCategorySeeds,
  type DestinationCategory,
} from "./destination-categories.ts";

/** Display title for a Where to Go / region slug from Destination names. */
export function getDestinationCategoryTitle(
  slug: string,
  categories: readonly DestinationCategory[] = destinationCategorySeeds,
  lang: "en" | "zh" = "en",
): string {
  const normalized = slug.trim().replaceAll("_", "-");
  const live = categories.find((category) => category.id === normalized);
  const liveTitle = lang === "zh" ? live?.titleZh : live?.titleEn;
  if (liveTitle?.trim()) return liveTitle.trim();
  if (live?.titleEn.trim()) return live.titleEn.trim();

  const seed = destinationCategorySeeds.find((category) => category.id === normalized);
  return (lang === "zh" ? seed?.titleZh : seed?.titleEn) ?? seed?.titleEn ?? slug;
}
