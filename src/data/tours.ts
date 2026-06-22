export type TourDay = {
  day: number;
  title: string;
  description?: string;
};

export type TourFare = {
  label: string;
  price: string;
};

export type TourPolicy = {
  title: string;
  content: string;
  icon?: "ticket" | "shield" | "info";
  wide?: boolean;
};

export type Tour = {
  slug: string;
  code?: string;
  title: string;
  /** Hero / page heading (original site often uses "and" instead of "&") */
  pageTitle?: string;
  region: string;
  duration: string;
  description: string;
  image: string;
  tags: string[];
  tourType: string;
  rating?: number;
  reviewCount?: number;
  departures?: string[];
  departureCity?: string;
  highlights?: string[];
  itinerary?: TourDay[];
  essentials?: {
    departureTime?: string;
    meetingPlace?: string;
    hotels?: string;
    escortedCoach?: string;
  };
  policies?: TourPolicy[];
  fares?: TourFare[];
  featured?: boolean;
  hotSale?: boolean;
  gallery?: string[];
  included?: string[];
  notIncluded?: string[];
};

export const defaultTourIncluded = [
  "Coach transportation throughout",
  "Hotel accommodation (3–4★)",
  "Bilingual tour leader",
  "Selected meals (see itinerary)",
  "Major attraction admissions",
];

export const defaultTourNotIncluded = [
  "International flights",
  "Travel insurance",
  "Optional excursions",
  "Gratuities",
];

