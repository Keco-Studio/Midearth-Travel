# Homepage Tour Selection Synchronization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let editors manage Our Top Picks membership/order and a tour's single Explore by Month assignment from either Tour Library or the matching Homepage module, with atomic bidirectional synchronization.

**Architecture:** Add an ordered serialized slug list to `toursSection`, keep the existing monthly card data canonical for Explore by Month, and expose pure helpers that synchronize those module values with narrow Tour projection fields. A service-role Supabase RPC locks Homepage rows before Tour rows and atomically persists linked changes with optimistic revision checks; public components consume only published module data.

**Tech Stack:** Next.js 16.2.9 App Router, React 19.2.4, TypeScript, Ant Design/Pro Components, Supabase PostgREST RPC, Node test runner, CSS Modules/global admin CSS.

**Spec:** `docs/superpowers/specs/2026-11-26-homepage-tour-selection-sync-design.md`

## Global Constraints

- Read relevant Next.js 16.2.9 material in `node_modules/next/dist/docs/` before modifying routes, Client Components, or CSS.
- One tour may belong to zero or one Explore by Month month, never multiple months.
- Moving a tour to another month removes its old assignment and clears both old month-specific descriptions.
- Tour Library changes update published and draft linked module data immediately; Homepage Save Draft does not update Tours; Homepage Publish does.
- Homepage publishing may patch only the owned Tour fields: `specialOffer` for Our Top Picks, and `exploreMonth` plus `travelNewsPackage` for Explore by Month.
- Normal fares, Hot Sales, room pricing, itinerary, Tour status, and unrelated Homepage drafts must remain untouched.
- All linked writes require `SUPABASE_SERVICE_ROLE_KEY`, stable home-first/tour-second locking, optimistic revisions, and HTTP 409 on conflicts.
- Preserve the user's uncommitted room-pricing, payment/checkout, and itinerary changes. For shared files use `git add -p`; never stage a whole shared file without inspecting both index and working-tree hunks.
- Apply strict TDD: write one behavior test, run it and observe the expected failure, implement minimally, then rerun focused tests.

---

### Task 1: Top Picks And Single-Month Domain Model

**Files:**
- Create: `src/lib/top-picks.ts`
- Modify: `src/lib/explore-by-month.ts`
- Create: `src/lib/homepage-tour-selection-sync.ts`
- Modify: `src/data/cms-seed.ts`
- Test: `test/top-picks.test.ts`
- Modify: `test/explore-by-month.test.ts`
- Create: `test/homepage-tour-selection-sync.test.ts`
- Modify: `test/home-content.test.ts`

**Interfaces:**
- Produces: `TOP_PICKS_DATA_KEY = "selectedToursData"`.
- Produces: `hasTopPickSelection(content): boolean`, `parseTopPickSlugs(content): string[]`, `serializeTopPickSlugs(slugs): string`, `addTopPickSlug(slugs, slug): string[]`, `removeTopPickSlug(slugs, slug): string[]`, `moveTopPickSlug(slugs, slug, direction): string[]`, and `resolveTopPickTours(content, tours): Tour[]`.
- Produces: `EXPLORE_MONTH_KEYS`, `ExploreMonthKey`, `isExploreMonthKey(value)`, `findExploreMonthForTour(entries, slug)`, and `assignTourToExploreMonth(entries, slug, month: ExploreMonthKey | ""): MonthEntry[]`.
- Produces: `syncHomepageSelectionsFromTour({ topPicksContent, exploreContent, tour }): { topPicksContent; exploreContent }` and narrow Tour patch builders used by Task 4.

- [ ] **Step 1: Write failing Top Picks parsing and ordering tests**

Create `test/top-picks.test.ts` with literal expectations for malformed JSON, whitespace, duplicates, append, remove, and reorder:

```ts
assert.deepEqual(
  parseTopPickSlugs({ selectedToursData: '[" coast ","coast","cruise"]' }),
  ["coast", "cruise"],
);
assert.deepEqual(addTopPickSlug(["coast"], "cruise"), ["coast", "cruise"]);
assert.deepEqual(moveTopPickSlug(["coast", "cruise"], "cruise", "up"), ["cruise", "coast"]);
```

- [ ] **Step 2: Run the Top Picks test and verify RED**

Run: `node --experimental-strip-types --test test/top-picks.test.ts`

Expected: FAIL because `src/lib/top-picks.ts` does not exist.

- [ ] **Step 3: Implement the minimal Top Picks domain and seed field**

