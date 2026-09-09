import { services, type Service } from "../data/services.ts";
import { testimonials, type Testimonial } from "../data/testimonials.ts";

export type ServiceRow = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  image: string;
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
  const byId = new Map(rows.map((row) => [row.id, row]));
  return services.map((seed) => {
    const row = byId.get(seed.id);
    return row
      ? {
          id: seed.id,
          slug: row.slug.trim() || seed.slug,
          title: row.title.trim() || seed.title,
          summary: row.summary.trim() || seed.summary,
          image: row.image.trim() || seed.image,
        }
      : { ...seed };
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
    ...service,
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
