# Homepage Hero Slideshow Design

## Summary

Replace the homepage Hero's single background image with a CMS-managed slideshow. The slideshow changes only the background image and its optional tour destination. Existing Hero headlines, broadcast, feature cards, statistics, and action buttons remain unchanged.

Editors can add, remove, reorder, replace, enable, disable, save, and publish any number of slides. Each slide contains an image and an optional published-tour association. The public homepage rotates enabled slides automatically and provides previous and next controls.

## Requirements

- Preserve every existing Hero element except the background-image behavior.
- Store any number of slides; do not impose an application-level maximum.
- Each slide has:
  - a stable id;
  - an uploaded image URL;
  - an optional Tour Library slug;
  - an enabled flag.
- Keep existing Hero buttons and links unchanged.
- When a slide references a published tour, the non-interactive Hero background area links to that tour.
- Only published tours may be selected in the CMS.
- If a linked tour is later unpublished or removed, the slide still displays but is no longer clickable.
- Rotate every six seconds.
- Pause rotation while the Hero is hovered or contains keyboard focus.
- Reset the timer after manual navigation.
- Disable automatic rotation when the visitor requests reduced motion.
- Use responsive `cover` cropping centered on the image on desktop and mobile.
- A single enabled image behaves like the current Hero: no timer and no carousel controls.
- Drafts may temporarily contain no enabled complete slide.
- Publishing requires at least one enabled slide with a valid image.

## Data Model

Slides are serialized into a `slidesData` string inside the existing Hero module's `draft_data` and `published_data` JSON objects:

```ts
type HeroSlide = {
  id: string;
  image: string;
  tourSlug: string;
  enabled: boolean;
};
```

The array order is the display order. A dedicated parser normalizes untrusted persisted data, removes malformed entries, and preserves stable ids. A serializer writes the canonical representation.

The existing primitive-only `ContentValue` contract remains unchanged because `slidesData` is a JSON string. This follows the repository's existing `monthsData` collection pattern and keeps slides inside the Hero module's atomic draft/publish lifecycle.

### Backward Compatibility

When `slidesData` is absent, the parser creates one enabled slide from the existing `backgroundImage`. This keeps all existing installations and a one-image Hero working without a database migration.

Whenever the editor commits slide changes and at least one complete enabled slide exists, it also sets `backgroundImage` to the first such slide. The field stays in persisted Hero data as a compatibility value but is hidden from the Hero editor. Booking and Contact page background fallback behavior therefore remains unchanged.

An explicitly saved empty slide collection is not converted back to the legacy image in draft mode. Publishing blocks that state.

## CMS Experience

Add a dedicated `HeroSlidesEditor` to the existing Hero module editor. Hide the raw `slidesData` and legacy `backgroundImage` fields for this module.

Each slide row contains:

- image preview and upload/replace control;
- enabled switch;
- searchable published-tour selector with a clear option;
- move up and move down icon buttons;
- delete icon button.

The editor provides an Add slide command. New slides start disabled and have no image, so an incomplete row cannot accidentally become public. Reordering updates the serialized array immediately. Uploads continue through the authenticated home-module upload endpoint and use the slide id as part of the storage field key.

The existing Save draft and Publish actions remain the only persistence controls. Saving accepts incomplete or fully disabled slide drafts. Publishing performs server-side validation and returns an actionable client error if no enabled slide has a valid image or if an enabled slide contains an invalid image URL.

Tour options come from the already loaded Tour Library data and include only `published` records. The server does not trust the selected slug for public navigation: the homepage resolves it again against currently published tours.

## Public Slideshow

The server-rendered homepage continues loading published Hero content and published tours. It passes the tours to the Hero so the client component can resolve slide links without a second request.

The Hero filters out disabled or incomplete slides. For more than one slide it:

- starts a six-second timer;
- uses an opacity crossfade between images;
- preloads the next image without eagerly rendering every slide;
- exposes previous and next icon buttons with accessible labels;
- resets the timer after either control is used;
- pauses on hover, focus within, hidden document state, or reduced-motion preference.

For one slide it renders one image with no carousel state, timer, or controls.

The tour link is an absolute background interaction layer rather than a wrapper around the Hero. This avoids invalid nested links because the existing action buttons and feature cards already use links. The Hero's non-interactive headline area allows pointer events to reach the background link, while cards, buttons, broadcast content, and carousel controls remain independent interactive elements. The link has an accessible name derived from the selected tour.

Images continue using `next/image` with `fill`, `sizes="100vw"`, responsive `object-fit: cover`, and fixed centered positioning. The first active image is prioritized; subsequent images are loaded as needed.

## Validation And Failure Handling

- Parsing malformed stored slide JSON falls back to the legacy `backgroundImage` only when the new field is absent or invalid, not when a valid empty draft was intentionally saved.
- Draft save normalizes entries but permits incomplete disabled slides.
- Publish rejects zero complete enabled slides.
- Publish rejects invalid image URLs on enabled slides.
- Unknown or unpublished tour slugs do not block image display and do not produce public links.
- An image upload failure leaves the prior image value unchanged and displays the existing CMS error message.
- Carousel state clamps or resets safely when slide content changes.

## Testing

Use test-driven development for each behavior group:

1. Parser and serializer tests cover legacy migration, normalization, ordering, empty drafts, enabled-slide filtering, and focal-point defaults.
2. Publish-validation tests prove drafts may be incomplete while publication requires one enabled valid image.
3. CMS editor/state tests cover add, delete, reorder, replace, disable, tour selection, and synchronization of the compatibility background image.
4. Public Hero tests cover single-image behavior, enabled filtering, published-tour link resolution, missing-tour fallback, previous/next navigation, timer reset, pause states, reduced motion, and focal-point classes.
5. Existing page-background tests verify Booking and Contact fallback behavior remains unchanged.
6. Run focused tests, the full test suite, ESLint, and a production build. Visually verify desktop and mobile Hero cropping and that controls do not overlap existing content.

## Out Of Scope

- Per-slide headlines, subtitles, broadcasts, cards, statistics, or action-button content.
- Per-slide mobile image uploads.
- Custom transition types or editor-controlled timing.
- A new database table or database migration.
- Draft preview infrastructure beyond the current CMS behavior.
