# Hot Sales CMS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the existing Hot Sales section a dedicated draft/publish Homepage module linked to Tour Library promotion editing, then render accurate promotion pricing and copy before Our Top Picks on the homepage and tour detail pages.

**Architecture:** Store ordered promotion entries and localized section copy in the new `hotSales` home module using the repository's serialized-JSON content pattern. Centralize parsing, validation, fare-derived original prices, and public promotion resolution in a pure domain module. Server persistence helpers synchronize Tour Library edits with the Hot Sales module while preserving its draft/publish contract, and public components consume only published module data.

**Tech Stack:** Next.js 16.2.9 App Router, React 19, TypeScript, Ant Design/Pro Components, Supabase REST, Node test runner, CSS Modules/global CSS.

**Spec:** `docs/superpowers/specs/2026-11-26-hot-sales-cms-design.md`

## Global Constraints

- Read the relevant Next.js 16.2.9 guides in `node_modules/next/dist/docs/` before changing routes or server persistence.
- Reuse the exact `Our Top Picks` heading structure and `.section-head`, `.eyebrow`, and `.section-title` typography for Hot Sales.
- Do not duplicate the existing public Hot Sales section; move it before Our Top Picks.
- Normal Tour fares remain the only original-price source and are never overwritten by a promotion.
- Homepage edits use Save Draft and Publish; Tour Library edits retain their existing Update behavior.
- Preserve unrelated working-tree changes in `src/lib/tour-itinerary-parser.ts` and `test/tour-import-mapper.test.ts`.

---

### Task 1: Hot Sales Domain And Module Registry

**Files:**
- Create: `src/lib/hot-sales.ts`
- Modify: `src/types/cms.ts`
- Modify: `src/data/cms-seed.ts`
- Modify: `src/lib/content-rules.ts`
- Modify: `src/lib/home-content.ts`
- Modify: `src/lib/layout-routes.ts`
- Test: `test/hot-sales.test.ts`
- Modify: `test/content-rules.test.ts`
- Modify: `test/layout-routes.test.ts`
- Modify: `test/home-content.test.ts`

**Interfaces:**
- Produces: `HOT_SALES_DATA_KEY = "promotionsData"`.
- Produces: `HotSalePromotion { tourSlug: string; salePrice: string; offerDescription: string; localizedOfferDescription: string }`.
- Produces: `parseHotSalePromotions(content): HotSalePromotion[]`, `serializeHotSalePromotions(entries): string`, `validateHotSalesForPublish(content, tours): void`.
- Produces: `getTourOriginalPrice(tour): string | null` and `getPublishedHotSalePromotions(content, tours): ResolvedHotSalePromotion[]`.

- [ ] **Step 1: Write failing domain and registry tests**

Cover malformed JSON fallback, trimming and duplicate removal, description-only offers, numeric sale validation, sale-lower-than-original validation, original fare derivation, `hotSales` before `toursSection`, fixed module count/order, and `/admin/home/hotSales` routing.

```ts
assert.deepEqual(parseHotSalePromotions({ promotionsData: JSON.stringify([
  { tourSlug: " ne01 ", salePrice: "249", offerDescription: " Last minute ", localizedOfferDescription: "" },
]) }), [{ tourSlug: "ne01", salePrice: "249", offerDescription: "Last minute", localizedOfferDescription: "" }]);
assert.equal(getTourOriginalPrice(tourWithFares), "CAD $639.00");
assert.throws(() => validateHotSalesForPublish(contentWithHighSale, tours), /lower than/i);
assert.equal(HOME_MODULES[2]?.id, "hotSales");
assert.equal(HOME_MODULES[3]?.id, "toursSection");
```

- [ ] **Step 2: Run the focused tests and verify RED**

Run: `npm test -- test/hot-sales.test.ts test/content-rules.test.ts test/layout-routes.test.ts test/home-content.test.ts`

Expected: FAIL because the domain module and `hotSales` registry entry do not exist.

- [ ] **Step 3: Implement the domain and seed module**

Add `hotSales` to `HomeModuleId`, the fixed registries, route parsing, and seed order. Seed fields are `eyebrow`, `eyebrowZh`, `sectionTitle`, `sectionTitleZh`, `description`, `descriptionZh`, plus the readonly serialized promotion data field. Normalize entries without throwing on legacy/malformed stored content; throw a typed publish error only during publish validation.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run the Step 2 command. Expected: PASS.

- [ ] **Step 5: Commit the domain slice**

```bash
git add src/lib/hot-sales.ts src/types/cms.ts src/data/cms-seed.ts src/lib/content-rules.ts src/lib/home-content.ts src/lib/layout-routes.ts test/hot-sales.test.ts test/content-rules.test.ts test/layout-routes.test.ts test/home-content.test.ts
git commit -m "feat: add hot sales homepage domain"
```

### Task 2: Dedicated Homepage Hot Sales Editor

**Files:**
- Create: `src/components/hot-sales-editor.tsx`
- Modify: `src/components/home-module-editor.tsx`
- Modify: `src/app/admin/admin.css`
- Test: `test/hot-sales-editor.test.ts`

