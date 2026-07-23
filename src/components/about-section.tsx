import Image from "next/image";
import Link from "next/link";
import { services as staticServices, type Service } from "@/data/services";
import { getStringContent, type ContentData } from "@/lib/content-values";
import styles from "./about-section.module.css";

export function AboutSection({
  content = {},
  services = staticServices,
}: {
  content?: ContentData;
  services?: Service[];
}) {
  const eyebrow = getStringContent(content, "eyebrow", "Beyond tours");
  const sectionTitle = getStringContent(content, "sectionTitle", "Travel Service");
  const subtitle = getStringContent(content, "subtitle", "Everything else, handled.");
  const deck = getStringContent(
    content,
    "deck",
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
                href={`/?service=${encodeURIComponent(svc.slug)}#contact`}
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