export const tours: Tour[] = [
  {
    slug: "maritime-provinces-and-gaspe",
    code: "NE07",
    title: "Maritime Provinces & Gaspe",
    pageTitle: "Maritime Provinces and Gaspé",
    region: "Canada",
    duration: "7 days / 6 nights",
    description:
      "Coastal icons, island charm, and the world's highest tides — from Ottawa by coach.",
    image: "/maritime-provinces-gaspe-peggys-cove.jpg",
    gallery: [
      "/maritime-provinces-gaspe-peggys-cove.jpg",
      "/hero/hero-coast.jpg",
      "/vancouver-rockies-lake-louise.jpg",
      "/southern-france-italy-venice.jpg",
    ],
    tags: ["Gaspé", "Bay of Fundy", "Charlottetown", "Peggy's Cove", "Halifax"],
    tourType: "Bus Tour",
    rating: 5.0,
    reviewCount: 200,
    departureCity: "Ottawa",
    departures: ["July 11", "August 1", "August 15"],
    itinerary: [
      {
        day: 1,
        title: "Ottawa – Reford Gardens – Campbellton",
        description:
          "Depart Ottawa for the spectacular Reford Gardens. Renowned for landscaping, the gardens showcase over 2,000 species and varieties of plants—indigenous and exotic—including perennials, annuals, and shrubs. After this botanical highlight, continue to Campbellton for overnight.",
      },
      {
        day: 2,
        title: "Campbellton – Percé – Gaspé",
        description:
          "Travel to Percé, famous for Percé Rock. Board a boat cruise to Bonaventure Island, home to 293 bird species in just 4.16 km²—expect seabirds, seals, and dramatic coastal views. Continue to Forillon National Park: cliffs, sea, and mountains across 244 km², Canada's tallest lighthouse (37 m, 1854), Jacques Cartier's landing site, and the town of Gaspé.",
      },
      {
        day: 3,
        title: "Gaspé – Campbellton – Shediac – Moncton",
        description:
          "Visit Campbellton, the \"Salmon Capital,\" with the world's largest salmon sculpture. Then Shediac, the Lobster Capital, with its giant lobster landmark. In the afternoon, Moncton and the Magnetic Hill phenomenon. Overnight in Moncton.",
      },
      {
        day: 4,
        title: "Halifax – Peggy's Cove – Citadel",
        description:
          "Drive to Peggy's Cove, the postcard fishing village with one of the world's most photographed lighthouses. Visit the Halifax Citadel for harbour views, then explore Nova Scotia's capital: the Seaport, Maritime Museum of the Atlantic, and maritime heritage. Optional lobster dinner at Murphy's Restaurant on the Water (evening).",
      },
      {
        day: 5,
        title: "Charlottetown – Cavendish Beach – Prince Edward Island",
        description:
          "Cross the Confederation Bridge to PEI, the \"Gentle Island.\" Visit Charlottetown, Cavendish Beach, and Green Gables House, inspiration for Lucy Maud Montgomery's novel. Evening: fresh Atlantic lobster dinner at Lobster Village.",
      },
      {
        day: 6,
        title: "Moncton – Hopewell Rocks – Parlee Beach – Campbellton",
        description:
          "Morning at Hopewell Rocks on the Bay of Fundy—witness the world's highest tides and the Flowerpot Rocks. Relax at Parlee Beach, then return to Campbellton for overnight.",
      },
      {
        day: 7,
        title: "Campbellton – Ottawa",
        description:
          "After breakfast, return to Ottawa—your Maritime adventure concludes.",
      },
    ],
    essentials: {
      departureTime: "6:00 AM",
      meetingPlace:
        "670 Bronson Avenue, Ottawa ON K1S 4E9 (McDonald's parking lot)",
      hotels: "3-star hotels or equivalent.",
      escortedCoach: "Professional tour leader and driver.",
    },
    policies: [
      {
        title: "Admissions",
        content: "Subject to actual arrangements.",
        icon: "ticket",
      },
      {
        title: "Cancellation",
        content:
          "Cancellation in writing received 30 days before departure is refunded less a 30% cancellation fee. Cancellations received within 30 days of departure are non-refundable. Travel insurance is strongly recommended; our staff can assist you.",
        icon: "shield",
      },
      {
        title: "Important notice",
        content:
          "Fares shown are for reference only and may change by season. Fares include coach transportation, tour leader, and hotel accommodation. Fares do not include meals, gratuities for driver and tour leader, admissions, or travel insurance. MidEarth Travel may cancel or amend the schedule when necessary.",
        icon: "info",
        wide: true,
      },
    ],
    fares: [
      { label: "Quad", price: "$639" },
      { label: "Triple", price: "$759" },
      { label: "Double", price: "$969" },
      { label: "Single", price: "$1,699" },
      { label: "Child", price: "$639" },
    ],
    featured: true,
    hotSale: true,
  },
  {
    slug: "toronto-niagara-falls",
    code: "NE01",
    title: "Toronto & Niagara Falls",
    region: "Canada",
    duration: "2-3 Days",
    description:
      "Thousand Islands, Toronto, and the magnificent Niagara Falls",
    image: "/toronto-niagara-falls-canada.jpg",
    tags: ["Thousand Islands", "Toronto", "Niagara Falls"],
    tourType: "Bus Tour",
    departureCity: "Ottawa",
    featured: true,
    fares: [{ label: "Adult", price: "$289" }],
  },
  {
    slug: "vancouver-rockies",
    code: "NW04",
    title: "Vancouver & The Rockies",
    region: "Canada",
    duration: "6-7 Days",
    description: "Vancouver, Victoria, Banff, Jasper, and Lake Louise",
    image: "/vancouver-rockies-lake-louise.jpg",
    tags: ["Vancouver", "Victoria", "Banff", "Jasper", "Lake Louise"],
    tourType: "Bus Tour",
    departureCity: "Ottawa",
    featured: true,
  },
  {
    slug: "southern-france-italy",
    title: "Southern France & Italy",
    region: "Europe",
    duration: "9 Days",
    description: "Paris, Lucerne, Milan, Venice, Rome, Vatican, and Nice",
    image: "/southern-france-italy-venice.jpg",
    tags: ["Paris", "Venice", "Rome", "Nice"],
    tourType: "Group Tour",
    rating: 5.0,
    reviewCount: 50,
    departureCity: "Ottawa",
    featured: true,
    hotSale: true,
  },
  {
    slug: "american-east-coast",
    title: "American East Coast",
    region: "USA",
    duration: "4 Days",
    description: "New York City, Washington DC, Philadelphia, and Outlets",
    image: "/american-east-coast-new-york.jpg",
    tags: ["New York", "Washington DC", "Philadelphia"],
    tourType: "Bus Tour",
    departureCity: "Ottawa",
    featured: true,
  },
  {
    slug: "highlights-of-japan",
    title: "Highlights of Japan",
    region: "Asia",
    duration: "6 Days",
    description: "Tokyo, Mt. Fuji, Hakone, Kyoto, and Nara",
    image: "/highlights-japan-mt-fuji.jpg",
    tags: ["Tokyo", "Mt. Fuji", "Kyoto", "Nara"],
    tourType: "Group Tour",
    departureCity: "Ottawa",
    featured: true,
  },
  {
    slug: "across-canada-10-day",
    code: "NE06",
    title: "Across Canada 10-Day",
    region: "Canada",
    duration: "10 Days",
    description:
      "Cross Canada from Ottawa to the Rockies and Pacific coast by coach.",
    image: "/european-cities-paris-eiffel-tower-romantic.jpg",
    tags: ["Ottawa", "Vancouver", "The Rockies", "Calgary"],
    tourType: "Bus Tour",
    rating: 5.0,
    reviewCount: 100,
    departureCity: "Ottawa",
    hotSale: true,
  },
];

