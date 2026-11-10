# Homepage Hero Slideshow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an unlimited, CMS-managed homepage Hero background slideshow while leaving all existing Hero content and actions unchanged.

**Architecture:** Store a canonical serialized slide array in the existing Hero module's draft and published JSON, with the legacy background image synchronized for other page fallbacks. Isolate normalization and publication rules in a pure domain module, render the interactive background in a focused client component, and add a dedicated Ant Design CMS editor that reuses the existing authenticated upload and Tour Library data flows.

**Tech Stack:** Next.js 16.2.9 App Router, React 19, TypeScript, Ant Design 5, Lucide React, CSS Modules, Node test runner, Supabase REST and Storage.

**Spec:** `docs/superpowers/specs/2026-11-10-homepage-hero-slideshow-design.md`

## Global Constraints

- Do not add a database table, migration, carousel dependency, or drag-and-drop dependency.
- Do not impose an application-level slide count limit.
- Existing Hero headlines, broadcast, cards, statistics, and action buttons must remain unchanged.
- Only enabled slides with valid images appear publicly.
- Publishing requires at least one enabled slide with a valid image; saving an incomplete draft remains allowed.
- Only currently published tours produce public slide links.
- Autoplay interval is exactly 6,000 ms and stops for hover, focus, hidden documents, and reduced motion.
- One enabled image renders without carousel controls or an autoplay timer.
- Mobile and desktop images use centered `cover` cropping.
- Preserve unrelated dirty-worktree changes and stage only files belonging to each task.

---

### Task 1: Hero Slide Domain Model

**Files:**
- Create: `src/lib/hero-slides.ts`
- Create: `test/hero-slides.test.ts`

**Interfaces:**
- Produces: `HeroSlide`, `HERO_SLIDES_DATA_KEY`, `parseHeroSlides(content)`, `serializeHeroSlides(slides)`, `createEmptyHeroSlide(id?)`, `moveHeroSlide(slides, id, direction)`, `getEnabledHeroSlides(content)`, and `withHeroSlides(content, slides)`.
- Consumes: `ContentData` from `src/lib/content-values.ts` and `isPreviewableImageUrl` from `src/lib/inline-image-upload.ts`.

- [ ] **Step 1: Write failing parser and mutation tests**

Cover legacy fallback, valid empty arrays, malformed JSON fallback, normalization, enabled filtering, serialization order, creation, movement, and compatibility-image synchronization:

```ts
function slide(id: string): HeroSlide {
  return {
    id,
    image: `/${id}.jpg`,
    tourSlug: "",
    enabled: true,
  };
}

test("migrates the legacy background into one enabled slide", () => {
  assert.deepEqual(parseHeroSlides({ backgroundImage: "/hero/legacy.jpg" }), [
    {
      id: "legacy-hero-slide",
      image: "/hero/legacy.jpg",
      tourSlug: "",
      enabled: true,
    },
  ]);
});

test("preserves an explicitly empty slide draft", () => {
  assert.deepEqual(parseHeroSlides({ slidesData: "[]", backgroundImage: "/hero/legacy.jpg" }), []);
});

test("keeps serialized order when moving a slide", () => {
  const slides = [slide("one"), slide("two"), slide("three")];
  assert.deepEqual(moveHeroSlide(slides, "two", "up").map(({ id }) => id), [
    "two",
    "one",
    "three",
  ]);
});

test("syncs the first complete enabled slide to the legacy background", () => {
  const result = withHeroSlides({}, [
    { ...slide("disabled"), image: "/disabled.jpg", enabled: false },
    { ...slide("active"), image: "/active.jpg", enabled: true },
  ]);
  assert.equal(result.backgroundImage, "/active.jpg");
});
```

- [ ] **Step 2: Run the focused test and confirm RED**

Run: `node --experimental-strip-types --test test/hero-slides.test.ts`

Expected: FAIL because `src/lib/hero-slides.ts` does not exist.

- [ ] **Step 3: Implement the pure domain module**

Use this public shape and constants:

```ts
export const HERO_SLIDES_DATA_KEY = "slidesData";
export const LEGACY_HERO_SLIDE_ID = "legacy-hero-slide";

export type HeroSlide = {
  id: string;
  image: string;
  tourSlug: string;
  enabled: boolean;
};
```

