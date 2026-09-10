import type { TourEssentialFields, TourFareFields, TourRecord } from "../types/cms.ts";

export function createEmptyTourRecord(existingSlugs: readonly string[] = []): TourRecord {
  const stamp = Date.now();
  let slug = `new-tour-${stamp}`;
  let index = 1;
  const taken = new Set(existingSlugs.map((value) => value.toLocaleLowerCase("en")));
  while (taken.has(slug)) {
    slug = `new-tour-${stamp}-${index}`;
    index += 1;
  }

  return {
    slug,
    code: "",
    title: "New Tour",
    localizedTitle: "",
    image: "/hero/hero-coast.jpg",
    region: "",
    subregion: "",
    duration: "1 day",
    localizedDuration: "",
    tourType: "Bus Tour",
    departureCity: "Ottawa",
    localizedDepartureCity: "",
    departures: "",
    localizedDepartures: "",
    highlights: "",
    localizedHighlights: "",
    description: "",
    localizedDescription: "",
    admissions: "",
    localizedAdmissions: "",
    cancellation: "",
    localizedCancellation: "",
    importantNotice: "",
    localizedImportantNotice: "",
    included: "",
    localizedIncluded: "",
    notIncluded: "",
    localizedNotIncluded: "",
    essentials: emptyEssentials(),
    fares: emptyFares(),
    pdfTitle: "",
    localizedPdfTitle: "",
    pdfFileName: "",
    galleryImages: "",
    specialOffer: false,
    specialDeals: false,
    vacationPackage: false,
    travelNewsPackage: false,
    busTourPackage: true,
    destinationCategoryIds: [],
    status: "draft",
    updatedAt: new Date().toISOString(),
  };
}

function emptyEssentials(): TourEssentialFields {
  return {
    departureTime: "",
    meetingPlace: "",
    localizedMeetingPlace: "",
    hotels: "",
    localizedHotels: "",
    escortedCoach: "",
    localizedEscortedCoach: "",
  };
}

function emptyFares(): TourFareFields {
  return {
    child: "",
    single: "",
    double: "",
    triple: "",
    quad: "",
  };
}
