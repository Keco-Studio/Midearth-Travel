import { getStringContent, type ContentData } from "./content-values.ts";
import { getCategoryHref } from "../data/categories.ts";
import {
  destinationCategorySeeds,
  type DestinationCategory,
} from "./destination-categories.ts";

export type FooterLink = {
  id: string;
  label: string;
  href: string;
};

export type FooterLinkIssue = {
  id: string;
  message: string;
};

export const FOOTER_SERVICE_LINKS_KEY = "serviceLinksData";
export const FOOTER_LINK_FIELD_KEYS = [FOOTER_SERVICE_LINKS_KEY] as const;

export const footerServiceLinkSeeds: FooterLink[] = [
  { id: "flights", label: "Flights", href: "/services/flights" },
  { id: "hotels", label: "Hotels", href: "/services/hotels" },
  { id: "charters", label: "Charters", href: "/services/charters" },
  { id: "travel-insurance", label: "Travel Insurance", href: "/services/travel-insurance" },
  { id: "visa-application", label: "Visa Application", href: "/services/visa-application" },
];

export function serializeFooterLinks(links: FooterLink[]): string {
  return JSON.stringify(links);
}

export function getFooterLinkEditorData(content: ContentData): {
  serviceLinks: FooterLink[];
} {
  return {
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
  serviceLinks: FooterLink[];
} {
  const links = getFooterLinkEditorData(content);

  return {
    serviceLinks: links.serviceLinks.filter(isPublishableLink),
  };
}

export function getFooterLinkIssues(
  links: readonly FooterLink[],
): FooterLinkIssue[] {
  return links.flatMap((link) => {
    if (!link.label.trim()) {
      return [{
        id: link.id,
        message: "Add a label before publishing this service link.",
      }];
    }
    if (!isSupportedPublicHref(link.href)) {
      return [{
        id: link.id,
        message: "Use a supported public service link.",
      }];
    }
    return [];
  });
}

export function getCategoryFooterLinks(
  categories: readonly DestinationCategory[],
  lang: "en" | "zh",
): FooterLink[] {
  const categoriesById = new Map(categories.map((category) => [category.id, category]));

  return destinationCategorySeeds.flatMap((seed) => {
    const category = categoriesById.get(seed.id);
    if (!category) return [];

    const label =
      (lang === "zh" ? category.titleZh : category.titleEn).trim() ||
      category.titleEn.trim() ||
      category.title.trim();
    const href = getCategoryHref(category);

    return label && isSupportedPublicHref(href)
      ? [{ id: category.id, label, href }]
      : [];
  });
}

export function isSupportedPublicHref(href: string): boolean {
  const value = href.trim();
  if (!value || value === "/tours/custom") return false;

  return (
    value === "/" ||
    /^\/#\S+$/.test(value) ||
    value === "/tours" ||
    /^\/(?:tours\/category|tours|routes|services)\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) ||
    /^mailto:\S+@\S+\.\S+$/i.test(value) ||
    /^tel:\+?[0-9][0-9(). -]*$/.test(value) ||
    /^https:\/\/\S+$/i.test(value)
  );
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
  return Boolean(link.label.trim() && isSupportedPublicHref(link.href));
}

function cloneLinks(links: FooterLink[]): FooterLink[] {
  return links.map((link) => ({ ...link }));
}