`parseHeroSlides` must distinguish a valid serialized empty array from a missing or malformed field. Normalize strings with `trim()`, default `enabled` to `false`, and drop non-object entries or entries without stable string ids. `getEnabledHeroSlides` filters to `enabled && isPreviewableImageUrl(image)`. `withHeroSlides` always updates `slidesData` and only replaces `backgroundImage` when a complete enabled slide exists.

- [ ] **Step 4: Run the focused test and confirm GREEN**

Run: `node --experimental-strip-types --test test/hero-slides.test.ts`

Expected: all Hero slide domain tests pass.

- [ ] **Step 5: Commit the domain model**

```bash
git add src/lib/hero-slides.ts test/hero-slides.test.ts
git commit -m "feat: add hero slide domain model"
```

---

### Task 2: Seed Migration And Publish Validation

**Files:**
- Modify: `src/data/cms-seed.ts`
- Modify: `src/lib/home-content.ts`
- Modify: `src/lib/supabase-home-content.ts`
- Modify: `src/app/api/admin/home-modules/[id]/route.ts`
- Modify: `test/home-content.test.ts`
- Modify: `test/hero-slides.test.ts`

**Interfaces:**
- Consumes: Task 1 slide parser and serializer.
- Produces: canonical legacy migration in `canonicalizeHomeModule`, `HeroSlidesPublishError`, and `validateHeroSlidesForPublish(content)`.

- [ ] **Step 1: Add failing seed, migration, and publication tests**

Add assertions that the Hero seed contains serialized slide data, a stored pre-slideshow Hero derives its slide from its own stored `backgroundImage`, drafts can contain `[]`, and publication validation rejects missing active media:

```ts
function heroWithSlides(slides: HeroSlide[]): HomeModuleRecord {
  return {
    ...heroSeed,
    data: withHeroSlides(heroSeed.data, slides),
  };
}

test("migrates a stored legacy Hero using its own background", () => {
  const legacy = {
    ...storedHero,
    published_data: { ...storedHero.published_data, slidesData: undefined, backgroundImage: "/legacy.jpg" },
  } as HomeModuleRow;
  const hero = mergeHomeModuleRows([legacy], "published").find(({ id }) => id === "hero")!;
  assert.equal(parseHeroSlides(hero.data)[0]?.image, "/legacy.jpg");
});

test("requires an enabled image only when publishing", () => {
  assert.doesNotThrow(() => canonicalizeHomeModule(heroWithSlides([])));
  assert.throws(
    () => validateHeroSlidesForPublish(heroWithSlides([]).data),
    /at least one enabled slide/i,
  );
});
```

- [ ] **Step 2: Run tests and confirm RED**

Run: `node --experimental-strip-types --test test/hero-slides.test.ts test/home-content.test.ts`

Expected: FAIL because seed migration and publish validation are absent.

- [ ] **Step 3: Add the hidden serialized field to the Hero seed**

Keep `backgroundImage` for compatibility and add `slidesData` as an editor-managed string field. Seed it with a fixed id so builds are deterministic:

```ts
{
  key: HERO_SLIDES_DATA_KEY,
  label: "Hero slides",
  type: "textarea",
  required: true,
}
```

Set its data to `serializeHeroSlides([{ id: "hero-slide-1", image: "/hero/hero-coast.jpg", tourSlug: "", enabled: true }])`.

- [ ] **Step 4: Normalize legacy Hero data before seed defaults are applied**

In `canonicalizeHomeModule`, when the candidate is `hero` and has no string `slidesData`, serialize one slide from the candidate's own `backgroundImage` before the field reduction. If `slidesData` is a string, parse and reserialize it so malformed persisted JSON becomes canonical legacy fallback while `"[]"` stays empty.

- [ ] **Step 5: Enforce publication validation on the server**

Add:

```ts
export class HeroSlidesPublishError extends Error {}

export function validateHeroSlidesForPublish(content: ContentData): void {
  if (getEnabledHeroSlides(content).length === 0) {
    throw new HeroSlidesPublishError(
      "Add and enable at least one Hero slide with an uploaded image before publishing.",
    );
  }
}
```

