import Link from "next/link";
import {
  destinationsByRegion,
  resolveRegionCards,
} from "@/data/destinations-by-region";
import styles from "./browse-sections.module.css";
import listingStyles from "./listing.module.css";
import { TourListingCard } from "./tour-listing-card";

export function DestinationsByRegion() {
  return (
    <>
      <div className={styles.secHead}>
        <p className={styles.eyebrow}>Explore the World</p>
        <h2 className={styles.secTitle}>Destinations by Region</h2>
      </div>

      <div className={styles.regionStack}>
        {destinationsByRegion.map((region) => {
          const cards = resolveRegionCards(region.items);

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