**Interfaces:**
- Consumes: `parseHotSalePromotions`, `serializeHotSalePromotions`, `getTourOriginalPrice`, `HOT_SALES_DATA_KEY`.
- Produces: `HotSalesEditor({ content, tours, onChange })` with add, remove, reorder, sale-price, and bilingual offer-description controls.

- [ ] **Step 1: Write failing editor contract tests**

Assert that `HomeModuleEditor` renders `HotSalesEditor` only for `module.id === "hotSales"`, hides the raw JSON field, and passes current tours. Assert the editor includes searchable tour selection, original-price read-only text, price input, English/Chinese offer inputs, delete buttons, and accessible up/down reorder buttons.

```ts
assert.match(homeEditorSource, /module\.id === "hotSales"/);
assert.match(editorSource, /getTourOriginalPrice/);
assert.match(editorSource, /Discounted price \(CAD\)/);
assert.match(editorSource, /Offer description \(Chinese\)/);
```

- [ ] **Step 2: Run the editor test and verify RED**

Run: `npm test -- test/hot-sales-editor.test.ts`

Expected: FAIL because the dedicated editor is absent.

- [ ] **Step 3: Implement the editor**

Follow the established Hero Slides editor pattern: deserialize on render, commit the entire ordered list through `onChange(HOT_SALES_DATA_KEY, serializeHotSalePromotions(next))`, exclude already-selected tours from Add options, show a compact image/title/original-price summary, and use Ant Design icon buttons with tooltips for reorder/delete. Use a responsive un-nested list layout with an 8px maximum border radius.

- [ ] **Step 4: Run focused tests, lint the touched UI, and verify GREEN**

Run:

```bash
npm test -- test/hot-sales-editor.test.ts test/module-editor.test.ts
npx eslint src/components/hot-sales-editor.tsx src/components/home-module-editor.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit the CMS editor slice**

```bash
git add src/components/hot-sales-editor.tsx src/components/home-module-editor.tsx src/app/admin/admin.css test/hot-sales-editor.test.ts
git commit -m "feat: add hot sales homepage editor"
```

### Task 3: Draft, Publish, And Tour Library Synchronization

**Files:**
- Create: `src/lib/hot-sales-sync.ts`
- Modify: `src/lib/supabase-home-content.ts`
- Modify: `src/lib/supabase-tours.ts`
- Modify: `src/app/api/admin/home-modules/[id]/route.ts`
- Modify: `src/app/api/admin/tours/[slug]/route.ts`
- Modify: `src/types/cms.ts`
- Modify: `src/lib/tour-editor-state.ts`
- Modify: `src/lib/tour-content.ts`
- Modify: `src/lib/create-empty-tour.ts`
- Modify: `src/components/tour-editor.tsx`
- Test: `test/hot-sales-sync.test.ts`
- Modify: `test/tour-editor-state.test.ts`
- Modify: `test/tour-content.test.ts`

**Interfaces:**
- Produces Tour fields: `salePrice`, `hotSaleDescription`, `localizedHotSaleDescription`.
- Produces: `syncHotSalesModuleFromTour(record): Promise<void>` and `syncToursFromPublishedHotSales(module): Promise<TourRecord[]>`.
- Consumes the Step 1 publish validator from the home-module publish route.

- [ ] **Step 1: Write failing synchronization and Tour editor tests**

Cover legacy records defaulting new strings to empty, mapping projection fields to public tours, Tour Editor controls beside `Hot sale`, module publish validation, published module membership synchronizing `specialDeals`, and a Tour Library save updating that slug's current Hot Sales entry without disturbing other entries or unrelated module drafts.

```ts
assert.equal(parsed.salePrice, "");
assert.equal(parsed.hotSaleDescription, "");
assert.match(tourEditorSource, /name="salePrice"/);
assert.match(tourEditorSource, /name="hotSaleDescription"/);
```

- [ ] **Step 2: Run focused tests and verify RED**

Run: `npm test -- test/hot-sales-sync.test.ts test/tour-editor-state.test.ts test/tour-content.test.ts`

Expected: FAIL because projection fields and synchronization helpers are absent.

- [ ] **Step 3: Implement validated persistence synchronization**

Extend Tour normalization and the Tour editor. On Homepage publish, validate the draft against admin tours, publish the module, then synchronize membership and projection fields to affected Tour records. On Tour Library Update, save the Tour first and patch the Hot Sales module entry: append when `specialDeals` becomes true, update its values when present, remove it when false, and preserve all unrelated entries and module fields. Return a 409 conflict when a revision supplied by a stale Homepage draft no longer matches current promotion data.

- [ ] **Step 4: Run focused API and regression tests**

Run:

```bash
npm test -- test/hot-sales-sync.test.ts test/tour-editor-state.test.ts test/tour-content.test.ts test/admin-state.test.ts test/home-content.test.ts
npx eslint src/lib/hot-sales-sync.ts src/lib/supabase-home-content.ts src/lib/supabase-tours.ts src/app/api/admin/home-modules/'[id]'/route.ts src/app/api/admin/tours/'[slug]'/route.ts src/components/tour-editor.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit the persistence slice**

