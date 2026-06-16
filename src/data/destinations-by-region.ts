import { getTourBySlug, type Tour } from "@/data/tours";

export type RegionShowcaseRef =
  | { tourSlug: string }
  | { showcase: RegionShowcaseTour };

/** Card data for destinations without a full tour page */
export type RegionShowcaseTour = {
  slug: string;
  title: string;
  region: string;
  duration: string;
  tourType: string;
  image: string;
  tags: string[];
  href: string;
  code?: string;
};

export type RegionGroup = {
  name: string;
  desc: string;
  href: string;
  /** Up to 3 cards per region */
  items: RegionShowcaseRef[];
};

export const REGION_CARD_LIMIT = 3;

export const destinationsByRegion: RegionGroup[] = [
  {
    name: "Canada",
    desc: "Maritime Provinces · Rockies · Niagara Falls · BC Coast",
    href: "/routes/north-america",
    items: [
      { tourSlug: "maritime-provinces-and-gaspe" },
      { tourSlug: "toronto-niagara-falls" },
      { tourSlug: "vancouver-rockies" },
    ],
  },
  {
    name: "Asia",
    desc: "Japan · Vietnam · Thailand · Bali · South Korea · China",
    href: "/routes/asia",
    items: [
      { tourSlug: "highlights-of-japan" },
      {
        showcase: {
          slug: "vietnam",
          title: "Vietnam",
          region: "Asia",
          duration: "8 Days",
          tourType: "Group Tour",
          image: "/highlights-japan-mt-fuji.jpg",
          tags: ["Hanoi", "Ha Long Bay", "Hoi An"],
          href: "/routes/asia",
        },
      },
      {
        showcase: {
          slug: "thailand",
          title: "Thailand",
          region: "Asia",
          duration: "7 Days",
          tourType: "Group Tour",
          image: "/highlights-japan-mt-fuji.jpg",
          tags: ["Bangkok", "Chiang Mai", "Phuket"],
          href: "/routes/asia",
        },
      },
    ],
  },
  {
    name: "Europe",
    desc: "France · Italy · Greece · Switzerland · Spain",
    href: "/routes/europe",
    items: [
      { tourSlug: "southern-france-italy" },
      {
        showcase: {
          slug: "france",
          title: "France",
          region: "Europe",
          duration: "6 Days",
          tourType: "Group Tour",
          image: "/european-cities-paris-eiffel-tower-romantic.jpg",
          tags: ["Paris", "Loire Valley", "Normandy"],
          href: "/routes/europe",
        },
      },
      {
        showcase: {
          slug: "greece",
          title: "Greece",
          region: "Europe",
          duration: "8 Days",
          tourType: "Group Tour",
          image: "/southern-france-italy-venice.jpg",
          tags: ["Athens", "Santorini", "Mykonos"],
          href: "/routes/europe",
        },
      },
    ],
  },
  {
    name: "Sun Destinations",
    desc: "Maldives · Caribbean · Mexico · Cuba · Dominican Republic",
    href: "/routes/sun-destinations",
    items: [
      {
        showcase: {
          slug: "maldives",
          title: "Maldives",
          region: "Sun Destinations",
          duration: "7–14 Days",
          tourType: "Vacation Package",
          image: "/african-safari-wildlife-elephants-sunset.jpg",
          tags: ["Maldives", "Overwater Villa", "All-Inclusive"],
          href: "/routes/sun-destinations",
        },
      },
      {
        showcase: {
          slug: "cuba",
          title: "Cuba",
          region: "Sun Destinations",
          duration: "5–10 Days",
          tourType: "Vacation Package",
          image: "/african-safari-wildlife-elephants-sunset.jpg",
          tags: ["Havana", "Varadero", "All-Inclusive"],
          href: "/routes/sun-destinations",
        },
      },
      {
        showcase: {
          slug: "caribbean",
          title: "Caribbean",
          region: "Sun Destinations",
          duration: "3–14 Days",
          tourType: "Vacation Package",
          image: "/african-safari-wildlife-elephants-sunset.jpg",
          tags: ["Mexico", "Jamaica", "Dominican Republic"],
          href: "/routes/sun-destinations",
        },
      },
    ],
  },
];

export type RegionListingCard = Tour & { href?: string };

export function resolveRegionCards(
  items: RegionShowcaseRef[],
  limit = REGION_CARD_LIMIT,
): RegionListingCard[] {
  return items.slice(0, limit).map((item) => {
    if ("tourSlug" in item) {
      const tour = getTourBySlug(item.tourSlug);
      if (!tour) {
        throw new Error(`Tour not found: ${item.tourSlug}`);
      }
      return tour;
    }
    const { href, ...rest } = item.showcase;
    return {
      ...rest,
      description: "",
      href,
    };
  });
}