Implement normalization without throwing and add the hidden serialized field to the existing `toursSection` seed:

```ts
export const TOP_PICKS_DATA_KEY = "selectedToursData";

export function parseTopPickSlugs(content: ContentData): string[] {
  const value = content[TOP_PICKS_DATA_KEY];
  if (typeof value !== "string") return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return [];
    return [...new Set(parsed.flatMap((slug) =>
      typeof slug === "string" && slug.trim() ? [slug.trim()] : []
    ))];
  } catch {
    return [];
  }
}
```

Seed `selectedToursData` from `tours.filter((tour) => tour.featured).map((tour) => tour.slug)` so static fallback preserves current membership and order.

- [ ] **Step 4: Run focused Top Picks and seed tests and verify GREEN**

Run: `node --experimental-strip-types --test test/top-picks.test.ts test/home-content.test.ts`

Expected: PASS.

- [ ] **Step 5: Write failing single-month behavior tests**

Extend `test/explore-by-month.test.ts` to verify a move removes the old row, clears descriptions, and never duplicates the slug:

```ts
const moved = assignTourToExploreMonth(entries, "coast", "Jul");
assert.equal(findExploreMonthForTour(moved, "coast"), "Jul");
assert.equal(moved.flatMap((entry) => entry.destinations).filter((dest) => dest.tourSlug === "coast").length, 1);
assert.equal(moved.find((entry) => entry.month === "Jul")?.destinations[0]?.desc, "");
assert.equal(moved.find((entry) => entry.month === "Jul")?.destinations[0]?.localizedDesc, "");
```

Also verify reassigning to the same month preserves both descriptions and passing `""` removes the assignment.

- [ ] **Step 6: Run the Explore by Month test and verify RED**

Run: `node --experimental-strip-types --test test/explore-by-month.test.ts`

Expected: FAIL because the month-key and assignment helpers are not exported.

- [ ] **Step 7: Implement month keys and assignment helpers**

Export the twelve keys and make `assignTourToExploreMonth` remove the slug from every month before optionally appending one new blank linked destination. If the target month equals the existing month, return normalized entries without replacing the existing destination so descriptions survive.

- [ ] **Step 8: Write failing cross-module synchronization tests**

Create `test/homepage-tour-selection-sync.test.ts` covering:

```ts
const linked = syncHomepageSelectionsFromTour({
  topPicksContent,
  exploreContent,
  tour: { ...tour, specialOffer: true, exploreMonth: "Aug", travelNewsPackage: true },
});
assert.deepEqual(parseTopPickSlugs(linked.topPicksContent), ["existing", tour.slug]);
assert.equal(findExploreMonthForTour(getExploreByMonthEntries(linked.exploreContent), tour.slug), "Aug");
```

Add literal assertions that unrelated Top Picks slugs, unrelated month cards, and unrelated descriptions remain unchanged. Add patch-builder tests proving only `specialOffer` or only `exploreMonth`/`travelNewsPackage` appear in each patch.

- [ ] **Step 9: Run synchronization tests and verify RED**

Run: `node --experimental-strip-types --test test/homepage-tour-selection-sync.test.ts`

Expected: FAIL because the synchronization module does not exist.

- [ ] **Step 10: Implement pure synchronization helpers and verify GREEN**

Implement the signatures from this task using `parseTopPickSlugs`, `getExploreByMonthEntries`, and `assignTourToExploreMonth`, then run:

```bash
node --experimental-strip-types --test test/top-picks.test.ts test/explore-by-month.test.ts test/homepage-tour-selection-sync.test.ts test/home-content.test.ts
```

Expected: PASS.

- [ ] **Step 11: Commit the domain slice**

```bash
git add src/lib/top-picks.ts src/lib/explore-by-month.ts src/lib/homepage-tour-selection-sync.ts src/data/cms-seed.ts test/top-picks.test.ts test/explore-by-month.test.ts test/homepage-tour-selection-sync.test.ts test/home-content.test.ts
git diff --cached --check
git commit -m "feat: add linked homepage tour selections"
```

### Task 2: Tour Record Month Projection And Editor Controls

