import type { Lang } from "../context/lang-context.tsx";

type LocalizedData = Record<string, unknown>;

const staticText = {
  en: {
    bookNow: "Book Now",
    seeAllTours: "See all tours",
    searchTours: "Search tours, destinations, highlights",
    region: "Region",
    allRegions: "All regions",
    duration: "Duration",
    anyLength: "Any length",
    sort: "Sort",
    featured: "Featured",
    shortest: "Shortest",
    noMatches: "Nothing matched.",
    requestCustomTrip: "Request a custom trip",
    tours: "Tours",
    services: "Services",
    contactUs: "Contact Us",
    phone: "Phone",
    email: "Email",
    office: "Office",
    included: "Included",
    notIncluded: "Not included",
    tripEssentials: "Trip essentials",
    bookThisTour: "Book this tour",
    contactForDates: "Contact for dates",
  },
  zh: {
    bookNow: "立即预订",
    seeAllTours: "查看全部旅游行程",
    searchTours: "搜索旅游线路、目的地、亮点",
    region: "地区",
    allRegions: "所有地区",
    duration: "行程天数",
    anyLength: "不限天数",
    sort: "排序",
    featured: "精选",
    shortest: "最短行程",
    noMatches: "没有匹配结果。",
    requestCustomTrip: "咨询定制行程",
    tours: "旅游行程",
    services: "服务",
    contactUs: "联系我们",
    phone: "电话",
    email: "电子邮箱",
    office: "办公室",
    included: "费用包含",
    notIncluded: "费用不包含",
    tripEssentials: "行程须知",
    bookThisTour: "预订此行程",
    contactForDates: "联系我们了解日期",
  },
} as const;

export type LocalizedStaticTextKey = keyof typeof staticText.en;

function getPopulatedString(data: LocalizedData, key: string): string | undefined {
  const value = data[key];
  return typeof value === "string" && value.trim() ? value : undefined;
}

/** Select CMS copy while keeping legacy unpaired content readable. */
export function getLocalizedContent(
  data: LocalizedData,
  key: string,
  lang: Lang,
  fallback: string,
): string {
  const selected = getPopulatedString(data, `${key}${lang === "zh" ? "Zh" : "En"}`);
  if (selected !== undefined) return selected;

  const english = getPopulatedString(data, `${key}En`);
  if (english !== undefined) return english;

  return getPopulatedString(data, key) ?? fallback;
}

export function getLocalizedStaticText(
  lang: Lang,
  key: LocalizedStaticTextKey,
): string {
  return staticText[lang][key];
}

export function getLocalizedTourValue(
  lang: Lang,
  localized: string | undefined,
  fallback: string,
): string {
  return lang === "zh" && localized?.trim() ? localized.trim() : fallback;
}

export function getLocalizedTourList(
  lang: Lang,
  localized: readonly string[] | undefined,
  fallback: readonly string[],
): string[] {
  return lang === "zh" && localized && localized.length > 0
    ? [...localized]
    : [...fallback];
}
