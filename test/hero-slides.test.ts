import assert from "node:assert/strict";
import test from "node:test";
import {
  createEmptyHeroSlide,
  getEnabledHeroSlides,
  moveHeroSlide,
  parseHeroSlides,
  serializeHeroSlides,
  type HeroSlide,
  withHeroSlides,
} from "../src/lib/hero-slides.ts";

function slide(id: string): HeroSlide {
  return {
    id,
    image: `/${id}.jpg`,
    tourSlug: "",
    enabled: true,
    focalPoint: "center",
  };
}

test("migrates the legacy background into one enabled slide", () => {
  assert.deepEqual(parseHeroSlides({ backgroundImage: "/hero/legacy.jpg" }), [
    {
      id: "legacy-hero-slide",
      image: "/hero/legacy.jpg",
      tourSlug: "",
      enabled: true,
      focalPoint: "center",
    },
  ]);
});

test("preserves an explicitly empty slide draft", () => {
  assert.deepEqual(
    parseHeroSlides({
      slidesData: "[]",
      backgroundImage: "/hero/legacy.jpg",
    }),
    [],
  );
});

test("falls back to the legacy image when serialized slides are malformed", () => {
  assert.equal(
    parseHeroSlides({
      slidesData: "not-json",
      backgroundImage: "/hero/fallback.jpg",
    })[0]?.image,
    "/hero/fallback.jpg",
  );
});

test("normalizes stored slide values and removes invalid entries", () => {
  const stored = JSON.stringify([
    {
      id: " coast ",
      image: " /coast.jpg ",
      tourSlug: " maritime-tour ",
      enabled: true,
      focalPoint: "right",
    },
    {
      id: "city",
      image: "/city.jpg",
      enabled: "yes",
      focalPoint: "bottom",
    },
    { image: "/missing-id.jpg" },
    null,
  ]);

  assert.deepEqual(parseHeroSlides({ slidesData: stored }), [
    {
      id: "coast",
      image: "/coast.jpg",
      tourSlug: "maritime-tour",
      enabled: true,
      focalPoint: "right",
    },
    {
      id: "city",
      image: "/city.jpg",
      tourSlug: "",
      enabled: false,
      focalPoint: "center",
    },
  ]);
});

test("returns only enabled slides with previewable images", () => {
  const content = {
    slidesData: serializeHeroSlides([
      slide("active"),
      { ...slide("disabled"), enabled: false },
      { ...slide("unsafe"), image: "javascript:alert(1)" },
    ]),
  };

  assert.deepEqual(
    getEnabledHeroSlides(content).map(({ id }) => id),
    ["active"],
  );
});

test("keeps serialized order when moving a slide", () => {
  const slides = [slide("one"), slide("two"), slide("three")];

  assert.deepEqual(
    moveHeroSlide(slides, "two", "up").map(({ id }) => id),
    ["two", "one", "three"],
  );
  assert.deepEqual(
    moveHeroSlide(slides, "two", "down").map(({ id }) => id),
    ["one", "three", "two"],
  );
  assert.deepEqual(
    moveHeroSlide(slides, "one", "up").map(({ id }) => id),
    ["one", "two", "three"],
  );
});

test("creates a disabled empty slide with a stable supplied id", () => {
  assert.deepEqual(createEmptyHeroSlide("new-slide"), {
    id: "new-slide",
    image: "",
    tourSlug: "",
    enabled: false,
    focalPoint: "center",
  });
});

test("syncs the first complete enabled slide to the legacy background", () => {
  const result = withHeroSlides(
    { backgroundImage: "/old.jpg" },
    [
      { ...slide("disabled"), image: "/disabled.jpg", enabled: false },
      { ...slide("active"), image: "/active.jpg", enabled: true },
    ],
  );

  assert.equal(result.backgroundImage, "/active.jpg");
  assert.deepEqual(parseHeroSlides(result).map(({ id }) => id), [
    "disabled",
    "active",
  ]);
});

test("keeps the compatibility background when a draft has no enabled image", () => {
  const result = withHeroSlides(
    { backgroundImage: "/old.jpg" },
    [{ ...slide("draft"), image: "", enabled: false }],
  );

  assert.equal(result.backgroundImage, "/old.jpg");
  assert.equal(result.slidesData, serializeHeroSlides([{ ...slide("draft"), image: "", enabled: false }]));
});
