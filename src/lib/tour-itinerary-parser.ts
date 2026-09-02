import type { TourDay } from "../data/tours.ts";
import { richTextToPlainText } from "./rich-text-content.ts";

const dayHeadingPattern =
  /Day\s+(\d+)\s*:\s*([^\n]+?)(?:\n|$)/gi;

export function parseItineraryFromRichText(description: string): TourDay[] {
  const plain = richTextToPlainText(description);
  if (!plain || !/Day\s+\d+:/i.test(plain)) {
    return [];
  }

  const segments = plain.split(/(?=Day\s+\d+\s*:)/i).filter(Boolean);
  const days: TourDay[] = [];

  for (const segment of segments) {
    const match = /^Day\s+(\d+)\s*:\s*([^\n]+)(?:\n([\s\S]*))?$/i.exec(segment.trim());
    if (!match) continue;

    const day = Number.parseInt(match[1], 10);
    const title = match[2].trim();
    const body = match[3]?.trim() ?? "";

    if (!Number.isFinite(day) || !title) continue;

    days.push({
      day,
      title,
      description: body || undefined,
    });
  }

  return days;
}
