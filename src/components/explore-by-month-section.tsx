"use client";

import { PopularByMonth } from "@/components/listing/popular-by-month";
import { useLang } from "@/context/lang-context";
import styles from "./explore-by-month-section.module.css";

export function ExploreByMonthSection() {
  const { lang } = useLang();

  return (
    <section id="explore-by-month" className={styles.section}>
      <div className="browse-container">
        <PopularByMonth
          eyebrow={lang === "zh" ? "按月份浏览" : "— Explore by Month"}
          title={lang === "zh" ? "按月份浏览" : "When to Go"}
          subtitle={lang === "zh" ? "Explore by Month" : "Explore by Month"}
        />
      </div>
    </section>
  );
}
