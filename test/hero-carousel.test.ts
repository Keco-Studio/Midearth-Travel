import assert from "node:assert/strict";
import test from "node:test";
import type { Tour } from "../src/data/tours.ts";
import {
  getAdjacentSlideIndex,
  HERO_AUTOPLAY_INTERVAL_MS,
  resolvePublicHeroSlides,
  shouldAutoRotate,
} from "../src/lib/hero-carousel.ts";
import {
  type HeroSlide,
  withHeroSlides,
} from "../src/lib/hero-slides.ts";

const linkedSlide: HeroSlide = {
  id: "featured",
  image: "/featured.jpg",
  tourSlug: "featured-tour",
  enabled: true,
};

const publishedTour: Tour = {
  slug: "featured-tour",
  title: "Featured Tour",
  localizedTitle: "精选行程",
  region: "Canada",
  duration: "2 days",
  description: "A published trip.",
  image: "/tour.jpg",
  tags: [],
  tourType: "Bus Tour",
};

test("uses a six-second autoplay interval", () => {
  assert.equal(HERO_AUTOPLAY_INTERVAL_MS, 6000);
});

test("resolves links only against currently published tours supplied by the page", () => {
  const content = withHeroSlides({}, [linkedSlide]);
  const slides = resolvePublicHeroSlides(content, [publishedTour], "en");

  assert.equal(slides[0]?.href, "/tours/featured-tour");
  assert.equal(slides[0]?.tourTitle, "Featured Tour");
  assert.equal(resolvePublicHeroSlides(content, [], "en")[0]?.href, null);
});

test("localizes the accessible tour title for Chinese visitors", () => {
  const content = withHeroSlides({}, [linkedSlide]);

  assert.equal(
    resolvePublicHeroSlides(content, [publishedTour], "zh")[0]?.tourTitle,
    "精选行程",
  );
});

test("omits disabled, blank, and unsafe slides from the public collection", () => {
  const content = withHeroSlides({}, [
    linkedSlide,
    { ...linkedSlide, id: "disabled", enabled: false },
    { ...linkedSlide, id: "blank", image: "" },
    { ...linkedSlide, id: "unsafe", image: "javascript:alert(1)" },
  ]);

  assert.deepEqual(
    resolvePublicHeroSlides(content, [publishedTour], "en").map(({ id }) => id),
    ["featured"],
  );
});

test("wraps manual navigation in both directions", () => {
  assert.equal(getAdjacentSlideIndex(0, 3, "previous"), 2);
  assert.equal(getAdjacentSlideIndex(2, 3, "next"), 0);
  assert.equal(getAdjacentSlideIndex(0, 0, "next"), 0);
  assert.equal(getAdjacentSlideIndex(0, 1, "previous"), 0);
});

test("autoplays only an unpaused multi-slide carousel", () => {
  const active = {
    count: 2,
    hovered: false,
    focused: false,
    hidden: false,
    reducedMotion: false,
  };

  assert.equal(shouldAutoRotate(active), true);
  assert.equal(shouldAutoRotate({ ...active, count: 1 }), false);
  assert.equal(shouldAutoRotate({ ...active, hovered: true }), false);
  assert.equal(shouldAutoRotate({ ...active, focused: true }), false);
  assert.equal(shouldAutoRotate({ ...active, hidden: true }), false);
  assert.equal(shouldAutoRotate({ ...active, reducedMotion: true }), false);
});
