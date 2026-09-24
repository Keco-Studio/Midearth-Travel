"use client";

import Image from "next/image";
import Link from "next/link";
import { useLang } from "@/context/lang-context";
import { services as staticServices, type Service } from "@/data/services";
import { type ContentData } from "@/lib/content-values";
import { getLocalizedContent } from "@/lib/localized-content";
import styles from "./about-section.module.css";

export function AboutSection({
  content = {},
  services = staticServices,
}: {
  content?: ContentData;
  services?: Service[];
}) {
  const { lang } = useLang();
  const eyebrow = getLocalizedContent(content, "eyebrow", lang, "Beyond tours");
  const sectionTitle = getLocalizedContent(content, "sectionTitle", lang, "Travel Service");
  const subtitle = getLocalizedContent(content, "subtitle", lang, "Everything else, handled.");
  const deck = getLocalizedContent(
    content,
    "deck",
    lang,
    "Flights, hotels, charter coaches, travel insurance, visa paperwork. The unglamorous half of any trip — done by people who've done it ten thousand times.",
  );

  return (
    <section id="about" className={styles.section}>
      <div className={styles.container}>
        <div id="services" className={styles.servicesBlock}>
          <div className={styles.servicesHead}>
            <div>
              <div className={styles.eyebrow}>— {eyebrow}</div>
              <h2 className={styles.servicesTitle}>{sectionTitle}</h2>
              <p className={styles.servicesSubtitle}>
                {subtitle}
              </p>
            </div>
            <p className={styles.servicesDeck}>
              {deck}
            </p>
          </div>
          <div className={styles.svcGrid}>
            {services.map((svc) => (
              <Link
                key={svc.id}
                className={styles.svcCard}
                href={`/services/${svc.slug}`}
              >
                <div className={styles.svcCardImg}>
                  <Image
                    src={svc.image}
                    alt=""
                    fill
                    unoptimized
                    sizes="(max-width: 768px) 100vw, 280px"
                    className={styles.svcCardImgEl}
                  />
                </div>
                <div className={styles.svcCardBody}>
                  <div className={styles.svcCardTitle}>{lang === "zh" && svc.titleZh?.trim() ? svc.titleZh : svc.title}</div>
                  <div className={styles.svcCardSum}>{lang === "zh" && svc.summaryZh?.trim() ? svc.summaryZh : svc.summary}</div>
                  <div className={styles.svcCardArrow}>→</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
