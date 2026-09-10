import { browseCategories, categoryMeta, type BrowseCategory } from "../data/categories.ts";
import { filterToursForCategory } from "../data/tour-filters.ts";
import { regions } from "../data/regions.ts";
import type { Tour } from "../data/tours.ts";

export type DestinationCategory = BrowseCategory & {
  id: string;
  titleEn: string;
  titleZh: string;
  summary?: string;
};

export type DestinationCategoryRow = {
  id: string;
  title_en: string;
  title_zh: string;
  summary?: string | null;
  image?: string | null;
  sort_order: number;
  updated_at: string;
};

const chineseTitles: Record<string, string> = {
  "north-america": "北美",
  asia: "亚洲",
  europe: "欧洲",
  "sun-destinations": "阳光度假目的地",
  "bus-tours": "巴士旅行团",
  "vacation-packages": "度假套餐",
};

function seedSummary(slug: string): string {
  return categoryMeta[slug]?.summary ?? regions.find((r) => r.slug === slug)?.summary ?? "";
}

export const destinationCategorySeeds: DestinationCategory[] = browseCategories.map(
  (category) => ({
    ...category,
    id: category.slug,
    titleEn: category.title,
    titleZh: chineseTitles[category.slug] ?? category.title,
    summary: seedSummary(category.slug),
  }),
);

export function toDestinationCategoryRow(
  category: DestinationCategory,
  index: number,
): DestinationCategoryRow {
  return {
    id: category.id,
    title_en: category.titleEn,
    title_zh: category.titleZh,
    summary: category.summary?.trim() || null,
    image: category.image?.trim() || null,
    sort_order: index + 1,
    updated_at: new Date().toISOString(),
  };
}

export function mergeDestinationCategoryRows(
  rows: readonly DestinationCategoryRow[],
): DestinationCategory[] {
  const rowsById = new Map(rows.map((row) => [row.id, row]));

  return destinationCategorySeeds.map((seed) => {
    const row = rowsById.get(seed.id);
    const titleEn = row?.title_en.trim() || seed.titleEn;
    const titleZh = row?.title_zh.trim() || seed.titleZh;
    const summary = row?.summary?.trim() || seed.summary;
    const image = row?.image?.trim() || seed.image;

    return {
      ...seed,
      title: titleEn,
      titleEn,
      titleZh,
      summary,
      image,
    };
  });
}

/** Live trip counts + cover image from the first tour in each Where to Go category. */
export function withLiveCategoryCounts(
  categories: readonly DestinationCategory[],
  tours: readonly Tour[],
): DestinationCategory[] {
  const sourceTours = [...tours];

  return categories.map((category) => {
    const categoryTours = filterToursForCategory(sourceTours, category.slug);
    const coverImage = categoryTours[0]?.image?.trim();
    const cmsImage = category.image?.trim();
    const seedImage = destinationCategorySeeds.find((s) => s.id === category.id)?.image;
    // Prefer an admin-edited image (differs from seed) over live tour cover.
    const hasCmsImageOverride = Boolean(cmsImage && cmsImage !== seedImage);

    return {
      ...category,
      count: categoryTours.length,
      image: hasCmsImageOverride ? cmsImage! : coverImage || cmsImage || category.image,
    };
  });
}
