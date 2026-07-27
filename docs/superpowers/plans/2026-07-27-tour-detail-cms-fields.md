# Tour Detail CMS Fields Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist every supplied tour-detail field in Supabase, expose it in Tour Library Edit, and render it on public tour pages without breaking older JSON rows.

**Architecture:** Extend the existing `TourRecord` stored in `public.tours.data`, seed it from the static `Tour` model, and normalize missing optional keys before validation. Keep public presentation in the existing `Tour` model and `TourDetail` component, with the CMS mapper acting as the boundary between stored data and rendered data.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Ant Design 5, Supabase REST/JSONB, Node test runner.

---

## File Map

- `src/types/cms.ts`: authoritative CMS JSON shape.
- `src/lib/travel-data-mapper.ts`: converts static tours into complete seed records.
- `src/lib/tour-editor-state.ts`: trims, validates, and recognizes complete editor records.
- `src/lib/tour-content.ts`: merges old Supabase rows and maps CMS values to public tours.
- `src/components/tour-editor.tsx`: renders new admin controls.
- `src/components/tour/tour-detail.tsx`: hides empty optional public sections.
- `test/travel-data-mapper.test.ts`: seed field coverage.
- `test/tour-editor-state.test.ts`: normalization and trimming coverage.
- `test/tour-content.test.ts`: old-row compatibility and public mapping coverage.
- `test/tour-editor-layout.test.ts`: editor field and section coverage.

### Task 1: Define The Persisted JSON Contract

**Files:**
- Modify: `test/travel-data-mapper.test.ts`
- Modify: `src/types/cms.ts`
- Modify: `src/lib/travel-data-mapper.ts`

- [ ] **Step 1: Write the failing seed-mapping assertions**

Extend `maps source tour content into editable CMS fields` with:

```ts
assert.equal(record.departureCity, source.departureCity);
assert.equal(record.admissions, source.policies?.find(({ title }) => title === "Admissions")?.content);
assert.equal(record.cancellation, source.policies?.find(({ title }) => title === "Cancellation")?.content);
assert.equal(
  record.importantNotice,
  source.policies?.find(({ title }) => title === "Important notice")?.content,
);
assert.equal(record.notIncluded, source.notIncluded?.join("\n"));
assert.deepEqual(record.essentials, {
  departureTime: source.essentials?.departureTime ?? "",
  meetingPlace: source.essentials?.meetingPlace ?? "",
  localizedMeetingPlace: "",
  hotels: source.essentials?.hotels ?? "",
  localizedHotels: "",
  escortedCoach: source.essentials?.escortedCoach ?? "",
  localizedEscortedCoach: "",
});
```

- [ ] **Step 2: Run the focused test and confirm failure**

Run: `npm test -- test/travel-data-mapper.test.ts`

Expected: TypeScript/runtime assertions fail because the new `TourRecord` properties do not exist.

- [ ] **Step 3: Add the CMS types**

Add:

```ts
export type TourEssentialFields = {
  departureTime: string;
  meetingPlace: string;
  localizedMeetingPlace: string;
  hotels: string;
  localizedHotels: string;
  escortedCoach: string;
  localizedEscortedCoach: string;
};
```

Extend `TourRecord` with the exact keys from the approved design: `departureCity`, `localizedDepartureCity`, `admissions`, `localizedAdmissions`, `cancellation`, `localizedCancellation`, `importantNotice`, `localizedImportantNotice`, `notIncluded`, `localizedNotIncluded`, and `essentials`.

- [ ] **Step 4: Seed every new field**

In `mapTravelToursToRecords`, map the static values and use empty strings when a source value is absent. Add a helper:

```ts
function getPolicyContent(tour: (typeof tours)[number], title: string): string {
  return tour.policies?.find((policy) => policy.title === title)?.content ?? "";
}
```

Store `notIncluded` as newline-delimited text and initialize all localized values to `""`.

- [ ] **Step 5: Re-run the focused test**

Run: `npm test -- test/travel-data-mapper.test.ts`

Expected: all tests pass.

### Task 2: Make Old Supabase Rows Migration-Safe

**Files:**
- Modify: `test/tour-editor-state.test.ts`
- Modify: `test/tour-content.test.ts`
- Modify: `src/lib/tour-editor-state.ts`
- Modify: `src/lib/tour-content.ts`

- [ ] **Step 1: Write failing trimming and compatibility tests**

