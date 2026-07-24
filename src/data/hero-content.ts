export const heroBroadcastSeeds = [
  "The Shire — golden hills at dusk, perfect for a peaceful countryside tour",
  "Helm's Deep — battle reported; guided groups rerouted via safer mountain passes",
  "Rivendell — waterfalls in full bloom, ideal for spring photography trips",
  "Rohan — endless green plains under open sky, horseback tours now available",
  "Moria — low visibility in the depths; expert-led expeditions recommended",
  "Gondor — panoramic views from the White City, sunset bookings open",
  "Lothlórien — silver mist over the forest canopy, a rare scenic window",
  "Grey Havens — calm seas at twilight, coastal cruises departing at dusk",
];

export type HeroCardIconName = "Plane" | "Bus" | "Globe" | "Ship";

export const heroFeatureCardSeeds = [
  {
    icon: "Plane" as const,
    iconImage: "",
    title: "Flight Booking",
    description: "Best Airfares Worldwide",
    href: "/#services",
  },
  {
    icon: "Bus" as const,
    iconImage: "",
    title: "Bus Tours",
    description: "Charter & Group Transportation",
    href: "/tours",
  },
  {
    icon: "Globe" as const,
    iconImage: "",
    title: "Worldwide Travel",
    description: "Worldwide Cruise Packages",
    href: "/tours",
  },
  {
    icon: "Ship" as const,
    iconImage: "",
    title: "Other Services",
    description: "Canada & International Tours",
    href: "/#services",
  },
];
