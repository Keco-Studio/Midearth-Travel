export type ServiceDeal = {
  id: string;
  route: string;
  priceLabel: string;
};

export type ServicePageFields = {
  title: string;
  titleZh?: string;
  intro: string;
  introZh?: string;
  signOff: string;
  signOffZh?: string;
  disclaimer: string;
  disclaimerZh?: string;
  quoteLabel: string;
  quoteLabelZh?: string;
  metaTitle: string;
  metaTitleZh?: string;
  metaDescription: string;
  metaDescriptionZh?: string;
  deals: ServiceDeal[];
  dealsZh?: ServiceDeal[];
};

export type Service = {
  id: string;
  slug: string;
  title: string;
  titleZh?: string;
  summary: string;
  summaryZh?: string;
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
    titleZh: "",
    intro: "",
    introZh: "",
    signOff: "Thanks",
    signOffZh: "",
    disclaimer: "",
    disclaimerZh: "",
    quoteLabel: trimmed,
    quoteLabelZh: "",
    metaTitle: `${trimmed} | Midearth Travel`,
    metaTitleZh: "",
    metaDescription: "",
    metaDescriptionZh: "",
    deals: [],
    dealsZh: [],
  };
}

export function getLocalizedServicePage(
  page: ServicePageFields,
  lang: "en" | "zh",
): ServicePageFields {
  if (lang === "en") return clonePage(page);

  return {
    ...page,
    title: populated(page.titleZh, page.title),
    intro: populated(page.introZh, page.intro),
    signOff: populated(page.signOffZh, page.signOff),
    disclaimer: populated(page.disclaimerZh, page.disclaimer),
    quoteLabel: populated(page.quoteLabelZh, page.quoteLabel),
    metaTitle: populated(page.metaTitleZh, page.metaTitle),
    metaDescription: populated(page.metaDescriptionZh, page.metaDescription),
    deals: page.dealsZh && page.dealsZh.length > 0 ? cloneDeals(page.dealsZh) : cloneDeals(page.deals),
  };
}

function populated(value: string | undefined, fallback: string): string {
  return value?.trim() ? value : fallback;
}

function clonePage(page: ServicePageFields): ServicePageFields {
  return {
    ...page,
    deals: cloneDeals(page.deals),
    dealsZh: page.dealsZh ? cloneDeals(page.dealsZh) : [],
  };
}

function cloneDeals(deals: ServiceDeal[]): ServiceDeal[] {
  return deals.map((deal) => ({ ...deal }));
}

export function createEmptyService(): Service {
  const stamp = Date.now();
  return {
    id: `service-${stamp}`,
    slug: `new-service-${stamp}`,
    title: "New Service",
    titleZh: "",
    summary: "Describe this travel service.",
    summaryZh: "",
    image: DEFAULT_SERVICE_IMAGE,
    page: createEmptyServicePage("New Service"),
  };
}

export const services: Service[] = [
  {
    id: "flights-hotels",
    slug: "flights-hotels",
    title: "Flights & Hotels",
    titleZh: "机票与酒店",
    summary: "Competitive global airfares and hand-picked stays.",
    summaryZh: "全球优惠机票与精心挑选的酒店住宿。",
    image: "/american-east-coast-new-york.jpg",
    page: {
      title: "FLIGHTS & HOTELS",
      titleZh: "机票与酒店",
      quoteLabel: "Flights & Hotels",
      quoteLabelZh: "机票与酒店",
      intro:
        "Tired of constantly scavenging the internet for the best deal? MidEarth Travel offers competitive rates on flights and hotel rooms around the world. Check out our partner airlines and take advantage of our special fares. For hotel stays, whether you're traveling for business or leisure, tell us the city and your preferred star rating and we'll find the best available price. Call 613.236.5226 / 613.236.2323 or send a Request A Quote on the left side of the page for more information.",
      introZh:
        "还在为寻找最优惠的机票和酒店而反复浏览网站吗？Midearth Travel 为全球目的地提供具有竞争力的机票及酒店价格。您可以查询合作航空公司的特价机票；预订酒店时，只需告诉我们城市和期望的星级，我们便会为商务或休闲出行寻找合适价格。欢迎致电 613.236.5226 / 613.236.2323，或通过页面左侧的询价表联系我们。",
      deals: flightDealSeeds,
      disclaimer:
        "*Via the United States: requires a Canadian passport or American visa. All fares before tax.",
      signOff: "Thanks",
      metaTitle: "Flights & Hotels | Midearth Travel",
      metaTitleZh: "机票与酒店 | Midearth Travel",
      metaDescription:
        "Competitive flight fares and hotel rates worldwide. Request a quote from MidEarth Travel.",
      metaDescriptionZh:
        "Midearth Travel 提供全球优惠机票和酒店价格，欢迎提交询价。",
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
