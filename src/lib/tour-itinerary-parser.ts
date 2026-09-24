import type { TourDay } from "../data/tours.ts";
import { richTextToPlainText } from "./rich-text-content.ts";

/** Matches English and Chinese day headings, such as "Day 1:" and "第 1 天：". */
export const DAY_HEADING_PATTERN =
  /Day\s+\d+(?:\s*\([^)]*\))?\s*:|第\s*\d+\s*天\s*[：:]/i;

const DAY_HEADING_SPLIT_PATTERN =
  /(?=Day\s+\d+(?:\s*\([^)]*\))?\s*:|第\s*\d+\s*天\s*[：:])/i;
const ENGLISH_DAY_SEGMENT_PATTERN =
  /^Day\s+(\d+)(?:\s*\(([^)]*)\))?\s*:\s*([\s\S]*)$/i;
const CHINESE_DAY_SEGMENT_PATTERN =
  /^第\s*(\d+)\s*天\s*[：:]\s*([\s\S]*)$/;

const narrativeStartPattern =
  /\b(Depart|Arrive|Visit|Continue|Transfer|Overnight|Today|After|In the|This morning|We |Our |Upon |Enjoy |Pick )\b/;

export function hasDayByDayHeading(text: string): boolean {
  return DAY_HEADING_PATTERN.test(text);
}

export function parseItineraryFromRichText(description: string): TourDay[] {
  // CMS day headings are normally bold. Preserve the boundary after the heading
  // so the route title and narrative can be separated after stripping markup.
  const plain = richTextToPlainText(
    description.replace(/<\/strong>\s*/gi, "</strong><br />"),
  );
  if (!plain || !hasDayByDayHeading(plain)) {
    return [];
  }

  const segments = plain.split(DAY_HEADING_SPLIT_PATTERN).filter(Boolean);
  const days: TourDay[] = [];

  for (const segment of segments) {
    const trimmedSegment = segment.trim();
    const englishMatch = ENGLISH_DAY_SEGMENT_PATTERN.exec(trimmedSegment);
    const chineseMatch = CHINESE_DAY_SEGMENT_PATTERN.exec(trimmedSegment);
    if (!englishMatch && !chineseMatch) continue;

    const day = Number.parseInt(englishMatch?.[1] ?? chineseMatch?.[1] ?? "", 10);
    if (!Number.isFinite(day)) continue;

    const note = englishMatch?.[2]?.trim() || undefined;
    const bodySource = englishMatch?.[3] ?? chineseMatch?.[2] ?? "";
    const { title, description: body } = splitDayTitleAndBody(bodySource);
    if (!title && !body) continue;

    const dayEntry: TourDay = {
      day,
      title: title || `Day ${day}`,
      description: body || undefined,
    };
    if (note) dayEntry.note = note;
    days.push(dayEntry);
  }

  return days;
}

export function splitDayTitleAndBody(afterColon: string): {
  title: string;
  description: string;
} {
  const trimmed = afterColon.trim();
  if (!trimmed) {
    return { title: "", description: "" };
  }

  const newlineIndex = trimmed.indexOf("\n");
  if (newlineIndex !== -1) {
    const firstLine = trimmed.slice(0, newlineIndex).trim();
    const rest = trimmed.slice(newlineIndex + 1).trim();

    if (firstLine && isCompactDayTitle(firstLine)) {
      return { title: firstLine, description: rest };
    }
  }

  const narrative = narrativeStartPattern.exec(trimmed);
  if (narrative?.index && narrative.index > 0 && narrative.index <= 160) {
    const title = trimmed.slice(0, narrative.index).trim().replace(/[.,;:\s]+$/u, "");
    const description = trimmed.slice(narrative.index).trim();
    if (title) {
      return { title, description };
    }
  }

  if (newlineIndex === -1 && isCompactDayTitle(trimmed)) {
    return { title: trimmed, description: "" };
  }

  return {
    title: compactFallbackTitle(trimmed),
    description: trimmed,
  };
}

function isCompactDayTitle(value: string): boolean {
  return value.length <= 120 && !narrativeStartPattern.test(value);
}

function compactFallbackTitle(value: string): string {
  const firstSentence = value.split(/(?<=\.)\s+/)[0]?.trim() ?? "";
  if (firstSentence && firstSentence.length <= 100) {
    return firstSentence;
  }

  return value.length > 80 ? `${value.slice(0, 80).trim()}…` : value;
}
