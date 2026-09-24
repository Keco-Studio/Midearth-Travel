import { destinationsByMonth, type MonthEntry } from "../data/destinations-by-month.ts";
import { parseMonthEntries, serializeMonthEntries } from "./explore-by-month.ts";

export type BusToursContent = {
  monthEyebrowEn: string;
  monthEyebrowZh: string;
  monthTitleEn: string;
  monthTitleZh: string;
  regionEyebrowEn: string;
  regionEyebrowZh: string;
  regionTitleEn: string;
  regionTitleZh: string;
  monthsData: string;
};

export function createDefaultBusToursContent(): BusToursContent {
  return {
    monthEyebrowEn: "When to Go",
    monthEyebrowZh: "出行时间",
    monthTitleEn: "Popular Destinations by Month",
    monthTitleZh: "按月份选择热门目的地",
    regionEyebrowEn: "Explore the World",
    regionEyebrowZh: "探索世界",
    regionTitleEn: "Destinations by Region",
    regionTitleZh: "按地区浏览目的地",
    monthsData: serializeMonthEntries(destinationsByMonth),
  };
}

export function getBusToursContent(value: unknown): BusToursContent {
  const fallback = createDefaultBusToursContent();
  const parsed = parseContent(value);

  return {
    ...fallback,
    ...Object.fromEntries(
      Object.entries(fallback).map(([key, defaultValue]) => [
        key,
        key === "monthsData"
          ? serializeMonthEntries(parseMonthEntries(parsed[key]))
          : readString(parsed[key], defaultValue),
      ]),
    ),
  } as BusToursContent;
}

export function getBusToursMonthEntries(value: unknown): MonthEntry[] {
  return parseMonthEntries(getBusToursContent(value).monthsData);
}

function parseContent(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  if (typeof value !== "string" || !value.trim()) return {};

  try {
    const parsed = JSON.parse(value) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : {};
  } catch {
    return {};
  }
}

function readString(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}