**Files:**
- Modify: `src/types/cms.ts`
- Modify: `src/lib/create-empty-tour.ts`
- Modify: `src/lib/tour-editor-state.ts`
- Modify: `src/lib/tour-content.ts`
- Modify: `src/lib/tour-import-mapper.ts`
- Modify: `src/lib/travel-data-mapper.ts`
- Modify: `src/components/tour-editor.tsx`
- Modify: `test/create-empty-tour.test.ts`
- Modify: `test/tour-editor-state.test.ts`
- Modify: `test/tour-content.test.ts`
- Modify: `test/tour-import-mapper.test.ts`
- Modify: `test/travel-data-mapper.test.ts`
- Modify: `test/tour-editor-layout.test.ts`

**Interfaces:**
- Consumes: `ExploreMonthKey`, `EXPLORE_MONTH_KEYS`, and `isExploreMonthKey` from Task 1.
- Produces: required `TourRecord.exploreMonth: ExploreMonthKey | ""`.
- Produces: Tour editor values where `travelNewsPackage === Boolean(exploreMonth)` at the validation/save boundary.

- [ ] **Step 1: Write failing Tour normalization tests**

Add assertions that a legacy record defaults `exploreMonth` to `""`, a valid `"Sep"` survives parsing, an invalid month is rejected, and `createEmptyTour()` starts unassigned:

```ts
assert.equal(parsedLegacy.exploreMonth, "");
assert.equal(parsedSeptember.exploreMonth, "Sep");
assert.equal(createEmptyTour().exploreMonth, "");
```

- [ ] **Step 2: Run model tests and verify RED**

Run: `node --experimental-strip-types --test test/create-empty-tour.test.ts test/tour-editor-state.test.ts test/tour-content.test.ts test/tour-import-mapper.test.ts test/travel-data-mapper.test.ts`

Expected: FAIL because `exploreMonth` is absent.

- [ ] **Step 3: Add and normalize the Tour projection**

Add `exploreMonth` to `TourRecord`, empty-tour defaults, editor persisted keys, Tour row normalization, seed mapping, import mapping, and public mapping compatibility. At the editor validation boundary normalize:

```ts
const exploreMonth = isExploreMonthKey(candidate.exploreMonth)
  ? candidate.exploreMonth
  : "";
return {
  ...candidate,
  exploreMonth,
  travelNewsPackage: Boolean(exploreMonth),
};
```

An imported legacy `Explore by Month = true` does not invent a month and therefore remains `exploreMonth: ""`.

- [ ] **Step 4: Run model tests and verify GREEN**

Run the Step 2 command. Expected: PASS.

- [ ] **Step 5: Write a failing Tour editor contract test**

Update `test/tour-editor-layout.test.ts` to require a select bound to `exploreMonth`, all twelve options, the `Not shown` option, and linked help text. Assert the old `ToggleField name="travelNewsPackage"` is absent.

- [ ] **Step 6: Run the editor test and verify RED**

Run: `node --experimental-strip-types --test test/tour-editor-layout.test.ts`

Expected: FAIL because the old Explore by Month toggle still renders.

- [ ] **Step 7: Replace the toggle with a single month selector**

Render an Ant Design `Select` using:

```ts
const exploreMonthOptions = [
  { value: "", label: "Not shown" },
  ...EXPLORE_MONTH_KEYS.map((value) => ({ value, label: EXPLORE_MONTH_LABELS[value] })),
];
```

Update the Top Picks and Hot Sale tooltips to identify their linked Homepage modules. Do not expose `travelNewsPackage` as a second control.

- [ ] **Step 8: Run editor tests and lint touched Tour files**

```bash
node --experimental-strip-types --test test/tour-editor-layout.test.ts test/tour-editor-state.test.ts
npx eslint src/components/tour-editor.tsx src/lib/tour-editor-state.ts src/lib/explore-by-month.ts
```

Expected: PASS with zero errors.

- [ ] **Step 9: Commit only this feature's hunks**

Because these files contain unrelated user changes, use `git add -p` for every shared file, inspect `git diff --cached`, and ensure no room-pricing, payment, checkout, or itinerary hunks are staged before committing:

```bash
git add -p src/types/cms.ts src/lib/create-empty-tour.ts src/lib/tour-editor-state.ts src/lib/tour-content.ts src/lib/tour-import-mapper.ts src/lib/travel-data-mapper.ts src/components/tour-editor.tsx test/create-empty-tour.test.ts test/tour-content.test.ts test/tour-import-mapper.test.ts test/travel-data-mapper.test.ts test/tour-editor-layout.test.ts
git add test/tour-editor-state.test.ts
git diff --cached --check
git commit -m "feat: select one explore month per tour"
```

### Task 3: Homepage Editors And Public Our Top Picks Order

