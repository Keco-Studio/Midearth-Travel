"use client";

import Image from "next/image";
import Link from "next/link";
import { getCategoryHref } from "@/data/categories";
import { useLang } from "@/context/lang-context";
import { getStringContent, type ContentData } from "@/lib/content-values";
import {
  destinationCategorySeeds,
  type DestinationCategory,
} from "@/lib/destination-categories";
import styles from "./category-grid.module.css";

export function CategoryGrid({
  content = {},
  categories = destinationCategorySeeds,
}: {
  content?: ContentData;
  categories?: DestinationCategory[];
}) {
  const { lang } = useLang();
  const eyebrow = getStringContent(content, "eyebrow", "Explore Destinations");
  const sectionTitle = getStringContent(content, "sectionTitle", "Where to Go");
  const subtitle = getStringContent(content, "subtitle", "Explore Destinations");
  const deck = getStringContent(
    content,
    "deck",
    "Six broad strokes — pick one and we'll narrow it down. From a weekend in Niagara to nine days winding the Mediterranean, every category below has a real itinerary behind it.",
  );

  return (
    <section id="destinations" className={`browse-section ${styles.section}`}>
      <div className="browse-container">
        <div className="browse-section-head">
          <div>
            <div className="browse-eyebrow">— {eyebrow}</div>
            <h2 className="browse-section-title">{sectionTitle}</h2>
            <p className="browse-section-subtitle">{subtitle}</p>
          </div>
          <p className="browse-section-deck">
            {deck}
          </p>
        </div>
        <div className="cat-grid">
          {categories.map((cat, i) => (
            <Link
              key={cat.id}
              className={`cat-card cat-card-${i} relative`}
              href={getCategoryHref(cat)}
            >
              <div className="absolute inset-0">
                <Image
                  src={cat.image}
                  alt=""
                  fill
                  sizes={
                    i === 0
                      ? "(max-width: 900px) 100vw, 58vw"
                      : i <= 2
                        ? "(max-width: 900px) 50vw, 42vw"
                        : "(max-width: 900px) 50vw, 33vw"
                  }
                  priority={i === 0}
                  className="cat-card-image object-cover"
                />
              </div>
              <div className="cat-card-veil" />
              <div className="cat-card-body">
                <div>
                  <div className="cat-card-count">
                    {String(cat.count).padStart(2, "0")} trips
                  </div>
                  <div className="cat-card-title">
                    {lang === "zh" ? cat.titleZh : cat.titleEn}
                  </div>
                </div>
                <div className="cat-card-arrow">→</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