Call it from `publishHomeModule` after canonicalizing the Hero draft and before writing the published row. In the admin route, return status `400` with the error message when the caught error is `HeroSlidesPublishError`; retain status `500` for unexpected failures.

- [ ] **Step 6: Run focused tests and confirm GREEN**

Run: `node --experimental-strip-types --test test/hero-slides.test.ts test/home-content.test.ts`

Expected: all tests pass.

- [ ] **Step 7: Commit persistence and validation**

```bash
git add src/data/cms-seed.ts src/lib/home-content.ts src/lib/supabase-home-content.ts src/app/api/admin/home-modules/[id]/route.ts test/home-content.test.ts test/hero-slides.test.ts
git commit -m "feat: persist and validate hero slides"
```

---

### Task 3: CMS Slide Editor

**Files:**
- Create: `src/components/hero-slides-editor.tsx`
- Modify: `src/components/home-module-editor.tsx`
- Create: `test/hero-slides-editor.test.ts`

**Interfaces:**
- Consumes: Task 1 slide functions, `TourRecord[]`, and the existing `onImageUpload(fieldKey, file)` callback.
- Produces: `HeroSlidesEditor({ content, tours, onChange, onImageUpload })`.

- [ ] **Step 1: Write failing editor contract tests**

Use TypeScript AST/source contract assertions consistent with the repository's existing CMS tests, plus pure state assertions against Task 1 helpers. Verify that the Hero module hides raw `backgroundImage` and `slidesData` controls, mounts `HeroSlidesEditor`, passes `tours` and upload callbacks, and that the new editor includes add, replace upload, enable, published-tour select, focal segmented control, move up/down, and delete commands.

```ts
test("uses the dedicated slide editor instead of raw Hero media fields", () => {
  const source = readFileSync(new URL("../src/components/home-module-editor.tsx", import.meta.url), "utf8");
  assert.match(source, /module\.id === "hero"[\s\S]*<HeroSlidesEditor/);
  assert.match(source, /HERO_SLIDES_DATA_KEY/);
  assert.match(source, /definition\.key === "backgroundImage"/);
});
```

- [ ] **Step 2: Run the editor test and confirm RED**

Run: `node --experimental-strip-types --test test/hero-slides-editor.test.ts`

Expected: FAIL because the dedicated editor does not exist.

- [ ] **Step 3: Implement `HeroSlidesEditor`**

Use Ant Design `Upload`, `Switch`, `Select`, and icon buttons with `Tooltip`. Filter tour options with `tour.status === "published"`. Add slides with `createEmptyHeroSlide()`; new slides are disabled and blank. For every mutation call one commit function:

```ts
function commit(next: HeroSlide[]) {
  const nextContent = withHeroSlides(content, next);
  onChange(HERO_SLIDES_DATA_KEY, nextContent[HERO_SLIDES_DATA_KEY]);
  if (nextContent.backgroundImage !== content.backgroundImage) {
    onChange("backgroundImage", nextContent.backgroundImage);
  }
}
```

Uploads use `onImageUpload(`slide-${slide.id}`, file)` and update only after the upload resolves. Keep the previous image on rejection. Disable up/down controls at array boundaries. Require confirmation for destructive deletion when a slide already has an image.

- [ ] **Step 4: Integrate it into `HomeModuleEditor`**

Filter both raw fields only for `module.id === "hero"`, then render:

```tsx
{module.id === "hero" ? (
  <HeroSlidesEditor
    content={module.data}
    tours={tours}
    onChange={onChange}
    onImageUpload={onImageUpload}
  />
) : null}
```

- [ ] **Step 5: Run editor and existing module tests**

Run: `node --experimental-strip-types --test test/hero-slides-editor.test.ts test/module-editor.test.ts test/inline-image-upload.test.ts`

Expected: all tests pass.

- [ ] **Step 6: Commit the CMS editor**

```bash
git add src/components/hero-slides-editor.tsx src/components/home-module-editor.tsx test/hero-slides-editor.test.ts
git commit -m "feat: manage hero slides in CMS"
```

---

### Task 4: Carousel State And Public Link Resolution

**Files:**
- Create: `src/lib/hero-carousel.ts`
- Create: `test/hero-carousel.test.ts`

