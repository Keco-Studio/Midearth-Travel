"use client";

import {
  ArrowRight,
  Bus,
  Globe,
  Plane,
  Ship,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { HeroBroadcast } from "@/components/hero-broadcast";
import { getStringContent, type ContentData } from "@/lib/content-values";
import { useLang } from "@/context/lang-context";
import { getLocalizedContent } from "@/lib/localized-content";
import {
  getHeroBroadcastContent,
  getHeroFeatureCards,
} from "@/lib/hero-content";
import styles from "./hero.module.css";

const cardIcons = { Plane, Bus, Globe, Ship };

export function Hero({ content = {} }: { content?: ContentData }) {
  const { lang } = useLang();
  const backgroundImage = getStringContent(content, "backgroundImage", "/hero/hero-coast.jpg");
  const titleMain = getLocalizedContent(content, "titleMain", lang, "Midearth Travel");
  const subtitle = getLocalizedContent(content, "subtitle", lang, "Your One-Stop Travel Solution");
  const primaryButtonText = getLocalizedContent(content, "primaryButtonText", lang, "Explore Tours");
  const primaryButtonLink = "#tours";
  const secondaryButtonText = getLocalizedContent(content, "secondaryButtonText", lang, "Request Quote");
  const secondaryButtonLink = "#contact";
  const broadcast = getHeroBroadcastContent(content, lang);
  const featureCards = getHeroFeatureCards(content, lang);
  const stats = [
    {
      value: getLocalizedContent(content, "stat1Value", lang, "20+"),
      label: getLocalizedContent(content, "stat1Label", lang, "Years Experience"),
    },
    {
      value: getLocalizedContent(content, "stat2Value", lang, "TICO"),
      label: getLocalizedContent(content, "stat2Label", lang, "Certified Member"),
    },
    {
      value: getLocalizedContent(content, "stat3Value", lang, "5.0"),
      label: getLocalizedContent(content, "stat3Label", lang, "Google Rating"),
    },
  ];

  return (
    <section className={styles.hero}>
      <div className={styles.bg} aria-hidden>
        <Image
          src={backgroundImage}
          alt=""
          fill
          priority
          unoptimized
          sizes="100vw"
          className={styles.bgImage}
        />
      </div>
      <div className={styles.overlay} aria-hidden />

      <div className={styles.inner}>
        <div className={styles.headline}>
          <h1 className={styles.title}>
            <span className={styles.titleMain}>{titleMain}</span>
          </h1>

          <p className={styles.subtitle}>{subtitle}</p>

          <HeroBroadcast label={broadcast.label} messages={broadcast.messages} />
        </div>

        <div className={styles.cards}>
          {featureCards.map((card) => {
            const CardIcon = cardIcons[card.fallbackIcon];

            return (
              <Link key={card.id} href={card.href} className={styles.card}>
                <div className={styles.cardIcon}>
                  {card.iconImage ? (
                    <Image
                      alt=""
                      className={styles.cardIconImage}
                      height={32}
                      src={card.iconImage}
                      unoptimized
                      width={32}
                    />
                  ) : (
                    <CardIcon size={26} aria-hidden />
                  )}
                </div>
                <h2 className={styles.cardTitle}>{card.title}</h2>
                <p className={styles.cardDesc}>{card.description}</p>
                <span className={styles.cardArrow} aria-hidden>
                  →
                </span>
              </Link>
            );
          })}
        </div>

        <div className={styles.actions}>
          <Link href={primaryButtonLink} className={styles.btnPrimary}>
            {primaryButtonText}
            <ArrowRight size={18} />
          </Link>
          {secondaryButtonText ? (
            <Link href={secondaryButtonLink} className={styles.btnGold}>
              {secondaryButtonText}
              <ArrowRight size={18} />
            </Link>
          ) : null}
        </div>

        <div className={styles.stats}>
          {stats.map((stat) => (
            <div key={stat.label} className={styles.stat}>
              <div className={styles.statValue}>{stat.value}</div>
              <div className={styles.statLabel}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
