import { getStringContent, type ContentData } from "./content-values.ts";

export type FooterLink = {
  id: string;
  label: string;
  href: string;
};

export const FOOTER_TOUR_LINKS_KEY = "tourLinksData";
export const FOOTER_SERVICE_LINKS_KEY = "serviceLinksData";
export const FOOTER_LINK_FIELD_KEYS = [
  FOOTER_TOUR_LINKS_KEY,
  FOOTER_SERVICE_LINKS_KEY,
] as const;

export const footerTourLinkSeeds: FooterLink[] = [
  { id: "canadian-tours", label: "Canadian Tours", href: "/tours/category/north-america" },
  { id: "usa-tours", label: "USA Tours", href: "/tours" },
  { id: "european-tours", label: "European Tours", href: "/tours/category/europe" },
  { id: "asian-tours", label: "Asian Tours", href: "/tours/category/asia" },
  { id: "sun-destinations", label: "Sun Destinations", href: "/tours/category/sun-destinations" },
];

export const footerServiceLinkSeeds: FooterLink[] = [
  { id: "flights", label: "Flights", href: "/#about" },
  { id: "hotels", label: "Hotels", href: "/#about" },
  { id: "travel-insurance", label: "Travel Insurance", href: "/#about" },
  { id: "visa-application", label: "VISA Application", href: "/#about" },
];

export function serializeFooterLinks(links: FooterLink[]): string {
  return JSON.stringify(links);
}

export function getFooterLinkEditorData(content: ContentData): {
  tourLinks: FooterLink[];
  serviceLinks: FooterLink[];
} {
  return {
    tourLinks: parseFooterLinks(
      getStringContent(
        content,
        FOOTER_TOUR_LINKS_KEY,
        serializeFooterLinks(footerTourLinkSeeds),
      ),
      footerTourLinkSeeds,
    ),
    serviceLinks: parseFooterLinks(
      getStringContent(
        content,
        FOOTER_SERVICE_LINKS_KEY,
        serializeFooterLinks(footerServiceLinkSeeds),
      ),
      footerServiceLinkSeeds,
    ),
  };
}

export function getPublishedFooterLinks(content: ContentData): {
  tourLinks: FooterLink[];
  serviceLinks: FooterLink[];
} {
  const links = getFooterLinkEditorData(content);

  return {
    tourLinks: links.tourLinks.filter(isPublishableLink),
    serviceLinks: links.serviceLinks.filter(isPublishableLink),
  };
}

function parseFooterLinks(value: string, fallback: FooterLink[]): FooterLink[] {
  try {
    const parsed = JSON.parse(value) as unknown;

    if (!Array.isArray(parsed)) {
      return cloneLinks(fallback);
    }

    const links = parsed
      .filter(isFooterLink)
      .slice(0, 8)
      .map((link) => ({ ...link }));

    return links.length > 0 ? links : cloneLinks(fallback);
  } catch {
    return cloneLinks(fallback);
  }
}

function isFooterLink(value: unknown): value is FooterLink {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const link = value as Partial<FooterLink>;
  return (
    typeof link.id === "string" &&
    typeof link.label === "string" &&
    typeof link.href === "string"
  );
}

function isPublishableLink(link: FooterLink): boolean {
  return Boolean(link.label.trim() && link.href.trim());
}

function cloneLinks(links: FooterLink[]): FooterLink[] {
  return links.map((link) => ({ ...link }));
}
