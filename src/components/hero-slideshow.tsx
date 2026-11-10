"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import {
  getAdjacentSlideIndex,
  HERO_AUTOPLAY_INTERVAL_MS,
  shouldAutoRotate,
  type HeroSlideDirection,
  type PublicHeroSlide,
} from "@/lib/hero-carousel";
import styles from "./hero.module.css";

const HERO_CROSSFADE_MS = 700;

type HeroSlideshowProps = {
  slides: PublicHeroSlide[];
  hovered: boolean;
  focused: boolean;
};

const focalPointClasses = {
  left: styles.focalLeft,
  center: styles.focalCenter,
  right: styles.focalRight,
};

export function HeroSlideshow({ slides, hovered, focused }: HeroSlideshowProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [previousSlide, setPreviousSlide] = useState<PublicHeroSlide | null>(null);
  const [timerGeneration, setTimerGeneration] = useState(0);
  const reducedMotion = useSyncExternalStore(
    subscribeToReducedMotion,
    getReducedMotionSnapshot,
    getServerReducedMotionSnapshot,
  );
  const hidden = useSyncExternalStore(
    subscribeToDocumentVisibility,
    getDocumentVisibilitySnapshot,
    getServerDocumentVisibilitySnapshot,
  );
  const safeActiveIndex = activeIndex < slides.length ? activeIndex : 0;
  const activeSlide = slides[safeActiveIndex];

  useEffect(() => {
    if (
      !shouldAutoRotate({
        count: slides.length,
        hovered,
        focused,
        hidden,
        reducedMotion,
      })
    ) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setPreviousSlide(slides[safeActiveIndex] ?? null);
      setActiveIndex(
        getAdjacentSlideIndex(safeActiveIndex, slides.length, "next"),
      );
    }, HERO_AUTOPLAY_INTERVAL_MS);

    return () => window.clearTimeout(timeout);
  }, [
    focused,
    hidden,
    hovered,
    reducedMotion,
    safeActiveIndex,
    slides,
    timerGeneration,
  ]);

  useEffect(() => {
    if (!previousSlide) return;

    const timeout = window.setTimeout(
      () => setPreviousSlide(null),
      HERO_CROSSFADE_MS,
    );
    return () => window.clearTimeout(timeout);
  }, [previousSlide]);

  useEffect(() => {
    if (slides.length <= 1) return;

    const nextIndex = getAdjacentSlideIndex(safeActiveIndex, slides.length, "next");
    const nextImage = new window.Image();
    nextImage.src = slides[nextIndex]?.image ?? "";
  }, [safeActiveIndex, slides]);

  if (!activeSlide) return null;

  function navigate({
    direction,
    manual,
  }: {
    direction: HeroSlideDirection;
    manual: boolean;
  }) {
    setPreviousSlide(activeSlide);
    setActiveIndex(
      getAdjacentSlideIndex(safeActiveIndex, slides.length, direction),
    );
    if (manual) {
      setTimerGeneration((generation) => generation + 1);
    }
  }

  return (
    <div className={styles.slideshow}>
      {previousSlide && previousSlide.id !== activeSlide.id ? (
        <SlideImage className={styles.slidePrevious} slide={previousSlide} />
      ) : null}
      <SlideImage
        className={previousSlide ? styles.slideEntering : styles.slideActive}
        priority={safeActiveIndex === 0}
        slide={activeSlide}
      />

      {activeSlide.href ? (
        <Link
          aria-label={`View ${activeSlide.tourTitle}`}
          className={styles.slideLink}
          href={activeSlide.href}
        />
      ) : null}

      {slides.length > 1 ? (
        <div className={styles.carouselControls}>
          <button
            aria-label="Previous Hero slide"
            className={styles.carouselButton}
            onClick={() => navigate({ direction: "previous", manual: true })}
            title="Previous slide"
            type="button"
          >
            <ChevronLeft aria-hidden size={22} />
          </button>
          <button
            aria-label="Next Hero slide"
            className={styles.carouselButton}
            onClick={() => navigate({ direction: "next", manual: true })}
            title="Next slide"
            type="button"
          >
            <ChevronRight aria-hidden size={22} />
          </button>
        </div>
      ) : null}
    </div>
  );
}

function SlideImage({
  slide,
  className,
  priority = false,
}: {
  slide: PublicHeroSlide;
  className: string;
  priority?: boolean;
}) {
  return (
    <div className={`${styles.slideFrame} ${className}`} aria-hidden>
      <Image
        alt=""
        className={`${styles.slideImage} ${focalPointClasses[slide.focalPoint]}`}
        fill
        priority={priority}
        sizes="100vw"
        src={slide.image}
        unoptimized
      />
    </div>
  );
}

function subscribeToReducedMotion(onStoreChange: () => void): () => void {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", onStoreChange);
  return () => query.removeEventListener("change", onStoreChange);
}

function getReducedMotionSnapshot(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getServerReducedMotionSnapshot(): boolean {
  return false;
}

function subscribeToDocumentVisibility(onStoreChange: () => void): () => void {
  document.addEventListener("visibilitychange", onStoreChange);
  return () => document.removeEventListener("visibilitychange", onStoreChange);
}

function getDocumentVisibilitySnapshot(): boolean {
  return document.hidden;
}

function getServerDocumentVisibilitySnapshot(): boolean {
  return false;
}
