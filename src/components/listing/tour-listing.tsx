"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Navbar } from "@/components/navbar";
import { parseDurationDays } from "@/data/tour-filters";
import type { Tour } from "@/data/tours";
import type { BusToursContent } from "@/lib/bus-tours-content";
import {
  destinationCategorySeeds,
  type DestinationCategory,
} from "@/lib/destination-categories";
import { getTourRegionBadge } from "@/lib/tour-destination-categories";
import { useLang } from "@/context/lang-context";
import { getLocalizedStaticText, getLocalizedTourValue } from "@/lib/localized-content";
import styles from "./listing.module.css";
import { DestinationsByRegion } from "./destinations-by-region";
import { PopularByMonth } from "./popular-by-month";
import { SubHero } from "./sub-hero";
import { TourListingCard } from "./tour-listing-card";

type Props = {
  eyebrow: string;
  eyebrowTextKey?: "category" | "regionHeader";
  title: string;
  localizedTitle?: string;
  titleTextKey?: "allTours";
  summary: string;
  localizedSummary?: string;
  image: string;
  initialTours: Tour[];
  publishedTours?: Tour[];
  browseMonths?: import("@/data/destinations-by-month").MonthEntry[];
  browseContent?: BusToursContent;
  showBrowseSections?: boolean;
  destinationCategories?: DestinationCategory[];
};

export function TourListing({
  eyebrow,
  eyebrowTextKey,
  title,
  localizedTitle,
  titleTextKey,
  summary,
  localizedSummary,
  image,
  initialTours,
  publishedTours = initialTours,
  browseMonths,
  browseContent,
  showBrowseSections = false,
  destinationCategories = destinationCategorySeeds,
}: Props) {
  const { lang } = useLang();
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState("all");
  const [duration, setDuration] = useState("all");
  const [sort, setSort] = useState("featured");
  const headerEyebrow = eyebrowTextKey
    ? getLocalizedStaticText(lang, eyebrowTextKey)
    : eyebrow;
  const headerTitle = titleTextKey
    ? getLocalizedStaticText(lang, titleTextKey)
    : getLocalizedTourValue(lang, localizedTitle, title);
  const headerSummary = getLocalizedTourValue(lang, localizedSummary, summary);
  const browseTours = showBrowseSections ? initialTours : publishedTours;

  const regions = useMemo(() => {
    const labels = new Set(
      initialTours.map((tour) => getTourRegionBadge(tour, destinationCategories, lang)),
    );
    return ["all", ...[...labels].sort((a, b) => a.localeCompare(b))];
  }, [destinationCategories, initialTours, lang]);

  useEffect(() => {
    if (region !== "all" && !regions.includes(region)) {
      setRegion("all");
    }
  }, [region, regions]);

  const filtered = useMemo(() => {
    let list = [...initialTours];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((t) =>
        `${getLocalizedTourValue(lang, t.localizedTitle, t.title)} ${t.tags.join(" ")} ${getTourRegionBadge(t, destinationCategories, lang)} ${getLocalizedTourValue(lang, t.localizedDescription, t.description)}`
          .toLowerCase()
          .includes(q),
      );
    }
    if (region !== "all") {
      list = list.filter(
        (t) => getTourRegionBadge(t, destinationCategories, lang) === region,
      );
    }
    if (duration !== "all") {
      list = list.filter((t) => {
        const days = parseDurationDays(t.duration);
        if (duration === "short") return days <= 3;
        if (duration === "med") return days > 3 && days <= 7;
        if (duration === "long") return days > 7;
        return true;
      });
    }
    if (sort === "duration") {
      list.sort(
        (a, b) =>
          parseDurationDays(a.duration) - parseDurationDays(b.duration),
      );
    }
    return list;
  }, [destinationCategories, initialTours, lang, search, region, duration, sort]);

  const browseFilteredTours = useMemo(() => {
    if (region === "all") return browseTours;
    return browseTours.filter(
      (tour) => getTourRegionBadge(tour, destinationCategories, lang) === region,
    );
  }, [browseTours, destinationCategories, lang, region]);

  return (
    <main className={styles.page}>
      <Navbar />
      <SubHero eyebrow={headerEyebrow} title={headerTitle} sub={headerSummary} img={image} />
      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.filterBar}>
            <div className={styles.filterSearch}>
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                aria-hidden
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3-3" />
              </svg>
              <input
                type="text"
                placeholder={getLocalizedStaticText(lang, "searchTours")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className={styles.filterGroup}>
              <label htmlFor="region-filter">{getLocalizedStaticText(lang, "region")}</label>
              <select
                id="region-filter"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
              >
                {regions.map((r) => (
                  <option key={r} value={r}>
                    {r === "all" ? getLocalizedStaticText(lang, "allRegions") : r}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.filterGroup}>
              <label htmlFor="duration-filter">{getLocalizedStaticText(lang, "duration")}</label>
              <select
                id="duration-filter"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              >
                <option value="all">{getLocalizedStaticText(lang, "anyLength")}</option>
                <option value="short">{getLocalizedStaticText(lang, "shortDuration")}</option>
                <option value="med">{getLocalizedStaticText(lang, "mediumDuration")}</option>
                <option value="long">{getLocalizedStaticText(lang, "longDuration")}</option>
              </select>
            </div>
            <div className={styles.filterGroup}>
              <label htmlFor="sort-filter">{getLocalizedStaticText(lang, "sort")}</label>
              <select
                id="sort-filter"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                <option value="featured">{getLocalizedStaticText(lang, "featured")}</option>
                <option value="duration">{getLocalizedStaticText(lang, "shortest")}</option>
              </select>
            </div>
          </div>

          {showBrowseSections ? (
            <PopularByMonth
              eyebrow={lang === "zh" ? browseContent?.monthEyebrowZh : browseContent?.monthEyebrowEn}
              title={lang === "zh" ? browseContent?.monthTitleZh : browseContent?.monthTitleEn}
              tours={browseFilteredTours}
              months={browseMonths}
              requireTourMatch
            />
          ) : (
            <>
              <div className={styles.filterCount}>
                {getLocalizedStaticText(lang, "tripCount", { count: filtered.length })}
              </div>

              {filtered.length === 0 ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyStateIcon}>⌖</div>
                  <h3>{getLocalizedStaticText(lang, "noMatches")}</h3>
                  <p>
                    {getLocalizedStaticText(lang, "noMatchesDescription")}
                  </p>
                  <Link className={styles.emptyBtn} href="/#contact">
                    {getLocalizedStaticText(lang, "requestCustomTrip")}
                  </Link>
                </div>
              ) : (
                <div className={styles.tourGrid}>
                  {filtered.map((tour) => (
                    <TourListingCard
                      key={tour.slug}
                      tour={tour}
                      destinationCategories={destinationCategories}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
        {showBrowseSections && (
          <div className={styles.regionSection}>
            <div className={styles.container}>
              <DestinationsByRegion
                tours={browseFilteredTours}
                onlyLiveTours
                eyebrow={lang === "zh" ? browseContent?.regionEyebrowZh : browseContent?.regionEyebrowEn}
                title={lang === "zh" ? browseContent?.regionTitleZh : browseContent?.regionTitleEn}
                destinationCategories={destinationCategories}
              />
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
