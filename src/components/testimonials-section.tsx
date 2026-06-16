"use client";

import { useEffect, useState } from "react";
import { testimonials } from "@/data/testimonials";
import styles from "./testimonials-section.module.css";

export function TestimonialsSection() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = window.setInterval(
      () => setActive((i) => (i + 1) % testimonials.length),
      6000,
    );
    return () => window.clearInterval(id);
  }, []);

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.head}>
          <div>
            <div className={styles.eyebrow}>— Reviews</div>
            <h2 className={styles.title}>
              From people we&apos;ve sent somewhere.
            </h2>
          </div>
          <div className={styles.ratingPill}>
            <span className={styles.ratingStars}>★★★★★</span>
            <span>
              <b>4.9</b> · 240+ Google reviews
            </span>
          </div>
        </div>
        <div className={styles.stage}>
          <div className={styles.viewport}>
            <div
              className={styles.track}
              style={{ transform: `translateX(-${active * 100}%)` }}
            >
              {testimonials.map((t) => (
                <figure key={t.id} className={styles.slide}>
                  <div className={styles.slideStars}>★★★★★</div>
                  <blockquote className={styles.slideQuote}>
                    &ldquo;{t.text}&rdquo;
                  </blockquote>
                  <figcaption className={styles.slideCaption}>
                    <span className={styles.name}>{t.name}</span>
                    <span className={styles.source}>{t.source}</span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
          <div className={styles.dots}>
            {testimonials.map((t, i) => (
              <button
                key={t.id}
                className={`${styles.dot}${i === active ? ` ${styles.dotActive}` : ""}`}
                onClick={() => setActive(i)}
                aria-label={`Review ${i + 1}`}
                type="button"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
