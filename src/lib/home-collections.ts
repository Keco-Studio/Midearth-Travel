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
  title_zh?: string | null;
  summary: string;
  summary_zh?: string | null;
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
  text_zh?: string | null;
  sort_order: number;
  updated_at: string;
};

export const MAX_HOMEPAGE_TESTIMONIALS = 20;
export const MAX_SERVICE_PAGE_INTRO_LENGTH = 4000;
export const MAX_COMBINED_SERVICE_PAGE_INTRO_LENGTH = 8002;

export function isServicePageIntroWithinLimit(
  serviceId: string,
  page: Pick<ServicePageFields, "intro" | "introZh">,
): boolean {
  const maximum =
    serviceId === "flights-hotels"
      ? MAX_COMBINED_SERVICE_PAGE_INTRO_LENGTH
      : MAX_SERVICE_PAGE_INTRO_LENGTH;
  return page.intro.length <= maximum && (page.introZh?.length ?? 0) <= maximum;
}

export function mergeServiceRows(rows: readonly ServiceRow[]): Service[] {
  if (rows.length === 0) {
    return services.map((seed) => ({ ...seed, page: clonePage(seed.page) }));
  }

  const seedsById = new Map(services.map((seed) => [seed.id, seed]));
  const mapped = [...rows]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((row) => {
      const seed = seedsById.get(row.id);
      return {
        id: row.id,
        slug: row.slug.trim() || seed?.slug || row.id,
        title: row.title.trim() || seed?.title || "Untitled service",
        titleZh: stringOr((row as unknown as Record<string, unknown>).title_zh, seed?.titleZh ?? ""),
        summary: row.summary.trim() || seed?.summary || "",
        summaryZh: stringOr((row as unknown as Record<string, unknown>).summary_zh, seed?.summaryZh ?? ""),
        image: row.image.trim() || seed?.image || "",
        page: normalizePageFields(row.page_content, seed?.page, row.title),
      };
    });

  return collapseLegacyFlightHotelServices(mapped);
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
        localizedText: row.text_zh?.trim() || seed?.localizedText,
      };
    });
}

export function serviceToRow(service: Service, index: number): ServiceRow {
  return {
    id: service.id,
    slug: service.slug,
    title: service.title,
    title_zh: service.titleZh?.trim() ?? "",
    summary: service.summary,
    summary_zh: service.summaryZh?.trim() ?? "",
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
    id: testimonial.id,
    name: testimonial.name,
    source: testimonial.source,
    rating: testimonial.rating,
    text: testimonial.text,
    text_zh: testimonial.localizedText?.trim() || null,
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
    localizedText: "",
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
    titleZh: stringOr(raw.titleZh, base.titleZh ?? ""),
    intro: stringOr(raw.intro, base.intro),
    introZh: stringOr(raw.introZh, base.introZh ?? ""),
    signOff: stringOr(raw.signOff, base.signOff),
    signOffZh: stringOr(raw.signOffZh, base.signOffZh ?? ""),
    disclaimer: stringOr(raw.disclaimer, base.disclaimer),
    disclaimerZh: stringOr(raw.disclaimerZh, base.disclaimerZh ?? ""),
    quoteLabel: stringOr(raw.quoteLabel, base.quoteLabel),
    quoteLabelZh: stringOr(raw.quoteLabelZh, base.quoteLabelZh ?? ""),
    metaTitle: stringOr(raw.metaTitle, base.metaTitle),
    metaTitleZh: stringOr(raw.metaTitleZh, base.metaTitleZh ?? ""),
    metaDescription: stringOr(raw.metaDescription, base.metaDescription),
    metaDescriptionZh: stringOr(raw.metaDescriptionZh, base.metaDescriptionZh ?? ""),
    deals: normalizeDeals(raw.deals, base.deals),
    dealsZh: normalizeDeals(raw.dealsZh, base.dealsZh ?? []),
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
    dealsZh: page.dealsZh?.map((deal) => ({ ...deal })),
  };
}

function collapseLegacyFlightHotelServices(list: Service[]): Service[] {
  const legacyIds = new Set(["flights", "hotels"]);
  const existing = list.find((service) => service.id === "flights-hotels");
  if (existing) {
    return list.filter((service) => !legacyIds.has(service.id));
  }

  const flight = list.find((service) => service.id === "flights");
  const hotel = list.find((service) => service.id === "hotels");
  if (!flight && !hotel) return list;

  const seed = services.find((service) => service.id === "flights-hotels");
  if (!seed) return list;

  const firstLegacyIndex = list.findIndex((service) => legacyIds.has(service.id));
  const combined: Service = {
    ...seed,
    image: flight?.image.trim() || hotel?.image.trim() || seed.image,
    page: {
      ...clonePage(seed.page),
      intro: joinContent(flight?.page.intro, hotel?.page.intro) || seed.page.intro,
      introZh:
        joinContent(flight?.page.introZh, hotel?.page.introZh) || seed.page.introZh,
      signOff: flight?.page.signOff || hotel?.page.signOff || seed.page.signOff,
      signOffZh:
        flight?.page.signOffZh || hotel?.page.signOffZh || seed.page.signOffZh,
      disclaimer:
        flight?.page.disclaimer || hotel?.page.disclaimer || seed.page.disclaimer,
      disclaimerZh:
        flight?.page.disclaimerZh || hotel?.page.disclaimerZh || seed.page.disclaimerZh,
      deals:
        flight?.page.deals.length || hotel?.page.deals.length
          ? mergeServiceDeals(flight?.page.deals ?? [], hotel?.page.deals ?? [])
          : cloneServiceDeals(seed.page.deals),
      dealsZh:
        flight?.page.dealsZh?.length || hotel?.page.dealsZh?.length
          ? mergeServiceDeals(flight?.page.dealsZh ?? [], hotel?.page.dealsZh ?? [])
          : cloneServiceDeals(seed.page.dealsZh ?? []),
    },
  };

  return list.flatMap((service, index) => {
    if (index === firstLegacyIndex) return [combined];
    return legacyIds.has(service.id) ? [] : [service];
  });
}

function joinContent(...values: Array<string | undefined>): string {
  return values
    .map((value) => value?.trim() ?? "")
    .filter(Boolean)
    .join("\n\n");
}

function cloneServiceDeals(deals: readonly ServiceDeal[]): ServiceDeal[] {
  return deals.map((deal) => ({ ...deal }));
}

function mergeServiceDeals(
  flightDeals: readonly ServiceDeal[],
  hotelDeals: readonly ServiceDeal[],
): ServiceDeal[] {
  const seen = new Set<string>();
  return [
    ...flightDeals.map((deal) => ({ deal, source: "flight" })),
    ...hotelDeals.map((deal) => ({ deal, source: "hotel" })),
  ].map(({ deal, source }, index) => {
    const originalId = deal.id.trim() || `deal-${index + 1}`;
    let id = originalId;
    let suffix = 2;
    while (seen.has(id)) {
      id = `${source}-${originalId}${suffix > 2 ? `-${suffix}` : ""}`;
      suffix += 1;
    }
    seen.add(id);
    return { ...deal, id };
  });
}