**Interfaces:**
- Consumes: `HeroSlide` from Task 1 and public `Tour` records.
- Produces: `resolvePublicHeroSlides(content, tours)`, `getAdjacentSlideIndex(current, count, direction)`, `shouldAutoRotate(state)`, `HERO_AUTOPLAY_INTERVAL_MS`, and `PublicHeroSlide`.

- [ ] **Step 1: Write failing carousel policy tests**

```ts
const linkedSlide: HeroSlide = {
  id: "featured",
  image: "/featured.jpg",
  tourSlug: "featured-tour",
  enabled: true,
};
const publishedTour: Tour = {
  slug: "featured-tour",
  title: "Featured Tour",
  region: "Canada",
  duration: "2 days",
  description: "A published trip.",
  image: "/tour.jpg",
  tags: [],
  tourType: "Bus Tour",
};
const contentWithSlides = (slides: HeroSlide[]): ContentData =>
  withHeroSlides({}, slides);

test("resolves links only against currently published tours supplied by the page", () => {
  const slides = resolvePublicHeroSlides(contentWithSlides([linkedSlide]), [publishedTour]);
  assert.equal(slides[0]?.href, `/tours/${publishedTour.slug}`);
  assert.equal(resolvePublicHeroSlides(contentWithSlides([linkedSlide]), [])[0]?.href, null);
});

test("wraps manual navigation in both directions", () => {
  assert.equal(getAdjacentSlideIndex(0, 3, "previous"), 2);
  assert.equal(getAdjacentSlideIndex(2, 3, "next"), 0);
});

test("autoplays only an unpaused multi-slide carousel", () => {
  assert.equal(shouldAutoRotate({ count: 2, hovered: false, focused: false, hidden: false, reducedMotion: false }), true);
  assert.equal(shouldAutoRotate({ count: 1, hovered: false, focused: false, hidden: false, reducedMotion: false }), false);
  assert.equal(shouldAutoRotate({ count: 2, hovered: true, focused: false, hidden: false, reducedMotion: false }), false);
});
```

- [ ] **Step 2: Run the test and confirm RED**

Run: `node --experimental-strip-types --test test/hero-carousel.test.ts`

Expected: FAIL because the carousel policy module does not exist.

- [ ] **Step 3: Implement carousel policy helpers**

Define `HERO_AUTOPLAY_INTERVAL_MS = 6000`. `resolvePublicHeroSlides` uses Task 1 enabled filtering, maps slugs through the supplied public-tour list, returns `href: null` for missing slugs, and uses the tour's localized title only as data for the accessible link label. Index helpers return `0` for empty or single-item collections and wrap safely.

- [ ] **Step 4: Run the focused test and confirm GREEN**

Run: `node --experimental-strip-types --test test/hero-carousel.test.ts`

Expected: all carousel policy tests pass.

- [ ] **Step 5: Commit carousel policy**

```bash
git add src/lib/hero-carousel.ts test/hero-carousel.test.ts
git commit -m "feat: add hero carousel behavior"
```

---

### Task 5: Interactive Hero Background

**Files:**
- Create: `src/components/hero-slideshow.tsx`
- Modify: `src/components/hero.tsx`
- Modify: `src/components/hero.module.css`
- Modify: `src/app/page.tsx`
- Create: `test/hero-slideshow.test.ts`

**Interfaces:**
- Consumes: Task 4 `PublicHeroSlide[]`, helpers, and interval constant.
- Produces: `HeroSlideshow({ slides })`; extends `Hero` props to `{ content?: ContentData; tours?: Tour[] }`.

- [ ] **Step 1: Write failing public component contract tests**

Verify the slideshow uses `next/image`, Lucide `ChevronLeft`/`ChevronRight`, accessible previous/next button labels, the exact interval constant, reduced-motion `matchMedia`, hover/focus/visibility pause state, a background `Link` only when `href` exists, and no change to existing Hero buttons.

Also assert CSS has stable absolute layers, opacity transition, focal-point selectors, fixed-size icon controls, responsive positions, and `prefers-reduced-motion` handling.

- [ ] **Step 2: Run the public test and confirm RED**

