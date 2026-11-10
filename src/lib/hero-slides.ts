import type { ContentData } from "./content-values.ts";
import { getStringContent } from "./content-values.ts";
import { isPreviewableImageUrl } from "./inline-image-upload.ts";

export const HERO_SLIDES_DATA_KEY = "slidesData";
export const LEGACY_HERO_SLIDE_ID = "legacy-hero-slide";

const DEFAULT_HERO_IMAGE = "/hero/hero-coast.jpg";

export type HeroSlideMoveDirection = "up" | "down";

export type HeroSlide = {
  id: string;
  image: string;
  tourSlug: string;
  enabled: boolean;
};

export class HeroSlidesPublishError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "HeroSlidesPublishError";
  }
}

export function parseHeroSlides(content: ContentData): HeroSlide[] {
  const serialized = content[HERO_SLIDES_DATA_KEY];

  if (typeof serialized === "string") {
    try {
      const parsed = JSON.parse(serialized) as unknown;
      if (Array.isArray(parsed)) {
        return parsed
          .map(normalizeHeroSlide)
          .filter((slide): slide is HeroSlide => slide !== null);
      }
    } catch {
      // Fall through to the legacy image for malformed stored data.
    }
  }

  return [
    {
      id: LEGACY_HERO_SLIDE_ID,
      image: getStringContent(content, "backgroundImage", DEFAULT_HERO_IMAGE).trim(),
      tourSlug: "",
      enabled: true,
    },
  ];
}

export function serializeHeroSlides(slides: readonly HeroSlide[]): string {
  return JSON.stringify(slides);
}

export function createEmptyHeroSlide(id = createHeroSlideId()): HeroSlide {
  return {
    id,
    image: "",
    tourSlug: "",
    enabled: false,
  };
}

export function moveHeroSlide(
  slides: readonly HeroSlide[],
  id: string,
  direction: HeroSlideMoveDirection,
): HeroSlide[] {
  const currentIndex = slides.findIndex((slide) => slide.id === id);
  if (currentIndex < 0) return [...slides];

  const nextIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
  if (nextIndex < 0 || nextIndex >= slides.length) return [...slides];

  const next = [...slides];
  [next[currentIndex], next[nextIndex]] = [next[nextIndex], next[currentIndex]];
  return next;
}

export function getEnabledHeroSlides(content: ContentData): HeroSlide[] {
  return parseHeroSlides(content).filter(
    (slide) => slide.enabled && isPreviewableImageUrl(slide.image),
  );
}

export function withHeroSlides(
  content: ContentData,
  slides: readonly HeroSlide[],
): ContentData {
  const next: ContentData = {
    ...content,
    [HERO_SLIDES_DATA_KEY]: serializeHeroSlides(slides),
  };
  const firstEnabled = slides.find(
    (slide) => slide.enabled && isPreviewableImageUrl(slide.image),
  );

  if (firstEnabled) {
    next.backgroundImage = firstEnabled.image.trim();
  }

  return next;
}

export function validateHeroSlidesForPublish(content: ContentData): void {
  if (getEnabledHeroSlides(content).length === 0) {
    throw new HeroSlidesPublishError(
      "Add and enable at least one Hero slide with an uploaded image before publishing.",
    );
  }
}

function normalizeHeroSlide(value: unknown): HeroSlide | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const raw = value as Record<string, unknown>;
  const id = typeof raw.id === "string" ? raw.id.trim() : "";
  if (!id) return null;

  return {
    id,
    image: typeof raw.image === "string" ? raw.image.trim() : "",
    tourSlug: typeof raw.tourSlug === "string" ? raw.tourSlug.trim() : "",
    enabled: raw.enabled === true,
  };
}

function createHeroSlideId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `hero-slide-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
