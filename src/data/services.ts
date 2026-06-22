export type Service = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  image: string;
};

export const services: Service[] = [
  {
    id: "flights",
    slug: "flights",
    title: "Flights",
    summary: "Competitive global fares with concierge support.",
    image: "/american-east-coast-new-york.jpg",
  },
  {
    id: "hotels",
    slug: "hotels",
    title: "Hotels",
    summary: "From boutique to five-star, hand-picked stays.",
    image: "/european-cities-paris-eiffel-tower-romantic.jpg",
  },
  {
    id: "charters",
    slug: "charters",
    title: "Charters",
    summary: "Coach + driver bookings for groups & events.",
    image: "/toronto-niagara-falls-canada.jpg",
  },
  {
    id: "travel-insurance",
    slug: "travel-insurance",
    title: "Travel Insurance",
    summary: "Trip cancellation, medical, and beyond.",
    image: "/vancouver-rockies-lake-louise.jpg",
  },
  {
    id: "visa-application",
    slug: "visa-application",
    title: "Visa Application",
    summary: "Document support for China, Vietnam & more.",
    image: "/highlights-japan-mt-fuji.jpg",
  },
];
