import { getStringContent, type ContentData } from "./content-values.ts";
import { getCategoryHref } from "../data/categories.ts";
import {
  destinationCategorySeeds,
  type DestinationCategory,
} from "./destination-categories.ts";

export type FooterLink = {
  id: string;
  label: string;
  labelZh?: string;
  href: string;
};

export type FooterLinkIssue = {
  id: string;
  message: string;
};

export const FOOTER_SERVICE_LINKS_KEY = "serviceLinksData";
export const FOOTER_LINK_FIELD_KEYS = [FOOTER_SERVICE_LINKS_KEY] as const;

export const footerServiceLinkSeeds: FooterLink[] = [
  { id: "flights", label: "Flights", labelZh: "机票", href: "/services/flights" },
  { id: "hotels", label: "Hotels", labelZh: "酒店", href: "/services/hotels" },
  { id: "charters", label: "Charters", labelZh: "包机服务", href: "/services/charters" },
  {
    id: "travel-insurance",
    label: "Travel Insurance",
    labelZh: "旅游保险",
    href: "/services/travel-insurance",
  },
  {
    id: "visa-application",
    label: "Visa Application",
    labelZh: "签证申请",
    href: "/services/visa-application",
  },
];

export function serializeFooterLinks(links: FooterLink[]): string {
  return JSON.stringify(links);
}

export function getFooterLinkEditorData(content: ContentData): {
  serviceLinks: FooterLink[];
} {
  return {
    serviceLinks: restoreStandardServiceLinks(
      parseFooterLinks(
        getStringContent(
          content,
          FOOTER_SERVICE_LINKS_KEY,
          serializeFooterLinks(footerServiceLinkSeeds),
        ),
        footerServiceLinkSeeds,
      ),
    ),
  };
}

export function getPublishedFooterLinks(content: ContentData, lang: "en" | "zh" = "en"): {
  serviceLinks: FooterLink[];
} {
  const links = getFooterLinkEditorData(content);
  const seededHrefById = new Map(
    footerServiceLinkSeeds.map((link) => [link.id, link.href]),
  );

  return {
    serviceLinks: links.serviceLinks
      .map((link) => ({
        ...link,
        href: seededHrefById.get(link.id) ?? link.href,
        label: lang === "zh" && link.labelZh?.trim() ? link.labelZh : link.label,
      }))
      .filter(isPublishableLink),
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
    value === "/contact" ||
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

    const fallbackById = new Map(fallback.map((link) => [link.id, link]));
    const links = parsed
      .filter(isFooterLink)
      .slice(0, 8)
      .map((link) => {
        const labelZh = link.labelZh?.trim() || fallbackById.get(link.id)?.labelZh;
        return labelZh ? { ...link, labelZh } : { ...link };
      });

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
    (link.labelZh === undefined || typeof link.labelZh === "string") &&
    typeof link.href === "string"
  );
}

function isPublishableLink(link: FooterLink): boolean {
  return Boolean(link.label.trim() && isSupportedPublicHref(link.href));
}

function restoreStandardServiceLinks(links: FooterLink[]): FooterLink[] {
  const seedsById = new Map(footerServiceLinkSeeds.map((link) => [link.id, link]));
  if (!links.length || !links.every((link) => seedsById.has(link.id))) {
    return links;
  }

  const linksById = new Map(links.map((link) => [link.id, link]));
  return footerServiceLinkSeeds.map((seed) => {
    const stored = linksById.get(seed.id);
    return {
      ...seed,
      ...stored,
      href: seed.href,
      labelZh: stored?.labelZh?.trim() || seed.labelZh,
    };
  });
}

function cloneLinks(links: FooterLink[]): FooterLink[] {
  return links.map((link) => ({ ...link }));
}
