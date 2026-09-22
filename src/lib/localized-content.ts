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
    shortDuration: "Up to 3 days",
    mediumDuration: "4-7 days",
    longDuration: "8+ days",
    tripCount: "{{count}} trips",
    noMatches: "Nothing matched.",
    noMatchesDescription: "Try a wider region, or send us a note - we plan custom trips constantly.",
    requestCustomTrip: "Request a custom trip",
    from: "from",
    viewTour: "View",
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
    tour: "Tour",
    departures: "Departures",
    departuresFrom: "Departures from {{city}}",
    dayByDay: "Day by day",
    dayByDayDescription: "A clear overview of each stage of the journey so you know what to expect on the road.",
    day: "Day {{day}}",
    policiesAndInformation: "Policies and practical information",
    admissions: "Admissions",
    cancellation: "Cancellation",
    importantNotice: "Important notice",
    departureTime: "Departure time",
    meetingPlace: "Meeting place",
    hotels: "Hotels",
    escortedCoach: "Escorted coach",
    tourFares: "Tour fares",
    perPerson: "Per person",
    callForQuote: "Call for quote - pricing varies by season and room type.",
    call: "Call",
    readyFor: "Ready for {{title}}?",
    bookingCtaDescription: "Email us to reserve your seats, or call our Ottawa office - we'll confirm availability and next steps{{tourCode}}.",
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
    shortDuration: "3 天以内",
    mediumDuration: "4-7 天",
    longDuration: "8 天以上",
    tripCount: "{{count}} 个行程",
    noMatches: "没有匹配结果。",
    noMatchesDescription: "请扩大筛选范围，或联系我们定制行程。",
    requestCustomTrip: "咨询定制行程",
    from: "起价",
    viewTour: "查看",
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
    tour: "旅游行程",
    departures: "出发日期",
    departuresFrom: "从 {{city}} 出发",
    dayByDay: "每日行程",
    dayByDayDescription: "逐日了解旅程安排，清楚掌握沿途的每个阶段。",
    day: "第 {{day}} 天",
    policiesAndInformation: "政策和实用信息",
    admissions: "门票",
    cancellation: "取消政策",
    importantNotice: "重要提示",
    departureTime: "出发时间",
    meetingPlace: "集合地点",
    hotels: "酒店",
    escortedCoach: "随团巴士",
    tourFares: "行程价格",
    perPerson: "每人",
    callForQuote: "请联系我们获取报价。价格因季节和房型而异。",
    call: "致电",
    readyFor: "准备好前往 {{title}} 了吗？",
    bookingCtaDescription: "请通过电子邮件预留座位，或致电渥太华办公室，我们将确认可用情况和后续安排{{tourCode}}。",
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
  values: Record<string, string | number> = {},
): string {
  const value = staticText[lang][key];

  if (key === "tripCount") {
    const count = Number(values.count ?? 0);
    return lang === "en" ? `${count} ${count === 1 ? "trip" : "trips"}` : `${count} 个行程`;
  }

  return value.replace(/{{(\w+)}}/g, (_, name: string) => String(values[name] ?? ""));
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
