export type Region = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  destinations: string[];
  image: string;
};

export const regions: Region[] = [
  {
    id: "north-america",
    slug: "north-america",
    title: "North America",
    summary: "Coast-to-coast Canada plus the great American cities.",
    destinations: [
      "Toronto",
      "Niagara Falls",
      "Maritime Provinces",
      "Vancouver",
      "Banff",
      "New York",
      "Washington DC",
    ],
    image: "/hero/hero1.jpg",
  },
  {
    id: "asia",
    slug: "asia",
    title: "Asia",
    summary: "Cultural deep-dives and culinary capitals.",
    destinations: ["Japan", "Vietnam", "Thailand", "Korea", "China"],
    image: "/highlights-japan-mt-fuji.jpg",
  },
  {
    id: "europe",
    slug: "europe",
    title: "Europe",
    summary: "From the Atlantic to the Adriatic.",
    destinations: ["France", "Italy", "Greece", "Switzerland", "Spain"],
    image: "/southern-france-italy-venice.jpg",
  },
  {
    id: "sun-destinations",
    slug: "sun-destinations",
    title: "Sun Destinations",
    summary: "Beach resorts and cruises for when winter has lasted long enough.",
    destinations: ["Cuba", "Mexico", "Maldives", "Caribbean"],
    image: "/african-safari-wildlife-elephants-sunset.jpg",
  },
];

export function getRegionBySlug(slug: string): Region | undefined {
  return regions.find((r) => r.slug === slug);
}
