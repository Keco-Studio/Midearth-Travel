"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import {
  getTourRegions,
  parseDurationDays,
} from "@/data/tour-filters";
import type { Tour } from "@/data/tours";
import styles from "./listing.module.css";
import { DestinationsByRegion } from "./destinations-by-region";
import { PopularByMonth } from "./popular-by-month";
import { SubHero } from "./sub-hero";
import { TourListingCard } from "./tour-listing-card";

type Props = {
  eyebrow: string;
  title: string;
  summary: string;
  image: string;
  initialTours: Tour[];
  showBrowseSections?: boolean;
};

export function TourListing({
  eyebrow,
  title,
  summary,
  image,
  initialTours,
  showBrowseSections = false,
}: Props) {
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState("all");
  const [duration, setDuration] = useState("all");
  const [sort, setSort] = useState("featured");

  const regions = ["all", ...getTourRegions(initialTours)];

  const filtered = useMemo(() => {
    let list = [...initialTours];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((t) =>
        `${t.title} ${t.tags.join(" ")} ${t.region} ${t.description}`
          .toLowerCase()
          .includes(q),
      );
    }
    if (region !== "all") list = list.filter((t) => t.region === region);
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
  }, [initialTours, search, region, duration, sort]);

  return (
    <main className={styles.page}>
      <Navbar />
      <SubHero eyebrow={eyebrow} title={title} sub={summary} img={image} />
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
                placeholder="Search tours, destinations, highlights"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className={styles.filterGroup}>
              <label htmlFor="region-filter">Region</label>
              <select
                id="region-filter"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
              >
                {regions.map((r) => (
                  <option key={r} value={r}>
                    {r === "all" ? "All regions" : r}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.filterGroup}>
              <label htmlFor="duration-filter">Duration</label>
              <select
                id="duration-filter"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              >
                <option value="all">Any length</option>
                <option value="short">≤ 3 days</option>
                <option value="med">4–7 days</option>
                <option value="long">8+ days</option>
              </select>
            </div>
            <div className={styles.filterGroup}>
              <label htmlFor="sort-filter">Sort</label>
              <select
                id="sort-filter"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                <option value="featured">Featured</option>
                <option value="duration">Shortest</option>
              </select>
            </div>
          </div>

          {showBrowseSections ? (
            <PopularByMonth />
          ) : (
            <>
              <div className={styles.filterCount}>
                {filtered.length} {filtered.length === 1 ? "trip" : "trips"}
              </div>

              {filtered.length === 0 ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyStateIcon}>⌖</div>
                  <h3>Nothing matched.</h3>
                  <p>
                    Try a wider region, or send us a note — we plan custom trips
                    constantly.
                  </p>
                  <Link className={styles.emptyBtn} href="/#contact">
                    Request a custom trip
                  </Link>
                </div>
              ) : (
                <div className={styles.tourGrid}>
                  {filtered.map((tour) => (
                    <TourListingCard key={tour.slug} tour={tour} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
        {showBrowseSections && (
          <div className={styles.regionSection}>
            <div className={styles.container}>
              <DestinationsByRegion />
            </div>
          </div>
        )}
      </section>
      <Footer />
    </main>
  );
}
