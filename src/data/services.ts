export type Service = {
  id: string;
  slug: string;
  title: string;
  summary: string;
};

export const services: Service[] = [
  {
    id: "bus-tours",
    slug: "bus-tours",
    title: "Bus Tours",
    summary: "Multi-day coach tours from Ottawa.",
  },
  {
    id: "flights",
    slug: "flights",
    title: "Flights",
    summary: "Competitive global fares with concierge support.",
  },
  {
    id: "hotels",
    slug: "hotels",
    title: "Hotels",
    summary: "From boutique to five-star, hand-picked stays.",
  },
  {
    id: "travel-insurance",
    slug: "travel-insurance",
    title: "Travel Insurance",
    summary: "Trip cancellation, medical, and beyond.",
  },
  {
    id: "visa-application",
    slug: "visa-application",
    title: "VISA Application",
    summary: "Document support for China, Vietnam & more.",
  },
];
