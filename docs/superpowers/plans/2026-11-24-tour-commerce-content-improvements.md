# Tour Commerce and Content Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add persistent public tour ordering, optional booking room counts, readable multiline policies, localized add-on details, and consistent `CAD $` price presentation.

**Architecture:** Keep tour order and add-on details in the canonical `TourRecord` JSON, expose a validated batch reorder endpoint, and sort records at the shared merge boundary so every consumer inherits the same default order. Carry optional rooms through the existing booking validation/persistence/email pipeline with one nullable database column, and centralize CAD display formatting in a pure helper used by all public price surfaces.

**Tech Stack:** Next.js 16.2.9 App Router, React 19, TypeScript, Ant Design/ProTable, Supabase REST/Postgres, Stripe, Node test runner, CSS Modules.

**Spec:** `docs/superpowers/specs/2026-11-24-tour-commerce-content-improvements-design.md`

## Global Constraints

- Read the relevant guides in `node_modules/next/dist/docs/` before changing Next.js code; do not rely on remembered Next.js conventions.
- Room count is optional, must be a positive integer when supplied, has no maximum, and never changes pricing.
- All visible tour-commerce prices use the exact `CAD $` prefix; Stripe remains `cad`.
- Existing tour rows without order/add-on detail fields and booking rows without rooms remain valid.
- Follow RED/GREEN TDD for each behavior and do not modify unrelated user work.

---

### Task 1: Stable Tour Order Domain

**Files:**
- Create: `src/lib/tour-order.ts`
- Modify: `src/types/cms.ts`
- Modify: `src/lib/tour-content.ts`
- Modify: `src/lib/create-empty-tour.ts`
- Modify: `src/components/tours-workspace.tsx`
- Create: `test/tour-order.test.ts`
- Modify: `test/create-empty-tour.test.ts`
- Modify: `test/tour-content.test.ts`

**Interfaces:**
- Produces: `orderTourRecords(records: readonly TourRecord[]): TourRecord[]`
- Produces: `applyTourSlugOrder(records: readonly TourRecord[], orderedSlugs: readonly string[]): TourRecord[]`
- Produces: `moveTourRecord(records: readonly TourRecord[], slug: string, offset: -1 | 1): TourRecord[]`
- Produces: optional `TourRecord.displayOrder?: number` for legacy compatibility; normalized records receive contiguous values.

- [ ] **Step 1: Read the local Next.js guides before any Next.js implementation**

Read completely:

```bash
sed -n '1,260p' node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md
sed -n '1,320p' node_modules/next/dist/docs/01-app/01-getting-started/07-mutating-data.md
sed -n '1,280p' node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md
sed -n '1,260p' node_modules/next/dist/docs/01-app/02-guides/forms.md
```

- [ ] **Step 2: Write failing order-domain tests**

Create tests that prove legacy order is stable, explicit orders win, exact slug sets are required, moves are bounded, and new records accept an explicit final order:

```ts
test("orders explicit positions before legacy records with stable ties", () => {
  const records = [
    { ...seed, slug: "legacy-a", displayOrder: undefined },
    { ...seed, slug: "second", displayOrder: 1 },
    { ...seed, slug: "first", displayOrder: 0 },
    { ...seed, slug: "legacy-b", displayOrder: undefined },
  ];
  assert.deepEqual(orderTourRecords(records).map(({ slug }) => slug), [
    "first", "second", "legacy-a", "legacy-b",
  ]);
});

test("applies a complete slug order as contiguous values", () => {
  const ordered = applyTourSlugOrder([a, b], [b.slug, a.slug]);
  assert.deepEqual(ordered.map(({ slug, displayOrder }) => ({ slug, displayOrder })), [
    { slug: b.slug, displayOrder: 0 },
    { slug: a.slug, displayOrder: 1 },
  ]);
  assert.throws(() => applyTourSlugOrder([a, b], [a.slug]), /every tour/i);
});
```

Add an assertion that `createEmptyTourRecord([], 7).displayOrder === 7`, and a merge assertion that explicit stored order controls `mergeTourRows` output.

- [ ] **Step 3: Run focused tests and verify RED**

Run:

```bash
npm test -- test/tour-order.test.ts test/create-empty-tour.test.ts test/tour-content.test.ts
```

Expected: FAIL because `tour-order.ts`, `displayOrder`, and the new factory parameter do not exist.

- [ ] **Step 4: Implement minimal ordering**

Implement pure immutable helpers. `orderTourRecords` uses original index as a stable fallback, places finite non-negative explicit orders first, and returns records with contiguous `displayOrder` values. `applyTourSlugOrder` rejects duplicates, missing slugs, and unknown slugs. `moveTourRecord` first normalizes order and returns unchanged order for a boundary move.