Add assertions that `validateTourEditorRecord` trims the new strings and nested essentials:

```ts
const validation = validateTourEditorRecord({
  ...record,
  departureCity: "  Ottawa  ",
  admissions: "  Subject to arrangements.  ",
  essentials: { ...record.essentials, meetingPlace: "  670 Bronson Ave  " },
});
```

Assert the values become `Ottawa`, `Subject to arrangements.`, and `670 Bronson Ave`.

Add a `mergeTourRows` test whose stored `data` deletes all new keys from a seed-shaped object. Assert the merged record retains the seed defaults and deep-merges a partial `essentials` object without losing sibling values.

- [ ] **Step 2: Run focused tests and confirm failure**

Run: `npm test -- test/tour-editor-state.test.ts test/tour-content.test.ts`

Expected: failures show missing trimming and incomplete nested normalization.

- [ ] **Step 3: Extend record recognition and trimming**

Add all new top-level string keys to `stringFields`, trim them in `trimTourRecord`, and add:

```ts
function isEssentialFields(value: unknown): value is TourRecord["essentials"] {
  return isRecord(value) && [
    "departureTime",
    "meetingPlace",
    "localizedMeetingPlace",
    "hotels",
    "localizedHotels",
    "escortedCoach",
    "localizedEscortedCoach",
  ].every((field) => typeof value[field] === "string");
}
```

Clone and trim the nested object just like `fares`.

- [ ] **Step 4: Normalize old JSON before validation**

In `normalizeStoredTour`, deep-merge both nested objects:

```ts
fares: { ...(fallback?.fares ?? emptyFares), ...row.data.fares },
essentials: {
  ...(fallback?.essentials ?? emptyEssentials),
  ...row.data.essentials,
},
```

Supply empty optional defaults for rows without a seed fallback. Keep required identity-field validation unchanged.

- [ ] **Step 5: Re-run focused tests**

Run: `npm test -- test/tour-editor-state.test.ts test/tour-content.test.ts`

Expected: all tests pass.

### Task 3: Map CMS Fields To The Public Tour Page

**Files:**
- Modify: `test/tour-content.test.ts`
- Modify: `src/lib/tour-content.ts`
- Modify: `src/components/tour/tour-detail.tsx`

- [ ] **Step 1: Write failing public-mapping assertions**

Map a record containing custom values and assert:

```ts
assert.equal(mapped.departureCity, "Montreal");
assert.deepEqual(mapped.notIncluded, ["Flights", "Insurance"]);
assert.deepEqual(mapped.essentials, {
  departureTime: "7:30 AM",
  meetingPlace: "Central Station",
  hotels: "4-star hotels",
  escortedCoach: "Guide and driver",
});
assert.deepEqual(mapped.policies, [
  { title: "Admissions", content: "Included as listed.", icon: "ticket" },
  { title: "Cancellation", content: "30-day policy.", icon: "shield" },
  { title: "Important notice", content: "Schedule may change.", icon: "info", wide: true },
]);
```

Also assert comma/newline list parsing and omission of blank policies.

- [ ] **Step 2: Run the focused test and confirm failure**

Run: `npm test -- test/tour-content.test.ts`

Expected: new CMS values are absent because the mapper currently retains the static values.

- [ ] **Step 3: Implement the mapping boundary**

Set `departureCity`, `notIncluded`, `essentials`, and `policies` explicitly after `...base`. Build policies only for non-empty content, preserving the existing fixed title/icon/wide metadata. Reuse `splitList` for exclusions.

- [ ] **Step 4: Hide empty public sections**

In `TourDetail`, stop applying `defaultTourNotIncluded` to mapped empty arrays. Render the Not included card only when the resolved list has entries. Keep the Tour fares card and its quote fallback unchanged.

- [ ] **Step 5: Re-run focused tests**

Run: `npm test -- test/tour-content.test.ts`

Expected: all tests pass.

### Task 4: Add Tour Library Edit Controls

**Files:**
- Modify: `test/tour-editor-layout.test.ts`
- Modify: `src/components/tour-editor.tsx`

- [ ] **Step 1: Write the failing editor-source contract test**

Add `Trip essentials` and `Policies and exclusions` to the expected section order. Assert these form names are present:

