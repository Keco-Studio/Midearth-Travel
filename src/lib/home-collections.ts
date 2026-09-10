import {
  createEmptyServicePage,
  services,
  type Service,
  type ServiceDeal,
  type ServicePageFields,
} from "../data/services.ts";
import { testimonials, type Testimonial } from "../data/testimonials.ts";

export type ServiceRow = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  image: string;
  page_content: unknown;
  sort_order: number;
  updated_at: string;
};

export type TestimonialRow = {
  id: string;
  name: string;
  source: string;
  rating: number;
  text: string;
  sort_order: number;
  updated_at: string;
};

export const MAX_HOMEPAGE_TESTIMONIALS = 20;

export function mergeServiceRows(rows: readonly ServiceRow[]): Service[] {
  if (rows.length === 0) {
    return services.map((seed) => ({ ...seed, page: clonePage(seed.page) }));
  }

  const seedsById = new Map(services.map((seed) => [seed.id, seed]));
  return [...rows]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((row) => {
      const seed = seedsById.get(row.id);
      return {
        id: row.id,
        slug: row.slug.trim() || seed?.slug || row.id,
        title: row.title.trim() || seed?.title || "Untitled service",
        summary: row.summary.trim() || seed?.summary || "",
        image: row.image.trim() || seed?.image || "",
        page: normalizePageFields(row.page_content, seed?.page, row.title),
      };
    });
}

export function mergeTestimonialRows(
  rows: readonly TestimonialRow[],
): Testimonial[] {
  if (rows.length === 0) {
    return testimonials.map((seed) => ({ ...seed }));
  }

  const seedsById = new Map(testimonials.map((seed) => [seed.id, seed]));
  return [...rows]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((row) => {
      const seed = seedsById.get(row.id);
      return {
        id: row.id,
        name: row.name.trim() || seed?.name || "Anonymous",
        source: row.source.trim() || seed?.source || "Review",
        rating: Math.min(5, Math.max(1, Math.round(row.rating))),
        text: row.text.trim() || seed?.text || "",
      };
    });
}

export function serviceToRow(service: Service, index: number): ServiceRow {
  return {
    id: service.id,
    slug: service.slug,
    title: service.title,
    summary: service.summary,
    image: service.image,
    page_content: service.page,
    sort_order: index + 1,
    updated_at: new Date().toISOString(),
  };
}

export function testimonialToRow(
  testimonial: Testimonial,
  index: number,
): TestimonialRow {
  return {
    ...testimonial,
    sort_order: index + 1,
    updated_at: new Date().toISOString(),
  };
}

export function createEmptyTestimonial(): Testimonial {
  return {
    id: `review-${Date.now()}`,
    name: "New reviewer",
    source: "Google Review",
    rating: 5,
    text: "",
  };
}

export function normalizePageFields(
  value: unknown,
  fallback?: ServicePageFields,
  cardTitle?: string,
): ServicePageFields {
  const base = fallback ? clonePage(fallback) : createEmptyServicePage(cardTitle);
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return base;
  }

  const raw = value as Record<string, unknown>;
  return {
    title: stringOr(raw.title, base.title),
    intro: stringOr(raw.intro, base.intro),
    signOff: stringOr(raw.signOff, base.signOff),
    disclaimer: stringOr(raw.disclaimer, base.disclaimer),
    quoteLabel: stringOr(raw.quoteLabel, base.quoteLabel),
    metaTitle: stringOr(raw.metaTitle, base.metaTitle),
    metaDescription: stringOr(raw.metaDescription, base.metaDescription),
    deals: normalizeDeals(raw.deals, base.deals),
  };
}

function normalizeDeals(value: unknown, fallback: ServiceDeal[]): ServiceDeal[] {
  if (!Array.isArray(value)) return fallback.map((deal) => ({ ...deal }));
  return value
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
    .map((item, index) => ({
      id: stringOr(item.id, `deal-${index + 1}`),
      route: stringOr(item.route, ""),
      priceLabel: stringOr(item.priceLabel, ""),
    }))
    .filter((deal) => deal.route.trim() || deal.priceLabel.trim());
}

function stringOr(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

function clonePage(page: ServicePageFields): ServicePageFields {
  return {
    ...page,
    deals: page.deals.map((deal) => ({ ...deal })),
  };
}
