import Image from "next/image";
import Link from "next/link";
import { browseCategories, getCategoryHref } from "@/data/categories";
import styles from "./category-grid.module.css";

export function CategoryGrid() {
  return (
    <section id="destinations" className={`browse-section ${styles.section}`}>
      <div className="browse-container">
        <div className="browse-section-head">
          <div>
            <div className="browse-eyebrow">— Explore Destinations</div>
            <h2 className="browse-section-title">Where to Go</h2>
            <p className="browse-section-subtitle">Explore Destinations</p>
          </div>
          <p className="browse-section-deck">
            Six broad strokes — pick one and we&apos;ll narrow it down. From a weekend in
            Niagara to nine days winding the Mediterranean, every category below has a real
            itinerary behind it.
          </p>
        </div>
        <div className="cat-grid">
          {browseCategories.map((cat, i) => (
            <Link
              key={cat.title}
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
                  <div className="cat-card-title">{cat.title}</div>
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
