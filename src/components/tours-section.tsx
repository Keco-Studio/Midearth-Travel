import Link from "next/link";
import { TourCard } from "@/components/tour-card";
import { getFeaturedTours, tours as staticTours, type Tour } from "@/data/tours";
import { getStringContent, type ContentData } from "@/lib/content-values";
import styles from "./tours-section.module.css";

export function ToursSection({
  content = {},
  tours,
}: {
  content?: ContentData;
  tours?: Tour[];
}) {
  const sourceTours = tours ?? staticTours;
  const featuredTours = tours
    ? sourceTours.filter((tour) => tour.featured).slice(0, 4)
    : getFeaturedTours();
  const eyebrow = getStringContent(content, "eyebrow", "Featured");
  const sectionTitle = getStringContent(content, "sectionTitle", "Our Top Picks");
  const seeAllLabel = getStringContent(content, "seeAllLabel", `See all ${sourceTours.length} tours`);
  const seeAllLink = getStringContent(content, "seeAllLink", "/tours");

  return (
    <section id="tours" className={`section ${styles.section}`}>
      <div className="container">
        <div className="section-head">
          <div>
            <div className="eyebrow">— {eyebrow}</div>
            <h2 className="section-title">{sectionTitle}</h2>
          </div>
          <Link className={`link-arrow ${styles.seeAllLink}`} href={seeAllLink}>
            {seeAllLabel} →
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