**Files:**
- Create: `src/components/top-picks-editor.tsx`
- Modify: `src/components/home-module-editor.tsx`
- Modify: `src/components/explore-by-month-editor.tsx`
- Modify: `src/components/tours-section.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/app/admin/admin.css`
- Create: `test/top-picks-editor.test.ts`
- Modify: `test/explore-by-month.test.ts`
- Create: `test/top-picks-presentation.test.ts`

**Interfaces:**
- Consumes: Top Picks and Explore helpers from Task 1.
- Produces: `TopPicksEditor({ content, tours, onChange })`.
- Updates: `ToursSection` resolves the ordered published slug list and falls back to `tour.featured` only when the serialized key is absent.

- [ ] **Step 1: Write failing Top Picks editor tests**

Assert the raw `selectedToursData` field is hidden, `TopPicksEditor` renders for `module.id === "toursSection"`, selected tours can be added/removed/reordered, and the old “Tour Library only” paragraph is gone.

- [ ] **Step 2: Run the editor test and verify RED**

Run: `node --experimental-strip-types --test test/top-picks-editor.test.ts`

Expected: FAIL because the component does not exist.

- [ ] **Step 3: Implement the selected-tour editor**

Follow the Hot Sales list structure without pricing fields. Commit each list mutation through:

```ts
onChange(TOP_PICKS_DATA_KEY, serializeTopPickSlugs(nextSlugs));
```

Show image, localized-independent CMS title, region, and status. Disable options already selected and provide accessible up/down/delete icon buttons.

- [ ] **Step 4: Write failing Explore editor duplicate/move tests**

Test the pure selection handler extracted from the component: selecting a slug already in `Jun` from an `Aug` row removes the June assignment, creates one August assignment, and returns blank English/Chinese descriptions. Test that all twelve selectors expose the currently assigned month in the option label.

- [ ] **Step 5: Run Explore editor tests and verify RED**

Run: `node --experimental-strip-types --test test/explore-by-month.test.ts`

Expected: FAIL because the editor currently changes only the selected row and can duplicate a tour.

- [ ] **Step 6: Enforce one-month moves in the Homepage editor**

Use `assignTourToExploreMonth` for selector changes instead of mutating one destination in isolation. Preserve direct description edits for the current assignment, and label assigned options as `Tour title — currently July`.

- [ ] **Step 7: Write failing public ordering tests**

Create `test/top-picks-presentation.test.ts` with a literal ordered list and tours in a different input order. Assert the resolver returns the list order, excludes an unpublished tour, and uses legacy `featured` ordering only when the key is missing rather than present as `[]`.

- [ ] **Step 8: Run presentation tests and verify RED**

Run: `node --experimental-strip-types --test test/top-picks-presentation.test.ts`

Expected: FAIL because `ToursSection` still filters `tour.featured`.

- [ ] **Step 9: Implement published module ordering**

Pass `toursSection` content to the resolver already consumed by `ToursSection`. Resolve slugs through a tour map, keep serialized order, and omit missing/unpublished tours. Preserve the exact existing TourCard and section-title markup.

- [ ] **Step 10: Run focused UI tests and lint**

```bash
node --experimental-strip-types --test test/top-picks-editor.test.ts test/explore-by-month.test.ts test/top-picks-presentation.test.ts
npx eslint src/components/top-picks-editor.tsx src/components/home-module-editor.tsx src/components/explore-by-month-editor.tsx src/components/tours-section.tsx src/app/page.tsx
```

Expected: PASS with zero errors.

- [ ] **Step 11: Commit the Homepage UI slice**

```bash
git add src/components/top-picks-editor.tsx src/components/home-module-editor.tsx src/components/explore-by-month-editor.tsx src/components/tours-section.tsx src/app/page.tsx src/app/admin/admin.css test/top-picks-editor.test.ts test/explore-by-month.test.ts test/top-picks-presentation.test.ts
git diff --cached --check
git commit -m "feat: edit linked homepage tour selections"
```

### Task 4: Atomic Bidirectional Persistence

**Files:**
- Create: `supabase/migrations/202611260002_homepage_tour_selection_sync.sql`
- Modify: `src/lib/supabase-home-content.ts`
- Modify: `src/app/api/admin/home-modules/[id]/route.ts`
- Modify: `src/app/api/admin/tours/[slug]/route.ts`
- Modify: `src/components/admin-shell.tsx`
- Modify: `src/lib/admin-state.ts`
- Create: `test/homepage-tour-selection-persistence.test.ts`
- Modify: `test/homepage-tour-selection-sync.test.ts`
- Modify: `test/admin-state.test.ts`

