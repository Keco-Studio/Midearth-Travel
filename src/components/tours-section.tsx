"use client";

import Link from "next/link";
import { TourCard } from "@/components/tour-card";
import { useLang } from "@/context/lang-context";
import { tours as staticTours, type Tour } from "@/data/tours";
import { type ContentData } from "@/lib/content-values";
import { getLocalizedContent, getLocalizedStaticText } from "@/lib/localized-content";
import {
  destinationCategorySeeds,
  type DestinationCategory,
} from "@/lib/destination-categories";
import styles from "./tours-section.module.css";

export function ToursSection({
  content = {},
  tours,
  destinationCategories = destinationCategorySeeds,
}: {
  content?: ContentData;
  tours?: Tour[];
  destinationCategories?: DestinationCategory[];
}) {
  const { lang } = useLang();
  const sourceTours = tours ?? staticTours;
  const featuredTours = sourceTours.filter((tour) => tour.featured);
  const eyebrow = getLocalizedContent(content, "eyebrow", lang, "Featured");
  const sectionTitle = getLocalizedContent(content, "sectionTitle", lang, "Our Top Picks");
  const seeAllLabel = `${getLocalizedStaticText(lang, "seeAllTours")} (${sourceTours.length})`;
  const seeAllLink = "/tours";

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
            <TourCard
              key={tour.slug}
              tour={tour}
              destinationCategories={destinationCategories}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
