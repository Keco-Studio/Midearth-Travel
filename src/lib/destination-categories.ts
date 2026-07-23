import { browseCategories, type BrowseCategory } from "../data/categories.ts";

export type DestinationCategory = BrowseCategory & {
  id: string;
  titleEn: string;
  titleZh: string;
};

export type DestinationCategoryRow = {
  id: string;
  title_en: string;
  title_zh: string;
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

export const destinationCategorySeeds: DestinationCategory[] = browseCategories.map(
  (category) => ({
    ...category,
    id: category.slug,
    titleEn: category.title,
    titleZh: chineseTitles[category.slug] ?? category.title,
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

    return {
      ...seed,
      title: titleEn,
      titleEn,
      titleZh,
    };
  });
}