**Interfaces:**
- Produces RPC: `public.persist_linked_homepage_tour_state(p_home_modules jsonb, p_tours jsonb)`.
- Produces server functions: `saveTourAndSyncHomepageSelections(record)`, `saveLinkedSelectionModuleDraft(module, expectedUpdatedAt)`, and `publishLinkedSelectionModule(id, expectedUpdatedAt, tours)`.
- Produces typed `HomepageTourSelectionConflictError` mapped to HTTP 409.

- [ ] **Step 1: Write failing persistence contract tests**

Create source-level boundary tests requiring:

```ts
assert.match(migration, /persist_linked_homepage_tour_state/i);
assert.match(migration, /order by[^;]*module_id/i);
assert.match(migration, /order by[^;]*slug/i);
assert.match(migration, /grant execute[^;]*to service_role/i);
assert.doesNotMatch(migration, /grant execute[^;]*(anon|authenticated)/i);
assert.match(homeRoute, /HomepageTourSelectionConflictError[\s\S]{0,100}409/);
```

Also require projection operations to merge JSON with `||` and complete Tour saves to compare `expected_updated_at` before replacing the full Tour row.

- [ ] **Step 2: Run persistence tests and verify RED**

Run: `node --experimental-strip-types --test test/homepage-tour-selection-persistence.test.ts`

Expected: FAIL because the migration and generalized persistence functions do not exist.

- [ ] **Step 3: Implement the service-role transaction migration**

The RPC accepts arrays of objects shaped as:

```ts
type LinkedHomeOperation = {
  row: HomeModuleRow;
  expected_updated_at: string;
};

type LinkedTourOperation =
  | { kind: "tour"; slug: string; status: ContentStatus; data: TourRecord; updated_at: string; expected_updated_at: string }
  | { kind: "projection"; slug: string; data: Partial<TourRecord>; updated_at: string };
```

Lock every existing Homepage row sorted by `row.id`, compare the expected revision, then lock/update Tours sorted by slug. Raise `HOMEPAGE_SELECTION_CONFLICT`, `HOMEPAGE_SELECTION_TOUR_CONFLICT`, or missing-row errors and return `{ home_modules, tours }`.

- [ ] **Step 4: Implement server orchestration for Tour Library saves**

Replace `saveTourAndSyncHotSales` at the Tour route boundary with `saveTourAndSyncHomepageSelections`. It loads Hot Sales, `toursSection`, and `exploreByMonth`; patches both published and draft data for only the saved tour; persists one complete Tour operation plus all changed module rows; and returns `linkedModules` containing all three refreshed modules.

- [ ] **Step 5: Implement linked Homepage Save Draft and Publish**

Route `toursSection` and `exploreByMonth` through revision-required helpers. Save Draft persists only one Home row through the RPC. Publish validates the draft, publishes it, creates projection-only Tour patches for every admin Tour, and persists Home plus patches atomically. Keep Hot Sales behavior and validation intact.

- [ ] **Step 6: Update client state merging**

Make the Tour update response merge all `linkedModules` into admin state, preserving unsaved data for a module the editor currently has dirty. Make Homepage save/publish consume returned `tours` and linked module revisions just as Hot Sales does.

- [ ] **Step 7: Run persistence and admin-state tests**

```bash
node --experimental-strip-types --test test/homepage-tour-selection-persistence.test.ts test/homepage-tour-selection-sync.test.ts test/admin-state.test.ts test/hot-sales-persistence.test.ts test/hot-sales-sync.test.ts
```

Expected: PASS.

- [ ] **Step 8: Lint the persistence boundary**

```bash
npx eslint src/lib/supabase-home-content.ts src/app/api/admin/home-modules/'[id]'/route.ts src/app/api/admin/tours/'[slug]'/route.ts src/components/admin-shell.tsx src/lib/admin-state.ts
```

Expected: zero errors.

- [ ] **Step 9: Commit the atomic persistence slice**

```bash
git add supabase/migrations/202611260002_homepage_tour_selection_sync.sql src/lib/supabase-home-content.ts src/app/api/admin/home-modules/'[id]'/route.ts src/app/api/admin/tours/'[slug]'/route.ts src/components/admin-shell.tsx src/lib/admin-state.ts test/homepage-tour-selection-persistence.test.ts test/homepage-tour-selection-sync.test.ts test/admin-state.test.ts
git diff --cached --check
git commit -m "feat: synchronize homepage tour selections"
```

