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
import styles from "./hero.module.css";

const featureCards = [
  {
    title: "Flight Booking",
    descLines: ["Best Airfares", "Worldwide"],
    icon: Plane,
    tone: "navy" as const,
    href: "/#contact",
  },
  {
    title: "Bus Services",
    descLines: ["Charter & Group", "Transportation"],
    icon: Bus,
    tone: "gold" as const,
    href: "/tours",
  },
  {
    title: "Tours",
    descLines: ["Canada & International", "Tours"],
    icon: Globe,
    tone: "navy" as const,
    href: "/tours",
  },
  {
    title: "Cruises",
    descLines: ["Worldwide Cruise", "Packages"],
    icon: Ship,
    tone: "gold" as const,
    href: "/routes/sun-destinations",
  },
];

export function Hero() {
  return (
    <section className={styles.hero}>
      <div className={styles.bg} aria-hidden>
        <Image
          src="/hero/hero-lighthouse.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className={styles.bgImage}
        />
      </div>
      <div className={styles.overlay} aria-hidden />

      <div className={styles.inner}>
        <div className={styles.headline}>
          <p className={styles.eyebrow}>Midearth Travel</p>

          <h1 className={styles.title}>
            <span className={styles.titleLead}>Your One-Stop</span>
            <span className={styles.titleBold}>Travel Solution</span>
          </h1>

          <HeroBroadcast />
        </div>

        <div className={styles.cards}>
          {featureCards.map((card) => (
            <Link key={card.title} href={card.href} className={styles.card}>
              <div
                className={`${styles.cardIcon} ${
                  card.tone === "navy"
                    ? styles.cardIconNavy
                    : styles.cardIconGold
                }`}
              >
                <card.icon size={26} aria-hidden />
              </div>
              <h2 className={styles.cardTitle}>{card.title}</h2>
              <p className={styles.cardDesc}>
                {card.descLines.map((line) => (
                  <span key={line} className={styles.cardDescLine}>
                    {line}
                  </span>
                ))}
              </p>
              <span className={styles.cardArrow} aria-hidden>
                →
              </span>
            </Link>
          ))}
        </div>

        <div className={styles.actions}>
          <Link href="#tours" className={styles.btnPrimary}>
            Explore Tours
            <ArrowRight size={18} />
          </Link>
          <Link href="#contact" className={styles.btnGold}>
            Request Quote
            <ArrowRight size={18} />
          </Link>
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
