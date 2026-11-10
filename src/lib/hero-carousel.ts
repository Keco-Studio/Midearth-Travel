import type { Lang } from "../context/lang-context.tsx";
import type { Tour } from "../data/tours.ts";
import type { ContentData } from "./content-values.ts";
import {
  getEnabledHeroSlides,
  type HeroSlide,
} from "./hero-slides.ts";

export const HERO_AUTOPLAY_INTERVAL_MS = 6000;

export type HeroSlideDirection = "previous" | "next";

export type PublicHeroSlide = HeroSlide & {
  href: string | null;
  tourTitle: string;
};

export type HeroCarouselPauseState = {
  count: number;
  hovered: boolean;
  focused: boolean;
  hidden: boolean;
  reducedMotion: boolean;
};

export function resolvePublicHeroSlides(
  content: ContentData,
  tours: readonly Tour[],
  lang: Lang,
): PublicHeroSlide[] {
  const toursBySlug = new Map(tours.map((tour) => [tour.slug, tour]));

  return getEnabledHeroSlides(content).map((slide) => {
    const tour = slide.tourSlug ? toursBySlug.get(slide.tourSlug) : undefined;

    return {
      ...slide,
      href: tour ? `/tours/${encodeURIComponent(tour.slug)}` : null,
      tourTitle:
        tour && lang === "zh"
          ? tour.localizedTitle?.trim() || tour.title
          : tour?.title ?? "",
    };
  });
}

export function getAdjacentSlideIndex(
  current: number,
  count: number,
  direction: HeroSlideDirection,
): number {
  if (count <= 1) return 0;
  const normalizedCurrent = ((current % count) + count) % count;

  return direction === "previous"
    ? (normalizedCurrent - 1 + count) % count
    : (normalizedCurrent + 1) % count;
}

export function shouldAutoRotate(state: HeroCarouselPauseState): boolean {
  return (
    state.count > 1 &&
    !state.hovered &&
    !state.focused &&
    !state.hidden &&
    !state.reducedMotion
  );
}
