import {
  services,
  type Service,
  type ServiceDeal,
  type ServicePageFields,
} from "./services.ts";

export type ServiceNavItem = {
  id: string;
  slug: string;
  label: string;
  href: string;
};

export type FlightDeal = ServiceDeal;

export type ServicePageContent = ServicePageFields & {
  slug: string;
};

export const SERVICE_BACKGROUND_IMAGE = "/hero/hero-coast.jpg";
export const SERVICE_WHATSAPP_QR = "/contact/whatsapp-qr.jpg";
export const SERVICE_WHATSAPP_LABEL = "← Midearth's WhatsApp";

export function serviceToPageContent(service: Service): ServicePageContent {
  return {
    slug: service.slug,
    ...service.page,
  };
}

export function servicesToNavItems(list: readonly Service[]): ServiceNavItem[] {
  return list.map((service) => ({
    id: service.id,
    slug: service.slug,
    label: service.title,
    href: `/services/${service.slug}`,
  }));
}

export function getServicePage(slug: string): ServicePageContent | undefined {
  const service = services.find((item) => item.slug === slug);
  return service ? serviceToPageContent(service) : undefined;
}

export function getServicePageSlugs(): string[] {
  return services.map((service) => service.slug);
}

/** @deprecated Use servicesToNavItems(loadHomepageServices()) */
export const serviceNavItems = servicesToNavItems(services);

/** @deprecated Prefer service.page.deals from CMS services */
export const flightDeals = services.find((s) => s.id === "flights")?.page.deals ?? [];

/** @deprecated Prefer service pages from CMS */
export const servicePages = services.map(serviceToPageContent);
