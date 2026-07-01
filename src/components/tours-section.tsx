import Link from "next/link";
import { TourCard } from "@/components/tour-card";
import { getFeaturedTours, tours } from "@/data/tours";
import styles from "./tours-section.module.css";

export function ToursSection() {
  const featuredTours = getFeaturedTours();

  return (
    <section id="tours" className={`section ${styles.section}`}>
      <div className="container">
        <div className="section-head">
          <div>
            <div className="eyebrow">— Featured</div>
            <h2 className="section-title">Our Top Picks</h2>
          </div>
          <Link className={`link-arrow ${styles.seeAllLink}`} href="/tours">
            See all {tours.length} tours →
          </Link>
        </div>
        <div className="tour-grid">
          {featuredTours.map((tour) => (
            <TourCard key={tour.slug} tour={tour} />
          ))}
        </div>
      </div>
    </section>
  );
}
