"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import {
  destinationsByMonth,
  type MonthEntry,
} from "@/data/destinations-by-month";
import type { Tour } from "@/data/tours";
import { useSiteSettings } from "@/context/site-settings-context";
import { useLang } from "@/context/lang-context";
import { getConfiguredContactHref } from "@/lib/tour-content-audit";
import { resolveExploreByMonthEntries } from "@/lib/explore-by-month";
import styles from "./browse-sections.module.css";

type PopularByMonthProps = {
  eyebrow?: string;
  title?: ReactNode;
  subtitle?: ReactNode;
  months?: MonthEntry[];
  tours?: readonly Tour[];
  requireTourMatch?: boolean;
};

export function PopularByMonth({
  eyebrow = "When to Go",
  title = (
    <>
      Popular Destinations
      <br />
      by Month
    </>
  ),
  subtitle,
  months = destinationsByMonth,
  tours = [],
  requireTourMatch = false,
}: PopularByMonthProps) {
  const settings = useSiteSettings();
  const { lang } = useLang();
  const entries = months.length > 0 ? months : destinationsByMonth;
  const resolvedSource = resolveExploreByMonthEntries(
    entries,
    tours,
    getConfiguredContactHref(settings.emailHref, settings.primaryPhoneHref),
    { requireTourMatch },
  );
  const source = requireTourMatch
    ? resolvedSource.filter((month) => month.destinations.length > 0)
    : resolvedSource;
  const [active, setActive] = useState(source[0]?.month ?? "");
  useEffect(() => {
    if (!source.some((month) => month.month === active)) {
      setActive(source[0]?.month ?? "");
    }
  }, [active, source]);
  const activeMonth = source.find((m) => m.month === active) ?? source[0];
  const panel = activeMonth ?? { month: "", label: "", destinations: [] };

  return (
    <div className={styles.browseBlock}>
      <div className={styles.secHead}>
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h2 className={styles.secTitle}>{title}</h2>
        {subtitle && <p className={styles.secSubtitle}>{subtitle}</p>}
      </div>

      <div className={styles.monthTabs} role="tablist" aria-label="Month">
        {source.map((item) => (
          <button
            key={item.month}
            type="button"
            role="tab"
            aria-selected={active === item.month}
            className={`${styles.monthTab} ${active === item.month ? styles.monthTabActive : ""}`}
            onClick={() => setActive(item.month)}
          >
            {item.month}
          </button>
        ))}
      </div>

      <div role="tabpanel" aria-label={panel.label}>
        <div className={styles.destGrid}>
          {panel.destinations.map((dest) => (
            <Link
              key={`${panel.month}-${dest.id ?? dest.tourSlug ?? dest.name}`}
              href={dest.href ?? "/#contact"}
              className={styles.destCard}
            >
              <div className={styles.destCardImg}>
                <Image
                  src={dest.image}
                  alt={dest.name}
                  fill
                  unoptimized
                  sizes="(max-width: 768px) 100vw, 320px"
                  className={styles.destCardImgEl}
                />
              </div>
              <div className={styles.destCardBody}>
                <div className={styles.destCardTag}>
                  {dest.tag} · {dest.region}
                </div>
                <div className={styles.destCardName}>{dest.name}</div>
                <div className={styles.destCardDesc}>
                  {lang === "zh" && dest.localizedDesc?.trim()
                    ? dest.localizedDesc
                    : dest.desc}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
