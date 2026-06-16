export type MonthDestination = {
  name: string;
  region: string;
  tag: string;
  desc: string;
  image: string;
  href?: string;
};

export type MonthEntry = {
  month: string;
  label: string;
  destinations: MonthDestination[];
};

export const destinationsByMonth: MonthEntry[] = [
  {
    month: "Jan",
    label: "January",
    destinations: [
      {
        name: "Maldives",
        region: "Indian Ocean",
        tag: "Beach & Relax",
        desc: "Peak dry season — crystal lagoons and cloudless skies perfect for unwinding",
        image: "/african-safari-wildlife-elephants-sunset.jpg",
        href: "/routes/sun-destinations",
      },
      {
        name: "Thailand",
        region: "Southeast Asia",
        tag: "Culture & Beach",
        desc: "Cool dry season ideal for temples, cooking classes and turquoise beaches",
        image: "/highlights-japan-mt-fuji.jpg",
        href: "/routes/asia",
      },
      {
        name: "Vietnam",
        region: "Southeast Asia",
        tag: "Heritage & Nature",
        desc: "Mild winter weather, ideal for Ha Long Bay cruises and Hoi An old town",
        image: "/highlights-japan-mt-fuji.jpg",
        href: "/routes/asia",
      },
    ],
  },
  {
    month: "Feb",
    label: "February",
    destinations: [
      {
        name: "Japan",
        region: "East Asia",
        tag: "Plum Blossoms",
        desc: "Early spring colour before sakura season, with far fewer crowds",
        image: "/highlights-japan-mt-fuji.jpg",
        href: "/tours/highlights-of-japan",
      },
      {
        name: "Maldives",
        region: "Indian Ocean",
        tag: "Romantic Escape",
        desc: "Overwater bungalows, bioluminescent bays and total tranquillity",
        image: "/african-safari-wildlife-elephants-sunset.jpg",
        href: "/routes/sun-destinations",
      },
      {
        name: "Cuba",
        region: "Caribbean",
        tag: "Sun & Culture",
        desc: "Warm breezes, salsa rhythms and classic Havana architecture",
        image: "/african-safari-wildlife-elephants-sunset.jpg",
        href: "/routes/sun-destinations",
      },
    ],
  },
  {
    month: "Mar",
    label: "March",
    destinations: [
      {
        name: "Japan",
        region: "East Asia",
        tag: "Early Sakura",
        desc: "Cherry blossoms begin blooming — Tokyo and Kyoto come alive in pink",
        image: "/highlights-japan-mt-fuji.jpg",
        href: "/tours/highlights-of-japan",
      },
      {
        name: "Vietnam",
        region: "Southeast Asia",
        tag: "Hoi An Lanterns",
        desc: "Brilliant lantern festivals and ideal Central Vietnam weather",
        image: "/highlights-japan-mt-fuji.jpg",
        href: "/routes/asia",
      },
      {
        name: "New Zealand",
        region: "South Pacific",
        tag: "Autumn Adventure",
        desc: "Harvest colours arrive, Fiordland is quiet and spectacularly clear",
        image: "/vancouver-rockies-lake-louise.jpg",
        href: "/routes/asia",
      },
    ],
  },
  {
    month: "Apr",
    label: "April",
    destinations: [
      {
        name: "Japan",
        region: "East Asia",
        tag: "Peak Sakura",
        desc: "Full bloom pink canopies drape every park and temple in the country",
        image: "/highlights-japan-mt-fuji.jpg",
        href: "/tours/highlights-of-japan",
      },
      {
        name: "Bali",
        region: "Southeast Asia",
        tag: "Temples & Rice Fields",
        desc: "Dry season begins — the best time to explore Ubud's lush interior",
        image: "/highlights-japan-mt-fuji.jpg",
        href: "/routes/asia",
      },
      {
        name: "France",
        region: "Europe",
        tag: "Spring in Paris",
        desc: "Gardens bloom along the Seine and café terraces open for the season",
        image: "/european-cities-paris-eiffel-tower-romantic.jpg",
        href: "/routes/europe",
      },
    ],
  },
  {
    month: "May",
    label: "May",
    destinations: [
      {
        name: "Italy",
        region: "Europe",
        tag: "Before the Crowds",
        desc: "Perfect Amalfi Coast weather before the summer rush arrives",
        image: "/southern-france-italy-venice.jpg",
        href: "/tours/southern-france-italy",
      },
      {
        name: "Canada Rockies",
        region: "Canada",
        tag: "Opening Season",
        desc: "Banff and Jasper emerge from winter — trails clear, wildlife active",
        image: "/vancouver-rockies-lake-louise.jpg",
        href: "/tours/vancouver-rockies",
      },
      {
        name: "Vietnam",
        region: "Southeast Asia",
        tag: "Southern Beaches",
        desc: "Phu Quoc and Da Nang shimmer in warm early-summer sunshine",
        image: "/highlights-japan-mt-fuji.jpg",
        href: "/routes/asia",
      },
    ],
  },
  {
    month: "Jun",
    label: "June",
    destinations: [
      {
        name: "Greece",
        region: "Europe",
        tag: "Santorini & Islands",
        desc: "Whitewashed domes, turquoise water and 14 hours of golden daylight",
        image: "/southern-france-italy-venice.jpg",
        href: "/routes/europe",
      },
      {
        name: "Canada Maritimes",
        region: "Canada",
        tag: "Scenic Coast",
        desc: "Bay of Fundy tides, Peggy's Cove lighthouse and fresh lobster feasts",
        image: "/maritime-provinces-gaspe-peggys-cove.jpg",
        href: "/tours/maritime-provinces-and-gaspe",
      },
      {
        name: "South Korea",
        region: "East Asia",
        tag: "Summer Culture",
        desc: "K-food tours, night markets and verdant mountain temples",
        image: "/highlights-japan-mt-fuji.jpg",
        href: "/routes/asia",
      },
    ],
  },
  {
    month: "Jul",
    label: "July",
    destinations: [
      {
        name: "Canada Rockies",
        region: "Canada",
        tag: "Peak Summer",
        desc: "Lake Louise mirrors the peaks in perfect jade green — unmissable",
        image: "/vancouver-rockies-lake-louise.jpg",
        href: "/tours/vancouver-rockies",
      },
      {
        name: "Greece",
        region: "Europe",
        tag: "Island Hopping",
        desc: "Warmest Aegean seas and the longest, laziest Mediterranean days",
        image: "/southern-france-italy-venice.jpg",
        href: "/routes/europe",
      },
      {
        name: "Japan",
        region: "East Asia",
        tag: "Fireworks & Matsuri",
        desc: "Vibrant summer festivals, yukata culture and incredible fireworks",
        image: "/highlights-japan-mt-fuji.jpg",
        href: "/tours/highlights-of-japan",
      },
    ],
  },
  {
    month: "Aug",
    label: "August",
    destinations: [
      {
        name: "USA East Coast",
        region: "USA",
        tag: "City & History",
        desc: "New York, Washington DC, Philadelphia at their summer best",
        image: "/american-east-coast-new-york.jpg",
        href: "/tours/american-east-coast",
      },
      {
        name: "Canada Maritimes",
        region: "Canada",
        tag: "Coastal Roads",
        desc: "Cabot Trail foliage arrives early, whale watching at its peak",
        image: "/maritime-provinces-gaspe-peggys-cove.jpg",
        href: "/tours/maritime-provinces-and-gaspe",
      },
      {
        name: "Italy",
        region: "Europe",
        tag: "Mediterranean Summer",
        desc: "Warmest seas of the year — ideal for Cinque Terre and Sicily",
        image: "/southern-france-italy-venice.jpg",
        href: "/tours/southern-france-italy",
      },
    ],
  },
  {
    month: "Sep",
    label: "September",
    destinations: [
      {
        name: "Japan",
        region: "East Asia",
        tag: "Early Autumn Leaves",
        desc: "Koyo season begins in Hokkaido — fiery reds and amber begin",
        image: "/highlights-japan-mt-fuji.jpg",
        href: "/tours/highlights-of-japan",
      },
      {
        name: "Vietnam",
        region: "Southeast Asia",
        tag: "Golden Rice Fields",
        desc: "Sapa terraces glow amber as the harvest begins in the highlands",
        image: "/highlights-japan-mt-fuji.jpg",
        href: "/routes/asia",
      },
      {
        name: "Australia",
        region: "South Pacific",
        tag: "Spring Arrival",
        desc: "Wildflowers carpet the valleys and whale watching season starts",
        image: "/vancouver-rockies-lake-louise.jpg",
        href: "/routes/asia",
      },
    ],
  },
  {
    month: "Oct",
    label: "October",
    destinations: [
      {
        name: "Japan",
        region: "East Asia",
        tag: "Peak Autumn Foliage",
        desc: "Maple and ginkgo in blazing colour from Tokyo to Kyoto",
        image: "/highlights-japan-mt-fuji.jpg",
        href: "/tours/highlights-of-japan",
      },
      {
        name: "Australia",
        region: "South Pacific",
        tag: "Great Barrier Reef",
        desc: "Warm spring waters return — perfect for snorkelling and sailing",
        image: "/african-safari-wildlife-elephants-sunset.jpg",
        href: "/routes/sun-destinations",
      },
      {
        name: "New Zealand",
        region: "South Pacific",
        tag: "Spring Splendour",
        desc: "Milford Sound and Queenstown bloom with spring wildflowers",
        image: "/vancouver-rockies-lake-louise.jpg",
        href: "/routes/asia",
      },
    ],
  },
  {
    month: "Nov",
    label: "November",
    destinations: [
      {
        name: "Vietnam",
        region: "Southeast Asia",
        tag: "Hoi An Lanterns",
        desc: "The iconic lantern festival draws its most magical, romantic atmosphere",
        image: "/highlights-japan-mt-fuji.jpg",
        href: "/routes/asia",
      },
      {
        name: "Thailand",
        region: "Southeast Asia",
        tag: "Loy Krathong",
        desc: "Floating lanterns drift over rivers as the cool season begins",
        image: "/highlights-japan-mt-fuji.jpg",
        href: "/routes/asia",
      },
      {
        name: "Caribbean",
        region: "Caribbean",
        tag: "Winter Escape",
        desc: "Trade wind season brings calm seas and endless all-inclusive warmth",
        image: "/african-safari-wildlife-elephants-sunset.jpg",
        href: "/routes/sun-destinations",
      },
    ],
  },
  {
    month: "Dec",
    label: "December",
    destinations: [
      {
        name: "Maldives",
        region: "Indian Ocean",
        tag: "Festive Paradise",
        desc: "Welcome the New Year from a private overwater villa at sunset",
        image: "/african-safari-wildlife-elephants-sunset.jpg",
        href: "/routes/sun-destinations",
      },
      {
        name: "Thailand",
        region: "Southeast Asia",
        tag: "Peak Season",
        desc: "Warm, dry and festive — Thailand at its absolute finest",
        image: "/highlights-japan-mt-fuji.jpg",
        href: "/routes/asia",
      },
      {
        name: "Japan",
        region: "East Asia",
        tag: "Winter Illuminations",
        desc: "Magical light gardens, steaming hot springs and crisp mountain air",
        image: "/highlights-japan-mt-fuji.jpg",
        href: "/tours/highlights-of-japan",
      },
    ],
  },
];
