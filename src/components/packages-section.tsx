"use client";

import { Calendar, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useLang } from "@/context/lang-context";
import { useSiteSettings } from "@/context/site-settings-context";
import type { Tour } from "@/data/tours";
import {
  getHotSaleDescription,
  getHotSalePricePresentation,
  getHotSaleRegionBadge,
  getPublishedHotSalePromotions,
} from "@/lib/hot-sales";
import type { ContentData } from "@/lib/content-values";
import {
  destinationCategorySeeds,
  type DestinationCategory,
} from "@/lib/destination-categories";
import { getConfiguredContactHref, getTourPublicHref } from "@/lib/tour-content-audit";
import {
  getLocalizedContent,
  getLocalizedStaticText,
  getLocalizedTourValue,
} from "@/lib/localized-content";
import styles from "./packages-section.module.css";

export function PackagesSection({
  content = {},
  tours = [],
  destinationCategories = destinationCategorySeeds,
}: {
  content?: ContentData;
  tours?: Tour[];
  destinationCategories?: DestinationCategory[];
}) {
  const settings = useSiteSettings();
  const { lang } = useLang();
  const promotions = getPublishedHotSalePromotions(content, tours);

  if (promotions.length === 0) return null;

  const eyebrow = getLocalizedContent(
    content,
    "eyebrow",
    lang,
    "Limited-time offers",
  );
  const sectionTitle = getLocalizedContent(
    content,
    "sectionTitle",
    lang,
    getLocalizedStaticText(lang, "hotSales"),
  );
  const description = getLocalizedContent(
    content,
    "description",
    lang,
    getLocalizedStaticText(lang, "hotSalesDescription"),
  );

  return (
    <section id="packages" className={`section ${styles.section}`}>
      <div className="container">
        <div className="section-head">
          <div>
            <div className="eyebrow">— {eyebrow}</div>
            <h2 className="section-title">{sectionTitle}</h2>
          </div>
          {description ? <p className={styles.description}>{description}</p> : null}
        </div>

        <div className={styles.grid}>
          {promotions.map((promotion) => {
            const { tour } = promotion;
            const title = getLocalizedTourValue(
              lang,
              tour.localizedTitle,
              tour.title,
            );
            const duration = getLocalizedTourValue(
              lang,
              tour.localizedDuration,
              tour.duration,
            );
            const tourType = getLocalizedTourValue(
              lang,
              tour.localizedTourType,
              tour.tourType,
            );
            const offer = getHotSaleDescription(promotion, lang);
            const price = getHotSalePricePresentation(promotion);
            const regionBadge = getHotSaleRegionBadge(
              tour,
              destinationCategories,
              lang,
            );
            const href = getTourPublicHref(
              tour,
              getConfiguredContactHref(
                settings.emailHref,
                settings.primaryPhoneHref,
              ),
            );

            return (
              <article className={styles.card} key={tour.slug}>
                <Link className={styles.imageLink} href={href}>
                  <Image
                    alt={title}
                    className={styles.image}
                    fill
                    sizes="(max-width: 760px) 100vw, 400px"
                    src={tour.image}
                  />
                  <span className={styles.regionBadge}>{regionBadge}</span>
                  {offer ? <span className={styles.offerBadge}>{offer}</span> : null}
                </Link>
                <div className={styles.body}>
                  <div className={styles.meta}>
                    <span><Calendar size={15} aria-hidden />{duration}</span>
                    <span><Users size={15} aria-hidden />{tourType}</span>
                  </div>
                  <h3 className={styles.title}>
                    <Link href={href}>{title}</Link>
                  </h3>
                  {offer ? <p className={styles.offerText}>{offer}</p> : null}
                  <div className={styles.footer}>
                    <div className={styles.priceBlock}>
                      {price.originalPrice ? (
                        price.strikeOriginalPrice ? (
                          <del className={styles.originalPrice}>{price.originalPrice}</del>
                        ) : (
                          <span className={styles.normalPrice}>{price.originalPrice}</span>
                        )
                      ) : null}
                      {price.salePrice ? (
                        <strong className={styles.salePrice}>{price.salePrice}</strong>
                      ) : null}
                    </div>
                    <Link className="link-arrow sm" href={href}>
                      {getLocalizedStaticText(lang, "viewTour")} →
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