```ts
for (const field of [
  'name="departureCity"',
  'name="localizedDepartureCity"',
  'name={["essentials", "departureTime"]}',
  'name={["essentials", "meetingPlace"]}',
  'name="admissions"',
  'name="cancellation"',
  'name="importantNotice"',
  'name="notIncluded"',
]) {
  assert.ok(editorSource.includes(field), `missing tour detail field: ${field}`);
}
```

- [ ] **Step 2: Run the focused test and confirm failure**

Run: `npm test -- test/tour-editor-layout.test.ts`

Expected: the two sections and their controls are missing.

- [ ] **Step 3: Add the Trip essentials section**

Use the existing `EditorSection`, `Row`, `Col`, `Input`, and `Input.TextArea` components. Pair English/Chinese departure city, meeting place, hotels, and escorted coach fields. Keep departure time as a single non-translated input. Keep dates and duration in Schedule and highlights.

- [ ] **Step 4: Add policies and exclusions**

Add English/Chinese textarea pairs for Admissions, Cancellation, Important notice, and Not included. Use 3 rows for Admissions/exclusions and 5 rows for longer policies.

- [ ] **Step 5: Re-run the editor test**

Run: `npm test -- test/tour-editor-layout.test.ts`

Expected: all tests pass.

### Task 5: Add The Editable Included List

**Files:**
- Modify: `test/travel-data-mapper.test.ts`
- Modify: `test/tour-editor-state.test.ts`
- Modify: `test/tour-content.test.ts`
- Modify: `test/tour-editor-layout.test.ts`
- Modify: `src/types/cms.ts`
- Modify: `src/lib/travel-data-mapper.ts`
- Modify: `src/lib/tour-editor-state.ts`
- Modify: `src/lib/tour-content.ts`
- Modify: `src/components/tour-editor.tsx`

- [ ] **Step 1: Write failing Included field tests**

Assert that seed mapping initializes `included` from `source.included ?? defaultTourIncluded`, editor validation trims it, legacy rows normalize a missing value, public mapping parses it into a list, and the editor exposes both language fields:

```ts
assert.equal(record.included, defaultTourIncluded.join("\n"));
assert.equal(validation.value.included, "Coach transport\nHotels");
assert.deepEqual(mapped.included, ["Coach transport", "Hotels"]);
assert.ok(editorSource.includes('name="included"'));
assert.ok(editorSource.includes('name="localizedIncluded"'));
```

- [ ] **Step 2: Run focused tests and confirm the omission**

Run:

```bash
npm test -- test/travel-data-mapper.test.ts test/tour-editor-state.test.ts test/tour-content.test.ts test/tour-editor-layout.test.ts
```

Expected: failures identify the absent `included` CMS contract and editor controls.

- [ ] **Step 3: Add the persisted and editable Included fields**

Add the two strings to `TourRecord`:

```ts
included: string;
localizedIncluded: string;
```

Initialize them in `mapTravelToursToRecords`, include them in validation trimming and old-row defaults, and map the English value to the public `Tour.included` list with the existing `splitList` helper. In `Policies and exclusions`, add paired four-row textareas named `included` and `localizedIncluded` immediately before Not included.

- [ ] **Step 4: Run the focused tests and confirm they pass**

Run:

```bash
npm test -- test/travel-data-mapper.test.ts test/tour-editor-state.test.ts test/tour-content.test.ts test/tour-editor-layout.test.ts
```

Expected: all focused tests pass.

### Task 6: Verify The Integrated Change

**Files:**
- Verify only; do not overwrite unrelated working-tree changes.

- [ ] **Step 1: Read the relevant Next.js 16 guides**

Read `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md` and `15-route-handlers.md`. Confirm the existing client form and async route-handler conventions remain valid.

- [ ] **Step 2: Run focused feature tests**

Run:

```bash
npm test -- test/travel-data-mapper.test.ts test/tour-editor-state.test.ts test/tour-content.test.ts test/tour-editor-layout.test.ts
```

Expected: all focused tests pass.

- [ ] **Step 3: Run full verification**

Run: `npm test`

Expected: complete suite passes.

Run: `npm run lint`

Expected: exit 0 with no errors.

Run: `npm run build`

Expected: Next.js production build succeeds.

- [ ] **Step 4: Review the final diff**

Run: `git diff --check` and inspect `git diff` for the touched files. Confirm the user's pre-existing description/tagline edits remain present and no Supabase SQL migration was added.

Because the touched files already contain user changes, do not create implementation commits unless the user explicitly requests one after reviewing the combined diff.
