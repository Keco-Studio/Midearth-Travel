import Image from "next/image";
import Link from "next/link";
import { services } from "@/data/services";
import styles from "./about-section.module.css";

export function AboutSection() {
  return (
    <section id="about" className={styles.section}>
      <div className={styles.container}>
        <div id="services" className={styles.servicesBlock}>
          <div className={styles.servicesHead}>
            <div>
              <div className={styles.eyebrow}>— Beyond tours</div>
              <h2 className={styles.servicesTitle}>Travel Service</h2>
              <p className={styles.servicesSubtitle}>
                Everything else, handled.
              </p>
            </div>
            <p className={styles.servicesDeck}>
              Flights, hotels, charter coaches, travel insurance, visa paperwork.
              The unglamorous half of any trip — done by people who&apos;ve done it
              ten thousand times.
            </p>
          </div>
          <div className={styles.svcGrid}>
            {services.map((svc) => (
              <Link
                key={svc.id}
                className={styles.svcCard}
                href="/#contact"
              >
                <div className={styles.svcCardImg}>
                  <Image
                    src={svc.image}
                    alt=""
                    fill
                    sizes="(max-width: 768px) 100vw, 280px"
                    className={styles.svcCardImgEl}
                  />
                </div>
                <div className={styles.svcCardBody}>
                  <div className={styles.svcCardTitle}>{svc.title}</div>
                  <div className={styles.svcCardSum}>{svc.summary}</div>
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
