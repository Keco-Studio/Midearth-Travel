import Link from "next/link";
import {
  destinationsByRegion,
  groupToursByRegion,
  resolveRegionCards,
} from "@/data/destinations-by-region";
import type { Tour } from "@/data/tours";
import {
  destinationCategorySeeds,
  type DestinationCategory,
} from "@/lib/destination-categories";
import { getTourRegionBadge } from "@/lib/tour-destination-categories";
import { useLang } from "@/context/lang-context";
import styles from "./browse-sections.module.css";
import listingStyles from "./listing.module.css";
import { TourListingCard } from "./tour-listing-card";

export function DestinationsByRegion({
  tours,
  onlyLiveTours = false,
  eyebrow = "Explore the World",
  title = "Destinations by Region",
  subtitle,
  destinationCategories = destinationCategorySeeds,
}: {
  tours: readonly Tour[];
  onlyLiveTours?: boolean;
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  destinationCategories?: DestinationCategory[];
}) {
  const { lang } = useLang();
  return (
    <>
      <div className={styles.secHead}>
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h2 className={styles.secTitle}>{title}</h2>
        {subtitle ? <p className={styles.secSubtitle}>{subtitle}</p> : null}
      </div>

      <div className={styles.regionStack}>
        {onlyLiveTours
          ? groupToursByRegion(
              tours,
              (tour) => getTourRegionBadge(tour, destinationCategories, lang),
            ).map((region) => (
              <div key={region.name}>
                <div className={styles.regionHead}>
                  <h3>{region.name}</h3>
                </div>
                <div className={listingStyles.tourGrid}>
                  {region.tours.map((tour) => (
                    <TourListingCard key={tour.slug} tour={tour} />
                  ))}
                </div>
              </div>
            ))
          : destinationsByRegion.map((region) => {
          const cards = resolveRegionCards(region.items, tours);

          return (
            <div key={region.name}>
              <div className={styles.regionHead}>
                <h3>
                  <Link href={region.href}>{region.name}</Link>
                </h3>
                <span>{region.desc}</span>
              </div>
              <div className={listingStyles.tourGrid}>
                {cards.map((tour) => (
                  <TourListingCard key={tour.slug} tour={tour} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
