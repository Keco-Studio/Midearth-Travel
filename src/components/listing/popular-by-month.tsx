"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { destinationsByMonth } from "@/data/destinations-by-month";
import styles from "./browse-sections.module.css";

type PopularByMonthProps = {
  eyebrow?: string;
  title?: ReactNode;
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
}: PopularByMonthProps) {
  const [active, setActive] = useState(destinationsByMonth[0].month);
  const panel = destinationsByMonth.find((m) => m.month === active)!;

  return (
    <div className={styles.browseBlock}>
      <div className={styles.secHead}>
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h2 className={styles.secTitle}>{title}</h2>
      </div>

      <div className={styles.monthTabs} role="tablist" aria-label="Month">
        {destinationsByMonth.map((item) => (
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
              key={dest.name}
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
                <div className={styles.destCardDesc}>{dest.desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
