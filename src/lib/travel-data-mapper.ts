import { site } from "../data/site.ts";
import { tours } from "../data/tours.ts";
import type { MediaAsset, SiteSettings, TourRecord } from "../types/cms.ts";

const uploadedAt = "2026-07-01T10:00:00Z";

export function mapTravelToursToRecords(): TourRecord[] {
  return tours.map((tour) => ({
    slug: tour.slug,
    code: tour.code ?? "",
    title: tour.pageTitle ?? tour.title,
    localizedTitle: "",
    image: tour.image,
    region: tour.region,
    subregion: "",
    duration: tour.duration,
    localizedDuration: "",
    tourType: tour.tourType,
    departures: tour.departures?.join(", ") ?? "",
    localizedDepartures: "",
    highlights: (tour.highlights ?? tour.tags).join(", "),
    localizedHighlights: "",
    description: formatTourDescription(tour),
    localizedDescription: "",
    fares: mapTourFares(tour.fares),
    pdfTitle: "Download PDF for tour details",
    localizedPdfTitle: "",
    pdfFileName: "",
    specialOffer: tour.featured ?? false,
    specialDeals: tour.hotSale ?? false,
    vacationPackage: tour.tourType === "Group Tour",
    travelNewsPackage: false,
    busTourPackage: tour.tourType === "Bus Tour",
    status: "published" as const,
    updatedAt: uploadedAt,
  }));
}

function formatTourDescription(tour: (typeof tours)[number]): string {
  if (!tour.itinerary?.length) {
    return tour.description;
  }

  return tour.itinerary
    .map(({ day, title, description }) =>
      [`Day ${day}: ${title}`, description].filter(Boolean).join("\n"),
    )
    .join("\n\n");
}

function mapTourFares(fares: (typeof tours)[number]["fares"]): TourRecord["fares"] {
  const byLabel = new Map(
    (fares ?? []).map(({ label, price }) => [label.trim().toLocaleLowerCase("en"), price]),
  );

  return {
    child: byLabel.get("child") ?? "",
    single: byLabel.get("single") ?? "",
    double: byLabel.get("double") ?? "",
    triple: byLabel.get("triple") ?? "",
    quad: byLabel.get("quad") ?? "",
  };
}

export function mapTravelSiteSettings(): SiteSettings {
  return {
    siteName: site.name,
    primaryPhone: site.phone,
    email: site.email,
    officeAddress: "Bronson Avenue, Ottawa, Ontario",
  };
}

type MediaSeedInput = {
  fileName: string;
  url: string;
  type: MediaAsset["type"];
  sizeLabel: string;
  usedBy: string[];
};

const staticMediaAssets: MediaSeedInput[] = [
  {
    fileName: "hero-coast.jpg",
    url: "/hero/hero-coast.jpg",
    type: "image",
    sizeLabel: "1.3 MB",
    usedBy: ["Hero"],
  },
  {
    fileName: "hero1.jpg",
    url: "/hero/hero1.jpg",
    type: "image",
    sizeLabel: "320 KB",
    usedBy: ["Destination Categories"],
  },
  {
    fileName: "final-cta-travel-flatlay.jpg",
    url: "/final-cta-travel-flatlay.jpg",
    type: "image",
    sizeLabel: "1.8 MB",
    usedBy: ["Final CTA"],
  },
  {
    fileName: "wechat-qr.jpg",
    url: "/contact/wechat-qr.jpg",
    type: "qr",
    sizeLabel: "13 KB",
    usedBy: ["Quote Request"],
  },
  {
    fileName: "whatsapp-qr.jpg",
    url: "/contact/whatsapp-qr.jpg",
    type: "qr",
    sizeLabel: "13 KB",
    usedBy: ["Quote Request"],
  },
  {
    fileName: "logo.png",
    url: "/logo.png",
    type: "image",
    sizeLabel: "21 KB",
    usedBy: ["Navigation"],
  },
];

function fileNameFromPath(path: string): string {
  return path.split("/").filter(Boolean).pop() ?? path;
}

function isQrAsset(path: string): boolean {
  return path.includes("qr") || path.includes("wechat") || path.includes("whatsapp");
}

export function buildMediaSeedsFromTravel(): MediaAsset[] {
  const byUrl = new Map<string, MediaSeedInput>();

  for (const asset of staticMediaAssets) {
    byUrl.set(asset.url, asset);
  }

  for (const tour of tours) {
    const paths = [tour.image, ...(tour.gallery ?? [])];

    for (const url of paths) {
      if (!url || byUrl.has(url)) {
        continue;
      }

      byUrl.set(url, {
        fileName: fileNameFromPath(url),
        url,
        type: isQrAsset(url) ? "qr" : "image",
        sizeLabel: "—",
        usedBy: [tour.title],
      });
    }
  }

  return Array.from(byUrl.values()).map((asset, index) => ({
    id: `media_${String(index + 1).padStart(3, "0")}`,
    fileName: asset.fileName,
    type: asset.type,
    url: asset.url,
    sizeLabel: asset.sizeLabel,
    usedBy: asset.usedBy,
    uploadedAt,
  }));
}

export function isLocalPublicAssetPath(path: string): boolean {
  return path.startsWith("/") && !path.startsWith("//");
}
