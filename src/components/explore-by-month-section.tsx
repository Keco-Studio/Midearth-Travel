"use client";

import { PopularByMonth } from "@/components/listing/popular-by-month";
import { useLang } from "@/context/lang-context";
import { getStringContent, type ContentData } from "@/lib/content-values";
import styles from "./explore-by-month-section.module.css";

export function ExploreByMonthSection({ content = {} }: { content?: ContentData }) {
  const { lang } = useLang();

  return (
    <section id="explore-by-month" className={styles.section}>
      <div className="browse-container">
        <PopularByMonth
          eyebrow={lang === "zh" ? "按月份浏览" : `— ${getStringContent(content, "eyebrowEn", "Explore by Month")}`}
          title={lang === "zh" ? "按月份浏览" : getStringContent(content, "titleEn", "When to Go")}
          subtitle={lang === "zh" ? "Explore by Month" : getStringContent(content, "subtitleEn", "Explore by Month")}
        />
      </div>
    </section>
  );
}
