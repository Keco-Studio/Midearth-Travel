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
    href: "/#services",
  },
  {
    title: "Bus Tours",
    descLines: ["Charter & Group", "Transportation"],
    icon: Bus,
    href: "/tours",
  },
  {
    title: "Worldwide Travel",
    descLines: ["Worldwide Cruise", "Packages"],
    icon: Globe,
    href: "/tours",
  },
  {
    title: "Other Services",
    descLines: ["Canada & International", "Tours"],
    icon: Ship,
    href: "/#services",
  },
];

export function Hero() {
  return (
    <section className={styles.hero}>
      <div className={styles.bg} aria-hidden>
        <Image
          src="/hero/hero-coast.jpg"
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
            <span className={styles.titleMain}>Midearth Travel</span>
          </h1>

          <p className={styles.subtitle}>Your One-Stop Travel Solution</p>

          <HeroBroadcast />
        </div>

        <div className={styles.cards}>
          {featureCards.map((card) => (
            <Link key={card.title} href={card.href} className={styles.card}>
              <div className={styles.cardIcon}>
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
