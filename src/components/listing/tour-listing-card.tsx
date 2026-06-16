import Image from "next/image";
import Link from "next/link";
import { getTourPriceLabel } from "@/data/tour-filters";
import type { RegionListingCard } from "@/data/destinations-by-region";
import styles from "./listing.module.css";

export function TourListingCard({ tour }: { tour: RegionListingCard }) {
  const price = getTourPriceLabel(tour);
  const priceFrom = price.startsWith("from ");
  const highlights = tour.highlights ?? tour.tags;
  const href = tour.href ?? `/tours/${tour.slug}`;

  return (
    <article className={styles.tourCard}>
      <Link className={styles.tourCardImgLink} href={href}>
        <Image
          src={tour.image}
          alt={tour.title}
          fill
          unoptimized
          sizes="(max-width: 768px) 100vw, 400px"
          className={styles.tourCardImg}
        />
        {tour.code && <div className={styles.tourCardCode}>{tour.code}</div>}
        <div className={styles.tourCardRegion}>{tour.region}</div>
      </Link>
      <div className={styles.tourCardBody}>
        <div className={styles.tourCardMeta}>
          <span>{tour.tourType}</span>
          <span className={styles.tourCardMetaDot}>·</span>
          <span>{tour.duration}</span>
        </div>
        <h3 className={styles.tourCardTitle}>
          <Link href={href}>{tour.title}</Link>
        </h3>
        <div className={styles.tourCardHighlights}>
          {highlights.slice(0, 4).map((h) => (
            <span key={h} className={styles.chip}>
              {h}
            </span>
          ))}
        </div>
        <div className={styles.tourCardFoot}>
          <div className={styles.tourCardPrice}>
            {priceFrom ? (
              <>
                <span className={styles.priceLabel}>from</span>
                <span className={styles.priceAmt}>
                  {price.replace("from ", "")}
                </span>
              </>
            ) : (
              <span className={styles.priceContact}>{price}</span>
            )}
          </div>
          <Link className={styles.viewLink} href={href}>
            View →
          </Link>
        </div>
      </div>
    </article>
  );
}
