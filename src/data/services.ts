export type ServiceDeal = {
  id: string;
  route: string;
  priceLabel: string;
};

export type ServicePageFields = {
  title: string;
  intro: string;
  signOff: string;
  disclaimer: string;
  quoteLabel: string;
  metaTitle: string;
  metaDescription: string;
  deals: ServiceDeal[];
};

export type Service = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  image: string;
  page: ServicePageFields;
};

export const DEFAULT_SERVICE_IMAGE = "/american-east-coast-new-york.jpg";
export const MAX_HOMEPAGE_SERVICES = 12;

export const flightDealSeeds: ServiceDeal[] = [
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

export function createEmptyServicePage(title = "New Service"): ServicePageFields {
  const trimmed = title.trim() || "New Service";
  return {
    title: trimmed.toUpperCase(),
    intro: "",
    signOff: "Thanks",
    disclaimer: "",
    quoteLabel: trimmed,
    metaTitle: `${trimmed} | Midearth Travel`,
    metaDescription: "",
    deals: [],
  };
}

export function createEmptyService(): Service {
  const stamp = Date.now();
  return {
    id: `service-${stamp}`,
    slug: `new-service-${stamp}`,
    title: "New Service",
    summary: "Describe this travel service.",
    image: DEFAULT_SERVICE_IMAGE,
    page: createEmptyServicePage("New Service"),
  };
}

export const services: Service[] = [
  {
    id: "flights",
    slug: "flights",
    title: "Flights",
    summary: "Competitive global fares with concierge support.",
    image: "/american-east-coast-new-york.jpg",
    page: {
      title: "FLIGHTS",
      quoteLabel: "Flights",
      intro:
        'Tired of constantly scavenging the internet for the best deal? You will be glad to know that MidEarth Travel offers the most competitive rates on flights to destinations around the world. Check out our partner airlines and take advantage of our special fares today. Call 613.236.5226 / 613.236.2323, or send "Request A Quote" on the left of the page to book now.',
      deals: flightDealSeeds,
      disclaimer:
        "*Via the United States: requires a Canadian passport or American visa. All fares before tax.",
      signOff: "Thanks",
      metaTitle: "Flights | Midearth Travel",
      metaDescription:
        "Competitive flight fares from Ottawa to destinations around the world. Request a quote from MidEarth Travel.",
    },
  },
  {
    id: "hotels",
    slug: "hotels",
    title: "Hotels",
    summary: "From boutique to five-star, hand-picked stays.",
    image: "/european-cities-paris-eiffel-tower-romantic.jpg",
    page: {
      title: "HOTELS",
      quoteLabel: "Hotels",
      intro:
        "Tired of constantly scavenging the internet for the best deal? You will be glad to know that MidEarth Travel offers the most competitive rates for hotel rooms around the world. Whether you're traveling for business or leisure, whether you're looking for value or luxury, MidEarth Travel can accommodate all your needs and wishes. Just name us a city and a preferred star-rating, and we'll give you the best price. Call 613.236.5226 / 613.236.2323 or send a Request A Quote on the left side of the page for more information.",
      deals: [],
      disclaimer: "",
      signOff: "Thanks",
      metaTitle: "Hotels | Midearth Travel",
      metaDescription:
        "Competitive hotel rates worldwide. Request a quote from MidEarth Travel.",
    },
  },
  {
    id: "charters",
    slug: "charters",
    title: "Charters",
    summary: "Coach + driver bookings for groups & events.",
    image: "/toronto-niagara-falls-canada.jpg",
    page: {
      title: "CHARTERS",
      quoteLabel: "Charters",
      intro:
        "Tired of constantly scavenging the internet for the best deal? MidEarth Travel offers tour bus and driver chartering services for groups and events of any size. To take advantage of our competitive rates, send us your proposed itinerary and we will promptly respond with a quote. Availability varies seasonally. Call 613.236.5226 / 613.236.2323 for more information.",
      deals: [],
      disclaimer: "",
      signOff: "Thanks",
      metaTitle: "Charters | Midearth Travel",
      metaDescription:
        "Tour bus and driver chartering for groups and events. Request a quote from MidEarth Travel.",
    },
  },
  {
    id: "travel-insurance",
    slug: "travel-insurance",
    title: "Travel Insurance",
    summary: "Trip cancellation, medical, and beyond.",
    image: "/vancouver-rockies-lake-louise.jpg",
    page: {
      title: "TRAVEL INSURANCE",
      quoteLabel: "Travel Insurance",
      intro:
        "If you are interested in purchasing a travel insurance for any of your vacation or tour packages, MidEarth Travel is pleased to provide you a wide selection of insurance policies on behalf of RBC Travel Insurance and 21st-century travel insurance. As the leading providers of travel insurance in Canada, RBC and 21st Century boast a comprehensive lineup of plans and policies designed to satisfy a broad spectrum of needs. Call 613.236.5226 / 613.236.2323 or send a Request A Quote on the left side of the page to find out which policy is right for you.",
      deals: [],
      disclaimer: "",
      signOff: "Thanks",
      metaTitle: "Travel Insurance | Midearth Travel",
      metaDescription:
        "Travel insurance through RBC and 21st Century. Request a quote from MidEarth Travel.",
    },
  },
  {
    id: "visa-application",
    slug: "visa-application",
    title: "Visa Application",
    summary: "Document support for China, Vietnam & more.",
    image: "/highlights-japan-mt-fuji.jpg",
    page: {
      title: "VISA APPLICATION",
      quoteLabel: "VISA Application",
      intro:
        "Tired of checking VISA requirements, preparing many documents and filling out various forms? Midearth Travel is happy to assist you in attaining a tourist visa for your country of destination (China, Vietnam). For a reasonable service fee, we will take care of all the required paperwork so you can sit back and relax. For more information, please call 613.236.5226 / 613.236.2323 or send a Request A Quote on the left side of the page.",
      deals: [],
      disclaimer: "",
      signOff: "Thanks",
      metaTitle: "VISA Application | Midearth Travel",
      metaDescription:
        "Tourist visa assistance for China and Vietnam. Request a quote from MidEarth Travel.",
    },
  },
];