```bash
git add src/lib/hot-sales-sync.ts src/lib/supabase-home-content.ts src/lib/supabase-tours.ts src/app/api/admin/home-modules/'[id]'/route.ts src/app/api/admin/tours/'[slug]'/route.ts src/types/cms.ts src/lib/tour-editor-state.ts src/lib/tour-content.ts src/lib/create-empty-tour.ts src/components/tour-editor.tsx test/hot-sales-sync.test.ts test/tour-editor-state.test.ts test/tour-content.test.ts
git commit -m "feat: synchronize hot sales editing"
```

### Task 4: Homepage And Tour Detail Presentation

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/components/packages-section.tsx`
- Create: `src/components/packages-section.module.css`
- Modify: `src/components/tour/tour-detail-page.tsx`
- Modify: `src/components/tour/tour-detail-page.module.css`
- Modify: `src/lib/localized-content.ts`
- Test: `test/hot-sales-presentation.test.ts`
- Modify: `test/public-route-integrity.test.ts`

**Interfaces:**
- Consumes: published `hotSales` module content and `getPublishedHotSalePromotions`.
- Produces: existing `PackagesSection` rendered before `ToursSection` with the exact shared heading classes.
- Produces: localized active promotion block on tour details.

- [ ] **Step 1: Write failing public presentation tests**

Assert page ordering is `PackagesSection` then `ToursSection`, `PackagesSection` receives module content, and its heading markup uses `section-head`, `eyebrow`, and `section-title`. Assert price offers render an original-price strike and sale price, description-only offers do not strike the normal price, empty promotions return `null`, and tour detail source resolves promotion content.

```ts
assert.ok(homeSource.indexOf("<PackagesSection") < homeSource.indexOf("<ToursSection"));
assert.match(packagesSource, /className="section-head"/);
assert.match(packagesSource, /className="section-title"/);
assert.match(packagesSource, /<del/);
```

- [ ] **Step 2: Run the public test and verify RED**

Run: `npm test -- test/hot-sales-presentation.test.ts test/public-route-integrity.test.ts`

Expected: FAIL because ordering, module content, shared heading markup, and promotion prices are absent.

- [ ] **Step 3: Implement homepage rendering with exact shared typography**

Load `getHomeModule(modules, "hotSales").data`, move `PackagesSection` before `ToursSection`, and resolve only valid published promotions. Replace the current custom centered heading with the exact structure used by `ToursSection`, including the shared global classes. Render cards in module order with localized offer copy, a `<del>` original amount only for numeric discounts, and a prominent CAD sale amount.

- [ ] **Step 4: Implement tour detail promotion rendering**

Pass the published Hot Sales content into the tour detail page or resolve the matching promotion in its server entry point. Add a compact offer band near fares that uses the same price semantics as the homepage and hides when the tour has no active published promotion.

- [ ] **Step 5: Run focused tests and verify GREEN**

Run:

```bash
npm test -- test/hot-sales-presentation.test.ts test/public-route-integrity.test.ts test/localized-content.test.ts
npx eslint src/app/page.tsx src/components/packages-section.tsx src/components/tour/tour-detail-page.tsx
```

Expected: PASS.

- [ ] **Step 6: Commit the public slice**

```bash
git add src/app/page.tsx src/components/packages-section.tsx src/components/packages-section.module.css src/components/tour/tour-detail-page.tsx src/components/tour/tour-detail-page.module.css src/lib/localized-content.ts test/hot-sales-presentation.test.ts test/public-route-integrity.test.ts
git commit -m "feat: publish hot sales promotions"
```

### Task 5: Full Verification And Browser Review

**Files:**
- Modify only files required to repair verification findings.

- [ ] **Step 1: Run all automated checks**

```bash
npm test
npm run lint
npm run build
npm run verify:homepage
npm run verify:admin
```

Expected: all commands exit 0.

- [ ] **Step 2: Start the development server**

Run `npm run dev` and keep the returned session running on an available localhost port.

- [ ] **Step 3: Verify desktop and mobile public layouts**

Use browser screenshots at 1440x1000 and 390x844. Confirm Hot Sales is before Our Top Picks, both headings have identical computed font family/size/weight/line height, cards do not overlap or clip, original/sale prices remain legible, and description-only promotions do not show a false crossed-out price.

- [ ] **Step 4: Verify CMS workflow**

Open Homepage Hot Sales, add/reorder/remove a tour, edit bilingual copy, save a draft, and verify the public page remains unchanged. Publish and confirm the homepage and tour detail update. Edit one promotion in Tour Library, update it, reopen Homepage Hot Sales, and confirm synchronization.

- [ ] **Step 5: Inspect the final diff and commit repairs**

Run `git diff --check` and `git status --short`. Commit only Hot Sales repair files, leaving pre-existing unrelated changes untouched.

