"use client";

import Image from "next/image";
import Link from "next/link";
import { useLang } from "@/context/lang-context";
import { useSiteSettings } from "@/context/site-settings-context";
import { getTourPriceLabel } from "@/data/tour-filters";
import type { RegionListingCard } from "@/data/destinations-by-region";
import {
  destinationCategorySeeds,
  type DestinationCategory,
} from "@/lib/destination-categories";
import { getTourRegionBadge } from "@/lib/tour-destination-categories";
import { getConfiguredContactHref, getTourPublicHref } from "@/lib/tour-content-audit";
import { getLocalizedStaticText, getLocalizedTourList, getLocalizedTourValue } from "@/lib/localized-content";
import styles from "./listing.module.css";

export function TourListingCard({
  tour,
  destinationCategories = destinationCategorySeeds,
}: {
  tour: RegionListingCard;
  destinationCategories?: DestinationCategory[];
}) {
  const { lang } = useLang();
  const settings = useSiteSettings();
  const price = getTourPriceLabel(tour);
  const priceFrom = price.startsWith("from ");
  const highlights = getLocalizedTourList(
    lang,
    tour.localizedHighlights,
    tour.highlights ?? tour.tags,
  );
  const title = getLocalizedTourValue(lang, tour.localizedTitle, tour.title);
  const duration = getLocalizedTourValue(lang, tour.localizedDuration, tour.duration);
  const href = tour.href ?? getTourPublicHref(
    tour,
    getConfiguredContactHref(settings.emailHref, settings.primaryPhoneHref),
  );
  const regionBadge = getTourRegionBadge(tour, destinationCategories);

  return (
    <article className={styles.tourCard}>
      <Link className={styles.tourCardImgLink} href={href}>
        <Image
          src={tour.image}
          alt={title}
          fill
          unoptimized
          sizes="(max-width: 768px) 100vw, 400px"
          className={styles.tourCardImg}
        />
        {tour.code && <div className={styles.tourCardCode}>{tour.code}</div>}
        <div className={styles.tourCardRegion}>{regionBadge}</div>
      </Link>
      <div className={styles.tourCardBody}>
        <div className={styles.tourCardMeta}>
          <span>{tour.tourType}</span>
          <span className={styles.tourCardMetaDot}>·</span>
          <span>{duration}</span>
        </div>
        <h3 className={styles.tourCardTitle}>
          <Link href={href}>{title}</Link>
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
                <span className={styles.priceLabel}>{getLocalizedStaticText(lang, "from")}</span>
                <span className={styles.priceAmt}>
                  {price.replace("from ", "")}
                </span>
              </>
            ) : (
              <span className={styles.priceContact}>{price}</span>
            )}
          </div>
          <Link className={styles.viewLink} href={href}>
            {getLocalizedStaticText(lang, "viewTour")} →
          </Link>
        </div>
      </div>
    </article>
  );
}
