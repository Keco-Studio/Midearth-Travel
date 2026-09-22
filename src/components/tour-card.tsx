"use client";

import Image from "next/image";
import Link from "next/link";
import { useLang } from "@/context/lang-context";
import {
  getTourCategoryLabel,
  getTourDisplayPrice,
  type Tour,
} from "@/data/tours";
import {
  destinationCategorySeeds,
  type DestinationCategory,
} from "@/lib/destination-categories";
import { getTourRegionBadge } from "@/lib/tour-destination-categories";
import { getLocalizedStaticText, getLocalizedTourList, getLocalizedTourValue } from "@/lib/localized-content";

export function TourCard({
  tour,
  destinationCategories = destinationCategorySeeds,
}: {
  tour: Tour;
  destinationCategories?: DestinationCategory[];
}) {
  const { lang } = useLang();
  const price = getTourDisplayPrice(tour);
  const priceFrom = price.startsWith("from ");
  const regionBadge = getTourRegionBadge(tour, destinationCategories);
  const title = getLocalizedTourValue(lang, tour.localizedTitle, tour.title);
  const duration = getLocalizedTourValue(lang, tour.localizedDuration, tour.duration);
  const highlights = getLocalizedTourList(
    lang,
    tour.localizedHighlights,
    tour.highlights ?? tour.tags,
  );

  return (
    <article className="tour-card">
      <Link className="tour-card-img-btn" href={`/tours/${tour.slug}`}>
        <Image
          src={tour.image}
          alt={title}
          fill
          unoptimized
          sizes="(max-width: 768px) 100vw, 400px"
          className="object-cover"
        />
        {tour.code ? <div className="tour-card-code">{tour.code}</div> : null}
        <div className="tour-card-region">{regionBadge}</div>
      </Link>
      <div className="tour-card-body">
        <div className="tour-card-meta">
          <span>{getTourCategoryLabel(tour)}</span>
          <span className="dot">·</span>
          <span>{duration}</span>
        </div>
        <h3 className="tour-card-title">
          <Link href={`/tours/${tour.slug}`}>{title}</Link>
        </h3>
        <div className="tour-card-highlights">
          {highlights.slice(0, 4).map((h) => (
            <span key={h} className="chip">
              {h}
            </span>
          ))}
        </div>
        <div className="tour-card-foot">
          <div className="tour-card-price">
            {priceFrom ? (
              <>
                <span className="price-label">{getLocalizedStaticText(lang, "from")}</span>
                <span className="price-amt">{price.replace("from ", "")}</span>
              </>
            ) : (
              <span className="price-contact">{price}</span>
            )}
          </div>
          <Link className="link-arrow sm" href={`/tours/${tour.slug}`}>
            {getLocalizedStaticText(lang, "viewTour")} →
          </Link>
        </div>
      </div>
    </article>
  );
}
