"use client";

import { useEffect, useState } from "react";
import { testimonials as staticTestimonials, type Testimonial } from "@/data/testimonials";
import { getStringContent, type ContentData } from "@/lib/content-values";
import styles from "./testimonials-section.module.css";

export function TestimonialsSection({
  content = {},
  testimonials = staticTestimonials,
}: {
  content?: ContentData;
  testimonials?: Testimonial[];
}) {
  const [active, setActive] = useState(0);
  const eyebrow = getStringContent(content, "eyebrow", "Reviews");
  const sectionTitle = getStringContent(
    content,
    "sectionTitle",
    "From people we've sent somewhere.",
  );
  const ratingSummary = getStringContent(content, "ratingSummary", "4.9 · 240+ Google reviews");

  useEffect(() => {
    const id = window.setInterval(
      () => setActive((i) => (i + 1) % testimonials.length),
      6000,
    );
    return () => window.clearInterval(id);
  }, [testimonials.length]);

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.head}>
          <div>
            <div className={styles.eyebrow}>— {eyebrow}</div>
            <h2 className={styles.title}>
              {sectionTitle}
            </h2>
          </div>
          <div className={styles.ratingPill}>
            <span className={styles.ratingStars}>★★★★★</span>
            <span>{ratingSummary}</span>
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
                  <div className={styles.slideStars}>{"★".repeat(t.rating)}</div>
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
