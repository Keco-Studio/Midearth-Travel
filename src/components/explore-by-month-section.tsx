"use client";

import { PopularByMonth } from "@/components/listing/popular-by-month";
import { useLang } from "@/context/lang-context";
import {
  getBooleanContent,
  getStringContent,
  type ContentData,
} from "@/lib/content-values";
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

  if (getBooleanContent(content, "isVisible", true) === false) {
    return null;
  }

  const months = resolveExploreByMonthEntries(
    getExploreByMonthEntries(content),
    tours,
  );

  const eyebrow =
    lang === "zh"
      ? getStringContent(content, "eyebrowZh", "按月份浏览")
      : `— ${getStringContent(content, "eyebrowEn", "Explore by Month")}`;
  const title =
    lang === "zh"
      ? getStringContent(content, "titleZh", "按月份浏览")
      : getStringContent(content, "titleEn", "When to Go");
  const subtitle =
    lang === "zh"
      ? getStringContent(content, "subtitleZh", "Explore by Month")
      : getStringContent(content, "subtitleEn", "Explore by Month");

  return (
    <section id="explore-by-month" className={styles.section}>
      <div className="browse-container">
        <PopularByMonth
          eyebrow={eyebrow}
          title={title}
          subtitle={subtitle}
          months={months}
        />
      </div>
    </section>
  );
}
