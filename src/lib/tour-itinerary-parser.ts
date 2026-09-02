import type { TourDay } from "../data/tours.ts";
import { richTextToPlainText } from "./rich-text-content.ts";

/** Matches "Day 1:", "Day 1 (Monday or Wednesday):", etc. */
export const DAY_HEADING_PATTERN =
  /Day\s+(\d+)(?:\s*\(([^)]*)\))?\s*:/i;

const narrativeStartPattern =
  /\b(Depart|Arrive|Visit|Continue|Transfer|Overnight|Today|After|In the|This morning|We |Our |Upon |Enjoy |Pick )\b/;

export function hasDayByDayHeading(text: string): boolean {
  return DAY_HEADING_PATTERN.test(text);
}

export function parseItineraryFromRichText(description: string): TourDay[] {
  const plain = richTextToPlainText(description);
  if (!plain || !hasDayByDayHeading(plain)) {
    return [];
  }

  const segments = plain.split(/(?=Day\s+\d+(?:\s*\([^)]*\))?\s*:)/i).filter(Boolean);
  const days: TourDay[] = [];

  for (const segment of segments) {
    const match =
      /^Day\s+(\d+)(?:\s*\(([^)]*)\))?\s*:\s*([\s\S]*)$/i.exec(segment.trim());
    if (!match) continue;

    const day = Number.parseInt(match[1], 10);
    if (!Number.isFinite(day)) continue;

    const note = match[2]?.trim() || undefined;
    const { title, description: body } = splitDayTitleAndBody(match[3] ?? "");
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
