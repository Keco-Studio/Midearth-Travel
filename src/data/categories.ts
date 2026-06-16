export type BrowseCategory = {
  title: string;
  count: number;
  slug: string;
  kind: "route" | "tour";
  image: string;
};

export const browseCategories: BrowseCategory[] = [
  {
    title: "North America",
    count: 14,
    slug: "north-america",
    kind: "route",
    image: "/hero/hero1.jpg",
  },
  {
    title: "Asia",
    count: 9,
    slug: "asia",
    kind: "route",
    image: "/highlights-japan-mt-fuji.jpg",
  },
  {
    title: "Europe",
    count: 18,
    slug: "europe",
    kind: "route",
    image: "/southern-france-italy-venice.jpg",
  },
  {
    title: "Sun Destinations",
    count: 11,
    slug: "sun-destinations",
    kind: "route",
    image: "/african-safari-wildlife-elephants-sunset.jpg",
  },
  {
    title: "Bus Tours",
    count: 7,
    slug: "bus-tours",
    kind: "tour",
    image: "/toronto-niagara-falls-canada.jpg",
  },
  {
    title: "Vacation Packages",
    count: 22,
    slug: "vacation-packages",
    kind: "tour",
    image: "/maritime-provinces-gaspe-peggys-cove.jpg",
  },
];

export const categoryMeta: Record<
  string,
  { title: string; summary: string; image: string; filterTourType?: string }
> = {
  "bus-tours": {
    title: "Bus Tours",
    summary:
      "Multi-day coach tours from Ottawa — comfortable seats, knowledgeable drivers, real bathroom stops.",
    image: "/toronto-niagara-falls-canada.jpg",
    filterTourType: "Bus Tour",
  },
  "vacation-packages": {
    title: "Vacation Packages",
    summary: "Flight + hotel + ground packages, hand-built and double-checked.",
    image: "/maritime-provinces-gaspe-peggys-cove.jpg",
    filterTourType: "Group Tour",
  },
  "sun-destinations": {
    title: "Sun Destinations",
    summary: "Beach resorts and cruises for when winter has lasted long enough.",
    image: "/african-safari-wildlife-elephants-sunset.jpg",
  },
  all: {
    title: "All Tours",
    summary: "Every trip on the books, filterable.",
    image: "/maritime-provinces-gaspe-peggys-cove.jpg",
  },
};

export function getCategoryHref(cat: BrowseCategory): string {
  return cat.kind === "route"
    ? `/routes/${cat.slug}`
    : `/tours/category/${cat.slug}`;
}