### Task 5: Legacy Migration And Compatibility

**Files:**
- Modify: `supabase/migrations/202611260002_homepage_tour_selection_sync.sql`
- Modify: `src/lib/supabase-home-content.ts`
- Modify: `test/homepage-tour-selection-persistence.test.ts`
- Modify: `test/home-content.test.ts`

**Interfaces:**
- Consumes the Task 1 parser/serializer and Task 4 RPC.
- Produces idempotent backfill of `toursSection.selectedToursData`, `exploreMonth`, and normalized `travelNewsPackage`.

- [ ] **Step 1: Write failing migration tests**

Require the migration to update Top Picks only when `selectedToursData` is absent, preserve an existing explicit empty list, parse published `monthsData`, choose the first month in calendar order for a duplicate legacy slug, and set unmatched legacy boolean-only Tours to `exploreMonth: ""` and `travelNewsPackage: false`.

- [ ] **Step 2: Run migration tests and verify RED**

Run: `node --experimental-strip-types --test test/homepage-tour-selection-persistence.test.ts test/home-content.test.ts`

Expected: FAIL because the backfill statements and application fallback are absent.

- [ ] **Step 3: Add idempotent SQL and application fallback migration**

In SQL, patch JSON keys with `jsonb_set`, never replace whole `published_data`, `draft_data`, or Tour `data`. In application startup, detect a stored `toursSection` row whose published data lacks `selectedToursData`, derive ordered slugs from loaded Tours, and persist the missing key without changing module status or unrelated draft fields.

- [ ] **Step 4: Run compatibility tests and verify GREEN**

```bash
node --experimental-strip-types --test test/homepage-tour-selection-persistence.test.ts test/home-content.test.ts test/top-picks.test.ts test/explore-by-month.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit migration repairs**

```bash
git add supabase/migrations/202611260002_homepage_tour_selection_sync.sql src/lib/supabase-home-content.ts test/homepage-tour-selection-persistence.test.ts test/home-content.test.ts
git diff --cached --check
git commit -m "feat: migrate linked homepage selections"
```

### Task 6: Full Verification And Browser Workflows

**Files:**
- Modify only files needed to repair findings from these checks.

**Interfaces:**
- Verifies all interfaces produced in Tasks 1–5.

- [ ] **Step 1: Run the complete automated suite**

```bash
npm test
npm run lint
npm run build
git diff --check
```

Expected: tests report zero failures, lint reports zero errors, build exits 0, and diff check emits no output.

- [ ] **Step 2: Verify Our Top Picks in both CMS entry points**

At desktop width, turn on one Tour's Our Top Picks switch in Tour Library and save. Reopen `Homepage → Our Top Picks`; confirm the Tour appears at the end. Reorder it, publish, return to Tour Library, and confirm membership remains on. Remove it in Homepage, publish, and confirm the Tour switch turns off.

- [ ] **Step 3: Verify single-month moves in both CMS entry points**

Assign one Tour to June in Tour Library and save. Confirm it appears only under June in `Homepage → Explore by Month`. Add English and Chinese descriptions and publish. Change the Tour to August in Tour Library; confirm June no longer contains it, August contains it once, and both descriptions are blank. Move it to September in Homepage, publish, and confirm Tour Library shows September.

- [ ] **Step 4: Verify public homepage and responsive layout**

At 1440x1000 and 390x844, confirm Our Top Picks follows the published explicit order, Explore by Month contains no duplicate Tour, Hot Sales remains before Our Top Picks, headings and cards do not overflow, and no horizontal document scrollbar appears.

- [ ] **Step 5: Verify stale-editor conflicts**

Open the same Tour or linked Homepage module in two browser contexts. Save a linked selection in the first, then save stale data in the second. Confirm the second receives a conflict message, does not overwrite the first, and retains its local unsaved form values.

- [ ] **Step 6: Verify the staged feature tree in isolation**

Create a detached temporary worktree from `git write-tree`/`git commit-tree`, link the existing `node_modules`, copy `.env.local`, and run `npm test`, `npm run lint`, and `npm run build` there. Remove only the exact temporary worktree after it is clean.

- [ ] **Step 7: Inspect and commit only repair hunks**

```bash
git diff --cached --check
git diff --cached --stat
git status --short
```

Confirm the staged diff has no room-pricing, payment/checkout, or itinerary changes. Commit repairs with `fix: finalize homepage selection sync`; do not push or merge.
