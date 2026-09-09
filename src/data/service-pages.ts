export type ServiceNavItem = {
  id: string;
  slug: string;
  label: string;
  href: string;
};

export type FlightDeal = {
  id: string;
  route: string;
  priceLabel: string;
};

export type ServicePageContent = {
  slug: string;
  title: string;
  intro: string;
  deals?: FlightDeal[];
  disclaimer?: string;
  signOff: string;
  quoteLabel: string;
  metaTitle: string;
  metaDescription: string;
};

export const SERVICE_BACKGROUND_IMAGE = "/hero/hero-coast.jpg";
export const SERVICE_WHATSAPP_QR = "/contact/whatsapp-qr.jpg";
export const SERVICE_WHATSAPP_LABEL = "← Midearth's WhatsApp";

export const serviceNavItems: ServiceNavItem[] = [
  { id: "flights", slug: "flights", label: "Flights", href: "/services/flights" },
  { id: "hotels", slug: "hotels", label: "Hotels", href: "/services/hotels" },
  { id: "charters", slug: "charters", label: "Charters", href: "/services/charters" },
  {
    id: "travel-insurance",
    slug: "travel-insurance",
    label: "Travel Insurance",
    href: "/services/travel-insurance",
  },
  {
    id: "visa-application",
    slug: "visa-application",
    label: "Visa Application",
    href: "/services/visa-application",
  },
];

export const flightDeals: FlightDeal[] = [
  {
    id: "ottawa-shanghai",
    route: "Ottawa - Shanghai",
    priceLabel: "round trip starting from $****",
  },
  {
    id: "ottawa-hong-kong",
    route: "Ottawa - Hong Kong",
    priceLabel: "round trip starting from $****",
  },
  {
    id: "ottawa-taipei",
    route: "Ottawa - Taipei",
    priceLabel: "round trip starting from $****",
  },
  {
    id: "ottawa-paris",
    route: "Ottawa - Paris",
    priceLabel: "round trip starting from $***",
  },
  {
    id: "ottawa-manila",
    route: "Ottawa - Manila",
    priceLabel: "round trip starting from $****",
  },
];

export const servicePages: ServicePageContent[] = [
  {
    slug: "flights",
    title: "FLIGHTS",
    quoteLabel: "Flights",
    intro:
      'Tired of constantly scavenging the internet for the best deal? You will be glad to know that MidEarth Travel offers the most competitive rates on flights to destinations around the world. Check out our partner airlines and take advantage of our special fares today. Call 613.236.5226 / 613.236.2323, or send "Request A Quote" on the left of the page to book now.',
    deals: flightDeals,
    disclaimer:
      "*Via the United States: requires a Canadian passport or American visa. All fares before tax.",
    signOff: "Thanks",
    metaTitle: "Flights | Midearth Travel",
    metaDescription:
      "Competitive flight fares from Ottawa to destinations around the world. Request a quote from MidEarth Travel.",
  },
  {
    slug: "hotels",
    title: "HOTELS",
    quoteLabel: "Hotels",
    intro:
      "Tired of constantly scavenging the internet for the best deal? You will be glad to know that MidEarth Travel offers the most competitive rates for hotel rooms around the world. Whether you're traveling for business or leisure, whether you're looking for value or luxury, MidEarth Travel can accommodate all your needs and wishes. Just name us a city and a preferred star-rating, and we'll give you the best price. Call 613.236.5226 / 613.236.2323 or send a Request A Quote on the left side of the page for more information.",
    signOff: "Thanks",
    metaTitle: "Hotels | Midearth Travel",
    metaDescription:
      "Competitive hotel rates worldwide. Request a quote from MidEarth Travel.",
  },
  {
    slug: "charters",
    title: "CHARTERS",
    quoteLabel: "Charters",
    intro:
      "Tired of constantly scavenging the internet for the best deal? MidEarth Travel offers tour bus and driver chartering services for groups and events of any size. To take advantage of our competitive rates, send us your proposed itinerary and we will promptly respond with a quote. Availability varies seasonally. Call 613.236.5226 / 613.236.2323 for more information.",
    signOff: "Thanks",
    metaTitle: "Charters | Midearth Travel",
    metaDescription:
      "Tour bus and driver chartering for groups and events. Request a quote from MidEarth Travel.",
  },
  {
    slug: "travel-insurance",
    title: "TRAVEL INSURANCE",
    quoteLabel: "Travel Insurance",
    intro:
      "If you are interested in purchasing a travel insurance for any of your vacation or tour packages, MidEarth Travel is pleased to provide you a wide selection of insurance policies on behalf of RBC Travel Insurance and 21st-century travel insurance. As the leading providers of travel insurance in Canada, RBC and 21st Century boast a comprehensive lineup of plans and policies designed to satisfy a broad spectrum of needs. Call 613.236.5226 / 613.236.2323 or send a Request A Quote on the left side of the page to find out which policy is right for you.",
    signOff: "Thanks",
    metaTitle: "Travel Insurance | Midearth Travel",
    metaDescription:
      "Travel insurance through RBC and 21st Century. Request a quote from MidEarth Travel.",
  },
  {
    slug: "visa-application",
    title: "VISA APPLICATION",
    quoteLabel: "VISA Application",
    intro:
      "Tired of checking VISA requirements, preparing many documents and filling out various forms? Midearth Travel is happy to assist you in attaining a tourist visa for your country of destination (China, Vietnam). For a reasonable service fee, we will take care of all the required paperwork so you can sit back and relax. For more information, please call 613.236.5226 / 613.236.2323 or send a Request A Quote on the left side of the page.",
    signOff: "Thanks",
    metaTitle: "VISA Application | Midearth Travel",
    metaDescription:
      "Tourist visa assistance for China and Vietnam. Request a quote from MidEarth Travel.",
  },
];

export function getServicePage(slug: string): ServicePageContent | undefined {
  return servicePages.find((page) => page.slug === slug);
}

export function getServicePageSlugs(): string[] {
  return servicePages.map((page) => page.slug);
}

/** @deprecated Prefer getServicePage("flights") */
export const flightsPageContent = {
  ...getServicePage("flights")!,
  backgroundImage: SERVICE_BACKGROUND_IMAGE,
  whatsappQrImage: SERVICE_WHATSAPP_QR,
  whatsappLabel: SERVICE_WHATSAPP_LABEL,
};