Update `mergeTourRows` to call `orderTourRecords`, permit missing `displayOrder` in stored legacy rows, and give new tours the order passed to `createEmptyTourRecord`. Change `openNewTour` to append the draft with `displayOrder` equal to the current record count.

- [ ] **Step 5: Run focused tests and verify GREEN**

Run the Step 3 command. Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/tour-order.ts src/types/cms.ts src/lib/tour-content.ts src/lib/create-empty-tour.ts src/components/tours-workspace.tsx test/tour-order.test.ts test/create-empty-tour.test.ts test/tour-content.test.ts
git commit -m "feat: add stable tour display ordering"
```

### Task 2: Atomic Tour Library Reordering

**Files:**
- Modify: `src/lib/supabase-tours.ts`
- Create: `src/app/api/admin/tours/order/route.ts`
- Modify: `src/components/tours-workspace.tsx`
- Modify: `src/app/admin/admin.css`
- Create: `test/tour-library-ordering.test.ts`

**Interfaces:**
- Consumes: `applyTourSlugOrder` from Task 1.
- Produces: `saveTourOrder(orderedSlugs: readonly string[]): Promise<TourRecord[]>`.
- Produces: authenticated `PUT /api/admin/tours/order` accepting `{ orderedSlugs: string[] }` and returning `{ tours: TourRecord[] }`.

- [ ] **Step 1: Write failing route and UI contract tests**

Assert that the server helper applies a complete order and upserts all rows, the route calls `assertAdminRequest`, and the workspace renders `ArrowUpOutlined`/`ArrowDownOutlined`, disables boundary controls, calls `/api/admin/tours/order`, and restores the previous records inside its failure path.

```ts
test("Tour Library persists a complete manual order", () => {
  assert.match(workspaceSource, /\/api\/admin\/tours\/order/);
  assert.match(workspaceSource, /ArrowUpOutlined/);
  assert.match(workspaceSource, /ArrowDownOutlined/);
  assert.match(workspaceSource, /setTourState\(previousState\)/);
});
```

- [ ] **Step 2: Run the new test and verify RED**

Run `npm test -- test/tour-library-ordering.test.ts`. Expected: FAIL because the route and controls are absent.

- [ ] **Step 3: Implement batch persistence and optimistic UI**

Add `saveTourOrder` using `ensureTourRows`, `mergeTourRows`, `applyTourSlugOrder`, and one `upsertTourRows` request. The route must reject non-array payloads via the domain validation, revalidate public routes after success, and return status 400 for invalid orders.

Add an `Order` column with accessible move buttons. Snapshot the full `TourWorkspaceState`, optimistically apply the move, disable all order controls while saving, replace state with returned records on success, and restore the snapshot plus show an error on failure. Add focused spacing styles in `admin.css`.

- [ ] **Step 4: Run focused and regression tests**

Run:

```bash
npm test -- test/tour-library-ordering.test.ts test/tour-library-horizontal-scroll.test.ts test/tour-content.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/supabase-tours.ts src/app/api/admin/tours/order/route.ts src/components/tours-workspace.tsx src/app/admin/admin.css test/tour-library-ordering.test.ts
git commit -m "feat: persist Tour Library display order"
```

### Task 3: Optional Room Count End to End

**Files:**
- Create: `supabase/migrations/202611240001_booking_room_count.sql`
- Modify: `src/types/cms.ts`
- Modify: `src/lib/payment-domain.ts`
- Modify: `src/lib/tour-booking-request.ts`
- Modify: `src/lib/booking-records.ts`
- Modify: `src/lib/supabase-bookings.ts`
- Modify: `src/components/tour/tour-booking-page.tsx`
- Modify: `src/components/tour/tour-booking-page.module.css`
- Modify: `src/components/bookings-workspace.tsx`
- Modify: `src/lib/booking-confirmation-template.ts`
- Modify: `src/lib/booking-confirmation-delivery.ts`
- Modify: `src/data/cms-seed.ts`
- Modify: `test/tour-booking.test.ts`
- Modify: `test/booking-confirmation-persistence.test.ts`
- Modify: `test/booking-confirmation-template.test.ts`
- Modify: `test/booking-confirmation-delivery.test.ts`
- Modify: `test/bookings-workspace-table.test.ts`

**Interfaces:**
- Produces: `TourBookingInput.rooms?: number`, `BookingRecord.rooms?: number`, `BookingRow.room_count?: number | null`.
- Produces: nullable Postgres `bookings.room_count integer check (room_count >= 1)`.
- Produces: optional `rooms?: number` in `BookingConfirmationRenderInput`.

- [ ] **Step 1: Write failing validation and row-mapping tests**

Extend the existing valid booking assertion with `rooms: "3"` producing `rooms: 3`. Add cases for blank/omitted rooms producing `undefined`, and `"0"`, `"1.5"`, or negative values throwing `/rooms/i`. Assert `bookingToRow` and `rowToBooking` round-trip `room_count`, and the migration contains the nullable positive-integer column.

- [ ] **Step 2: Write failing UI and email tests**

Assert that the booking source includes localized `rooms` content, `id="rooms"`, and no `max` attribute. Add confirmation template assertions that English renders `Rooms: 3`, Chinese renders `房间数: 3`, and omitted rooms produce no Rooms fact. Assert the CMS details panel conditionally renders `booking.rooms`.

- [ ] **Step 3: Run focused tests and verify RED**

Run:

```bash
npm test -- test/tour-booking.test.ts test/booking-confirmation-persistence.test.ts test/booking-confirmation-template.test.ts test/booking-confirmation-delivery.test.ts test/bookings-workspace-table.test.ts
```

Expected: FAIL because rooms are absent.

- [ ] **Step 4: Implement request, persistence, UI, and email flow**

Parse rooms as optional trimmed input; blank maps to `undefined`, populated values require a positive integer. Store it in `room_count`, append `Rooms: N` to generated booking notes only when supplied, and pass it through paid-confirmation delivery without making historical bookings fail.

Add `rooms: ""` to booking form state, render the third same-style numeric field with no `max`, include it in review only when present, and add localized booking-page seed labels (`Rooms` / `房间数`). Add a conditional Rooms item to CMS booking details and the email facts.

- [ ] **Step 5: Run focused tests and verify GREEN**

Run the Step 3 command. Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/202611240001_booking_room_count.sql src/types/cms.ts src/lib/payment-domain.ts src/lib/tour-booking-request.ts src/lib/booking-records.ts src/lib/supabase-bookings.ts src/components/tour/tour-booking-page.tsx src/components/tour/tour-booking-page.module.css src/components/bookings-workspace.tsx src/lib/booking-confirmation-template.ts src/lib/booking-confirmation-delivery.ts src/data/cms-seed.ts test/tour-booking.test.ts test/booking-confirmation-persistence.test.ts test/booking-confirmation-template.test.ts test/booking-confirmation-delivery.test.ts test/bookings-workspace-table.test.ts
git commit -m "feat: collect optional booking room counts"
```