Run: `node --experimental-strip-types --test test/hero-slideshow.test.ts test/hero-content.test.ts`

Expected: FAIL because `HeroSlideshow` does not exist.

- [ ] **Step 3: Implement `HeroSlideshow`**

The component owns `activeIndex`, interaction pause state, document visibility, and the reduced-motion media query. Use one timeout per eligible rotation and clear it on every dependency change. Manual navigation updates the active index and increments a timer generation value so the full six-second period restarts.

Preload only the next slide with the browser `Image` constructor in an effect. Render the current image and retain the prior image for one transition duration to create an opacity crossfade without mounting every configured slide. Mark decorative images with empty alt text.

Render the background tour link as an absolute sibling layer:

```tsx
{activeSlide.href ? (
  <Link
    aria-label={`View ${activeSlide.tourTitle}`}
    className={styles.slideLink}
    href={activeSlide.href}
  />
) : null}
```

Render controls only when `slides.length > 1`. Use icon-only buttons, `aria-label`, and `title`; prevent click events from reaching background behavior.

- [ ] **Step 4: Integrate without changing Hero content**

In `Hero`, call `resolvePublicHeroSlides(content, tours)` and replace only the existing `.bg` image block with `<HeroSlideshow slides={slides} />`. Keep headline, broadcast, cards, buttons, and stats markup unchanged. In `src/app/page.tsx`, pass `publishedTours` into `Hero`.

- [ ] **Step 5: Add responsive styles**

Use `object-fit: cover` with `object-position: center center`. Keep controls clear of the navbar and existing actions at desktop and mobile widths. Give controls stable square dimensions and a restrained high-contrast treatment. Disable transition animation in `prefers-reduced-motion: reduce`.

Set pointer-event rules so non-interactive Hero space reaches the background link while cards, actions, broadcast, and carousel controls remain interactive. Do not wrap the Hero or its existing links in another anchor.

- [ ] **Step 6: Run focused public tests**

Run: `node --experimental-strip-types --test test/hero-slideshow.test.ts test/hero-carousel.test.ts test/hero-content.test.ts test/page-content.test.ts`

Expected: all tests pass, including unchanged Booking and Contact background fallback assertions.

- [ ] **Step 7: Commit the public slideshow**

```bash
git add src/components/hero-slideshow.tsx src/components/hero.tsx src/components/hero.module.css src/app/page.tsx test/hero-slideshow.test.ts
git commit -m "feat: rotate homepage hero backgrounds"
```

---

### Task 6: End-To-End Verification

**Files:**
- Modify only if verification reveals a requirement-specific defect.

**Interfaces:**
- Consumes: all prior tasks.
- Produces: verified CMS and public behavior with no unrelated changes.

- [ ] **Step 1: Run every focused slideshow test**

Run:

```bash
node --experimental-strip-types --test \
  test/hero-slides.test.ts \
  test/hero-carousel.test.ts \
  test/hero-slides-editor.test.ts \
  test/hero-slideshow.test.ts \
  test/home-content.test.ts \
  test/module-editor.test.ts \
  test/page-content.test.ts
```

Expected: zero failures.

- [ ] **Step 2: Run repository checks**

Run:

```bash
npm test
npm run lint
npm run build
git diff --check
```

Expected: zero feature-related failures. If unrelated dirty-worktree tests fail, record the exact test names and confirm focused slideshow tests remain green.

- [ ] **Step 3: Verify CMS behavior manually**

Start the existing dev server, open the Hero CMS module, and verify: add three slides; upload and replace images; choose published tours; clear one tour; set focal positions; move slides both directions; disable one; save a draft; publish with one enabled image; confirm publication is blocked when every slide is disabled.

- [ ] **Step 4: Verify desktop and mobile public behavior**

At representative desktop and mobile viewports, verify: six-second rotation; previous/next controls; timer reset; hover and focus pause; reduced-motion stop; correct focal cropping; linked background navigation; unlinked background inactivity; existing Hero cards and buttons remain independently clickable; no text, controls, or navbar overlap.

- [ ] **Step 5: Review the final diff**

Run: `git diff --stat HEAD~4..HEAD && git status --short`

Confirm only slideshow files and known pre-existing user changes are present. Do not stage or revert unrelated files.
