import { getBookingMailto, type Tour } from "../data/tours.ts";

export { getBookingMailto } from "../data/tours.ts";

export type TourContentField =
  | "title"
  | "duration"
  | "descriptionOrItinerary"
  | "image"
  | "contact";

export type TourContentIssue = {
  slug: string;
  title: string;
  image: string;
  missing: TourContentField[];
};

export function auditTourContent(
  tours: readonly Tour[],
  contactHref = "",
): TourContentIssue[] {
  return tours.flatMap((tour) => {
    // Image-free records are not public card candidates and cannot be forwarded usefully.
    if (!hasText(tour.image)) return [];

    const missing = getMissingTourContent(tour, contactHref);
    return missing.length > 0
      ? [{ slug: tour.slug, title: tour.title, image: tour.image, missing }]
      : [];
  });
}

export function isTourDetailReady(tour: Tour, contactHref = ""): boolean {
  return getMissingTourContent(tour, contactHref).length === 0;
}

export function getTourPublicHref(
  tour: Tour,
  contactHref: string,
  pageUrl?: string,
): string {
  if (isTourDetailReady(tour, contactHref)) {
    return `/tours/${encodeURIComponent(tour.slug)}`;
  }

  return getBookingMailto(tour, contactHref, pageUrl) || getTelephoneHref(contactHref);
}

function getMissingTourContent(
  tour: Tour,
  contactHref: string,
): TourContentField[] {
  const missing: TourContentField[] = [];

  if (!hasText(tour.title)) missing.push("title");
  if (!hasText(tour.duration)) missing.push("duration");
  if (!hasText(tour.description) && !(tour.itinerary?.length)) {
    missing.push("descriptionOrItinerary");
  }
  if (!hasText(tour.image)) missing.push("image");
  if (!hasContactHref(contactHref)) missing.push("contact");

  return missing;
}

function getEmailRecipient(value: string): string | null {
  const candidate = value.trim().replace(/^mailto:/i, "").split(/[?#]/, 1)[0].trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidate) ? candidate : null;
}

function getTelephoneHref(value: string): string {
  return /^tel:\S+$/i.test(value.trim()) ? value.trim() : "tel:";
}

function hasContactHref(value: string): boolean {
  return getEmailRecipient(value) !== null || /^tel:\S+$/i.test(value.trim());
}

function hasText(value: string | undefined): boolean {
  return Boolean(value?.trim());
}
