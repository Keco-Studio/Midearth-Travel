"use client";

import Image from "next/image";
import { type ReactNode, useEffect, useState } from "react";
import styles from "./tour-detail.module.css";

type Props = {
  images: string[];
  alt: string;
  children: ReactNode;
};

const AUTO_PLAY_MS = 5000;

export function TourDetailHeader({ images, alt, children }: Props) {
  const [index, setIndex] = useState(0);
  const gallery =
    images.length > 0 ? images : ["/maritime-provinces-gaspe-peggys-cove.jpg"];
  const hasMultiple = gallery.length > 1;

  function goPrev() {
    setIndex((current) => (current - 1 + gallery.length) % gallery.length);
  }

  function goNext() {
    setIndex((current) => (current + 1) % gallery.length);
  }

  useEffect(() => {
    if (!hasMultiple) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % gallery.length);
    }, AUTO_PLAY_MS);
    return () => window.clearInterval(timer);
  }, [gallery.length, hasMultiple]);

  return (
    <header className="relative h-[min(72vh,640px)] w-full overflow-hidden">
      <div className={styles.heroGalleryBg}>
        <Image
          key={gallery[index]}
          src={gallery[index]}
          alt={alt}
          fill
          priority
          sizes="100vw"
          className={styles.heroGalleryImage}
        />
      </div>

      <div
        className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-t from-black/85 via-black/45 to-black/25"
        aria-hidden
      />

      {hasMultiple && (
        <div className={styles.heroGalleryControls}>
          <button
            type="button"
            className={`${styles.galleryArrow} ${styles.galleryPrev}`}
            onClick={goPrev}
            aria-label="Previous photo"
          >
            ‹
          </button>
          <button
            type="button"
            className={`${styles.galleryArrow} ${styles.galleryNext}`}
            onClick={goNext}
            aria-label="Next photo"
          >
            ›
          </button>
          <div className={styles.galleryCounter}>
            {index + 1} / {gallery.length}
          </div>
        </div>
      )}

      <div className="pointer-events-none relative z-10 flex h-full flex-col justify-end px-6 pb-12 pt-28 md:px-8 lg:px-12">
        <div className="pointer-events-auto">{children}</div>
      </div>
    </header>
  );
}
