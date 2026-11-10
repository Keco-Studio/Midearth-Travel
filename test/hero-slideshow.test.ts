import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const slideshowSource = readFileSync(
  new URL("../src/components/hero-slideshow.tsx", import.meta.url),
  "utf8",
);
const heroSource = readFileSync(
  new URL("../src/components/hero.tsx", import.meta.url),
  "utf8",
);
const pageSource = readFileSync(
  new URL("../src/app/page.tsx", import.meta.url),
  "utf8",
);
const css = readFileSync(
  new URL("../src/components/hero.module.css", import.meta.url),
  "utf8",
);

test("uses the carousel policy for timed and manual navigation", () => {
  assert.match(slideshowSource, /HERO_AUTOPLAY_INTERVAL_MS/);
  assert.match(slideshowSource, /shouldAutoRotate/);
  assert.match(slideshowSource, /getAdjacentSlideIndex/);
  assert.match(slideshowSource, /window\.setTimeout/);
  assert.match(slideshowSource, /timerGeneration/);
  assert.match(slideshowSource, /direction: "previous"/);
  assert.match(slideshowSource, /direction: "next"/);
});

test("pauses for reduced motion, hidden documents, hover, and focus", () => {
  assert.match(slideshowSource, /matchMedia\("\(prefers-reduced-motion: reduce\)"\)/);
  assert.match(slideshowSource, /visibilitychange/);
  assert.match(heroSource, /onMouseEnter/);
  assert.match(heroSource, /onMouseLeave/);
  assert.match(heroSource, /onFocusCapture/);
  assert.match(heroSource, /onBlurCapture/);
  assert.match(heroSource, /hovered=\{hovered\}/);
  assert.match(heroSource, /focused=\{focused\}/);
});

test("renders accessible background links and icon navigation only for multiple slides", () => {
  assert.match(slideshowSource, /import \{ ChevronLeft, ChevronRight \}/);
  assert.match(slideshowSource, /activeSlide\.href/);
  assert.match(slideshowSource, /aria-label=\{`View \$\{activeSlide\.tourTitle\}`\}/);
  assert.match(slideshowSource, /slides\.length > 1/);
  assert.match(slideshowSource, /aria-label="Previous Hero slide"/);
  assert.match(slideshowSource, /aria-label="Next Hero slide"/);
});

test("integrates published tours without changing existing Hero actions", () => {
  assert.match(pageSource, /<Hero content=\{hero\} tours=\{publishedTours\} \/>/);
  assert.match(heroSource, /resolvePublicHeroSlides\(content, tours, lang\)/);
  assert.match(heroSource, /primaryButtonLink = "#tours"/);
  assert.match(heroSource, /secondaryButtonLink = "#contact"/);
  assert.match(heroSource, /<HeroSlideshow/);
});

test("styles stable crossfades, focal cropping, controls, and reduced motion", () => {
  assert.match(css, /\.slideImage\s*\{[\s\S]*object-fit:\s*cover;/);
  assert.match(css, /\.focalLeft\s*\{[\s\S]*object-position:\s*left center;/);
  assert.match(css, /\.focalCenter\s*\{[\s\S]*object-position:\s*center center;/);
  assert.match(css, /\.focalRight\s*\{[\s\S]*object-position:\s*right center;/);
  assert.match(css, /@keyframes heroSlideFade/);
  assert.match(css, /\.carouselButton\s*\{[\s\S]*width:\s*44px;[\s\S]*height:\s*44px;/);
  assert.match(css, /@media \(prefers-reduced-motion:\s*reduce\)/);
});

test("keeps mobile carousel controls below the Hero statistics", () => {
  assert.match(
    css,
    /@media \(max-width:\s*520px\)\s*\{[\s\S]*?\.carouselControls\s*\{[\s\S]*?bottom:\s*4px;/,
  );
});
