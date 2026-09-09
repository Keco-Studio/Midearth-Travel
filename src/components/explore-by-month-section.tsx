"use client";

import { PopularByMonth } from "@/components/listing/popular-by-month";
import { useLang } from "@/context/lang-context";
import { getStringContent, type ContentData } from "@/lib/content-values";
import {
  getExploreByMonthEntries,
  resolveExploreByMonthEntries,
} from "@/lib/explore-by-month";
import type { Tour } from "@/data/tours";
import styles from "./explore-by-month-section.module.css";

export function ExploreByMonthSection({
  content = {},
  tours = [],
}: {
  content?: ContentData;
  tours?: Tour[];
}) {
  const { lang } = useLang();
  const months = resolveExploreByMonthEntries(
    getExploreByMonthEntries(content),
    tours,
  );

  return (
    <section id="explore-by-month" className={styles.section}>
      <div className="browse-container">
        <PopularByMonth
          eyebrow={lang === "zh" ? "按月份浏览" : `— ${getStringContent(content, "eyebrowEn", "Explore by Month")}`}
          title={lang === "zh" ? "按月份浏览" : getStringContent(content, "titleEn", "When to Go")}
          subtitle={lang === "zh" ? "Explore by Month" : getStringContent(content, "subtitleEn", "Explore by Month")}
          months={months}
        />
      </div>
    </section>
  );
}
