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
import {
  getHeroBroadcastContent,
  getHeroFeatureCards,
} from "@/lib/hero-content";
import styles from "./hero.module.css";

const cardIcons = { Plane, Bus, Globe, Ship };

export function Hero({ content = {} }: { content?: ContentData }) {
  const backgroundImage = getStringContent(content, "backgroundImage", "/hero/hero-coast.jpg");
  const titleMain = getStringContent(content, "titleMain", "Midearth Travel");
  const subtitle = getStringContent(content, "subtitle", "Your One-Stop Travel Solution");
  const primaryButtonText = getStringContent(content, "primaryButtonText", "Explore Tours");
  const primaryButtonLink = getStringContent(content, "primaryButtonLink", "#tours");
  const secondaryButtonText = getStringContent(content, "secondaryButtonText", "Request Quote");
  const secondaryButtonLink = getStringContent(content, "secondaryButtonLink", "#contact");
  const broadcast = getHeroBroadcastContent(content);
  const featureCards = getHeroFeatureCards(content);

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
          {[
            { value: "20+", label: "Years Experience" },
            { value: "TICO", label: "Certified Member" },
            { value: "5.0", label: "Google Rating" },
          ].map((stat) => (
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