### Task 4: Localized Add-on Details

**Files:**
- Modify: `src/lib/tour-add-ons.ts`
- Modify: `src/lib/tour-content.ts`
- Modify: `src/lib/tour-editor-state.ts`
- Modify: `src/components/tour-editor.tsx`
- Modify: `src/components/tour/tour-booking-page.tsx`
- Modify: `src/components/tour/tour-booking-page.module.css`
- Modify: `test/tour-add-ons.test.ts`
- Modify: `test/tour-content.test.ts`
- Modify: `test/tour-editor-layout.test.ts`

**Interfaces:**
- Produces: `TourAddOn.description: string` and `TourAddOn.localizedDescription: string`, normalized to empty strings for legacy records.

- [ ] **Step 1: Write failing compatibility and rendering tests**

Add a legacy row test whose add-on lacks detail fields and assert both normalize to `""`. Add source-level editor assertions for form paths `[name, "description"]` and `[name, "localizedDescription"]`, and booking-page assertions that `getLocalizedTourValue` selects the detail next to `item.name`.

- [ ] **Step 2: Run focused tests and verify RED**

Run `npm test -- test/tour-add-ons.test.ts test/tour-content.test.ts test/tour-editor-layout.test.ts`. Expected: FAIL on missing fields and controls.

- [ ] **Step 3: Implement localized descriptions**

Extend the type, deep normalization, editor initial/save mapping, cloning, and new-item default. Add paired English/Chinese text inputs after names. Render the selected detail in a subdued span adjacent to the add-on name, omitting the span when empty. Add responsive wrapping styles without changing selection or checkout payloads.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run the Step 2 command. Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/tour-add-ons.ts src/lib/tour-content.ts src/lib/tour-editor-state.ts src/components/tour-editor.tsx src/components/tour/tour-booking-page.tsx src/components/tour/tour-booking-page.module.css test/tour-add-ons.test.ts test/tour-content.test.ts test/tour-editor-layout.test.ts
git commit -m "feat: add localized tour add-on details"
```

### Task 5: Readable Multiline Policy Content

**Files:**
- Modify: `src/components/tour/tour-detail.tsx`
- Modify: `src/components/tour/tour-detail.module.css`
- Modify: `test/tour-content.test.ts`

**Interfaces:**
- Consumes: existing plain localized `TourPolicy.content` values.
- Produces: `.policyContent` presentation contract with preserved line breaks and safe long-content wrapping.

- [ ] **Step 1: Write a failing presentation test**

Assert the policy body uses `styles.policyContent`, and the CSS class includes `white-space: pre-wrap`, `overflow-wrap: anywhere`, and a relaxed line height.

- [ ] **Step 2: Run and verify RED**

Run `npm test -- test/tour-content.test.ts`. Expected: FAIL because policy content has no dedicated style.

- [ ] **Step 3: Implement the policy content class**

Replace the inline utility-only body class with the CSS Module class while retaining muted text color and font size. Render the localized string as text, not HTML.

- [ ] **Step 4: Run and verify GREEN**

Run `npm test -- test/tour-content.test.ts`. Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/tour/tour-detail.tsx src/components/tour/tour-detail.module.css test/tour-content.test.ts
git commit -m "fix: preserve tour policy line breaks"
```

