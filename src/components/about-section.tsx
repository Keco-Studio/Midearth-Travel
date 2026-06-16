import { Award, Globe, Headphones, Shield } from "lucide-react";
import styles from "./about-section.module.css";

const features = [
  {
    icon: Globe,
    title: "TICO Certified",
    description:
      "Member of the Travel Industry Council of Ontario, meeting the highest industry standards for reliability and service",
  },
  {
    icon: Shield,
    title: "Award Winning",
    description:
      "Named Ottawa's Best Travel Agency in the 2024 Ottawa Awards and Best Bus Tour Services in Ottawa",
  },
  {
    icon: Headphones,
    title: "Expert Guides",
    description:
      "Experienced, knowledgeable tour guides like Rico Yan providing exceptional service on every trip",
  },
  {
    icon: Award,
    title: "Competitive Prices",
    description:
      "Affordable vacation packages with best-deal air tickets, hotels, and comprehensive travel insurance",
  },
];

export function AboutSection() {
  return (
    <section id="about" className={styles.section}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.eyebrow}>— Why Midearth Travel</div>
          <h2 className={styles.title}>
            <span className={styles.titleLight}>Why Choose </span>
            Midearth Travel
          </h2>
          <p className={styles.deck}>
            Serving the Ottawa community with uncompromising professionalism,
            competitive prices, and an unwavering local focus
          </p>
        </div>

        <div className={styles.grid}>
          {features.map((feature) => (
            <div key={feature.title} className={styles.card}>
              <div className={styles.iconWrap}>
                <feature.icon className="h-8 w-8" />
              </div>
              <h3 className={styles.cardTitle}>{feature.title}</h3>
              <p className={styles.cardDesc}>{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