export function getTourBySlug(slug: string): Tour | undefined {
  return tours.find((t) => t.slug === slug);
}

const FEATURED_SLUGS = [
  "maritime-provinces-and-gaspe",
  "across-canada-10-day",
  "toronto-niagara-falls",
  "vancouver-rockies",
] as const;

export function getFeaturedTours(): Tour[] {
  return FEATURED_SLUGS.map((slug) => tours.find((t) => t.slug === slug)).filter(
    (t): t is Tour => t != null,
  );
}

export function getTourCategoryLabel(tour: Tour): string {
  if (tour.tourType === "Bus Tour") return "Bus Tours";
  if (tour.tourType === "Group Tour") return "Vacation Packages";
  return tour.tourType;
}

export function getTourDisplayPrice(tour: Tour): string {
  if (tour.fares?.length) {
    const lowest = tour.fares.reduce((min, fare) => {
      const amount = Number.parseFloat(fare.price.replace(/[^0-9.]/g, ""));
      const minAmount = Number.parseFloat(min.price.replace(/[^0-9.]/g, ""));
      return amount < minAmount ? fare : min;
    });
    return `from ${lowest.price}`;
  }
  return "Contact for price";
}

export function getHotSaleTours(): Tour[] {
  return tours.filter((t) => t.hotSale);
}

export function getTourDisplayTitle(tour: Tour): string {
  return tour.pageTitle ?? tour.title;
}

export function getBookingMailto(tour: Tour): string {
  const subject = encodeURIComponent(
    `Booking request — ${getTourDisplayTitle(tour)}${tour.code ? ` (${tour.code})` : ""}`,
  );
  return `mailto:info@midearth.ca?subject=${subject}`;
}

export const tourCategories = [
  "Bus Tours",
  "Vacation Packages",
  "Sun Destinations",
] as const;

const categorySlugMap: Record<(typeof tourCategories)[number], string> = {
  "Bus Tours": "bus-tours",
  "Vacation Packages": "vacation-packages",
  "Sun Destinations": "sun-destinations",
};

const categoryImageMap: Record<(typeof tourCategories)[number], string> = {
  "Bus Tours": "/toronto-niagara-falls-canada.jpg",
  "Vacation Packages": "/maritime-provinces-gaspe-peggys-cove.jpg",
  "Sun Destinations": "/african-safari-wildlife-elephants-sunset.jpg",
};

export function getTourCategorySlug(category: (typeof tourCategories)[number]) {
  return categorySlugMap[category];
}

export function getTourCategoryImage(category: (typeof tourCategories)[number]) {
  return categoryImageMap[category];
}

export function getToursForCategoryName(
  category: (typeof tourCategories)[number],
): Tour[] {
  if (category === "Bus Tours") {
    return tours.filter((t) => t.tourType === "Bus Tour");
  }
  if (category === "Vacation Packages") {
    return tours.filter((t) => t.tourType === "Group Tour");
  }
  return [];
}
