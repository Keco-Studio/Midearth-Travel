"use client";

import { PopularByMonth } from "@/components/listing/popular-by-month";
import { useLang } from "@/context/lang-context";
import {
  getBooleanContent,
  type ContentData,
} from "@/lib/content-values";
import { getLocalizedContent } from "@/lib/localized-content";
import {
  getConfiguredContactHref,
} from "@/lib/tour-content-audit";
import {
  getExploreByMonthEntries,
  resolveExploreByMonthEntries,
} from "@/lib/explore-by-month";
import type { Tour } from "@/data/tours";
import { useSiteSettings } from "@/context/site-settings-context";
import styles from "./explore-by-month-section.module.css";

export function ExploreByMonthSection({
  content = {},
  tours = [],
}: {
  content?: ContentData;
  tours?: Tour[];
}) {
  const { lang } = useLang();
  const settings = useSiteSettings();

  if (getBooleanContent(content, "isVisible", true) === false) {
    return null;
  }

  const months = resolveExploreByMonthEntries(
    getExploreByMonthEntries(content),
    tours,
    getConfiguredContactHref(settings.emailHref, settings.primaryPhoneHref),
  );

  const eyebrow = `— ${getLocalizedContent(content, "eyebrow", lang, "Explore by Month")}`;
  const title = getLocalizedContent(content, "title", lang, "When to Go");
  const subtitle = getLocalizedContent(content, "subtitle", lang, "Explore by Month");

  return (
    <section id="explore-by-month" className={styles.section}>
      <div className="browse-container">
        <PopularByMonth
          eyebrow={eyebrow}
          title={title}
          subtitle={subtitle}
          months={months}
          tours={tours}
        />
      </div>
    </section>
  );
}