### Task 6: Consistent CAD Price Presentation

**Files:**
- Create: `src/lib/cad-price.ts`
- Modify: `src/data/tours.ts`
- Modify: `src/data/tour-filters.ts`
- Modify: `src/components/tour/tour-detail.tsx`
- Modify: `src/components/tour/tour-booking-page.tsx`
- Modify: `src/components/tour-editor.tsx`
- Create: `test/cad-price.test.ts`
- Modify: `test/tour-filters.test.ts`
- Modify: `test/tour-booking.test.ts`
- Modify: `test/tour-content.test.ts`

**Interfaces:**
- Produces: `formatCadAmount(amount: number): string`.
- Produces: `formatCadPrice(value: string): string` returning non-price copy unchanged.
- Produces: `formatCadCents(cents: number): string`.

- [ ] **Step 1: Write failing formatter tests**

```ts
test("formats Canadian-dollar display values consistently", () => {
  assert.equal(formatCadPrice("$1,699"), "CAD $1,699.00");
  assert.equal(formatCadPrice("969"), "CAD $969.00");
  assert.equal(formatCadCents(4100), "CAD $41.00");
  assert.equal(formatCadPrice("Call for quote"), "Call for quote");
});
```

Add source assertions that the tour fare table and booking package/tax/add-on/total displays call these helpers. Update tour filter expectations from `from $...` to `from CAD $...`.

- [ ] **Step 2: Run focused tests and verify RED**

Run:

```bash
npm test -- test/cad-price.test.ts test/tour-filters.test.ts test/tour-booking.test.ts test/tour-content.test.ts
```

Expected: FAIL because the formatter and CAD-prefixed output do not exist.

- [ ] **Step 3: Implement and adopt the formatter**

Parse only complete existing money strings after removing optional `CAD`, `$`, commas, and surrounding whitespace. Format finite values with `en-CA`, two fractional digits, and the literal `CAD $` prefix. Leave non-price text unchanged.

Use the helper in lowest-price labels, tour fare tables, booking package fare, tax, add-on unit price, total button, and any other public tour-commerce price output found by `rg`. Update CMS fare labels to `price (CAD)` while leaving stored values and checkout parsing unchanged.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run the Step 2 command. Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/cad-price.ts src/data/tours.ts src/data/tour-filters.ts src/components/tour/tour-detail.tsx src/components/tour/tour-booking-page.tsx src/components/tour-editor.tsx test/cad-price.test.ts test/tour-filters.test.ts test/tour-booking.test.ts test/tour-content.test.ts
git commit -m "fix: label public tour prices as CAD"
```

### Task 7: Full Verification and Documentation Reconciliation

**Files:**
- Modify only files required to correct verification failures introduced by Tasks 1-6.

**Interfaces:**
- Consumes all prior task outputs.
- Produces a clean test, lint, and production-build result.

- [ ] **Step 1: Run the full unit test suite**

Run `npm test`. Expected: all tests pass with no warnings caused by this change.

- [ ] **Step 2: Run lint**

Run `npm run lint`. Expected: exit 0.

- [ ] **Step 3: Run the Next.js production build**

Run `npm run build`. Expected: exit 0 with successful TypeScript checking and route compilation.

- [ ] **Step 4: Inspect all changed files and database migration**

Run:

```bash
git diff --check HEAD~6..HEAD
git status --short
rg -n --glob '!node_modules/**' 'from \$|× \$|Tax on tour fare.*\$|fare\.price\}' src
```

Expected: no whitespace errors, only intentional worktree changes, and no remaining unlabeled public tour-commerce dollar displays.

- [ ] **Step 5: Commit any verification-only fixes**

If Step 1-4 required changes, add only those files and commit:

```bash
git commit -m "test: verify tour commerce improvements"
```

If no changes were required, do not create an empty commit.
