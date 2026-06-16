export type Testimonial = {
  id: string;
  name: string;
  source: string;
  rating: number;
  text: string;
};

export const testimonials: Testimonial[] = [
  {
    id: "r1",
    name: "Alexander L.",
    source: "Google Review",
    rating: 5,
    text: "We had a great vacation with MidEarth Travel. The tour guide and driver worked hard to make the trip comfortable and memorable from start to finish.",
  },
  {
    id: "r2",
    name: "Joanna I.",
    source: "Google Review",
    rating: 5,
    text: "The trip was well organized and enjoyable — we never felt rushed and every hotel exceeded what we expected. Will absolutely book again.",
  },
  {
    id: "r3",
    name: "FunMath",
    source: "Google Review",
    rating: 5,
    text: "A good trip with an enthusiastic tour guide at an affordable price. The tour was well organized and the service was thoughtful throughout.",
  },
  {
    id: "r4",
    name: "Priya R.",
    source: "Google Review",
    rating: 5,
    text: "Booked our Japan trip last minute and the team handled everything — flights, ryokan stays, even shinkansen seats. Showed up to a perfect itinerary.",
  },
];
