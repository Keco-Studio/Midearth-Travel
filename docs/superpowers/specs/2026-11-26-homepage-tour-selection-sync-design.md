# Homepage Tour Selection Synchronization Design

## Goal

Make `Our Top Picks` and `Explore by Month` editable from both Tour Library and their dedicated Homepage modules without requiring editors to repeat the same selection. The two entry points must remain consistent, preserve Homepage draft/publish behavior, and reject stale concurrent edits instead of silently overwriting them.

This work extends the linked editing model already used by Hot Sales. It does not change Hot Sales pricing, normal tour fares, booking prices, or tour publication status.

## Editor Workflows

### Our Top Picks

Tour Library keeps the `Our Top Picks` switch. Turning it on adds the tour to the end of the current Our Top Picks list; turning it off removes the tour.

`Homepage → Our Top Picks` gains a selected-tour editor below its existing section-copy fields. Editors can:

- search for and add a Tour Library package;
- remove a selected package;
- move packages up or down to control homepage card order;
- continue editing the section eyebrow and title.

Adding or removing a tour from either entry point updates the other entry point. The Homepage list owns the explicit display order, while the Tour Library switch is the synchronized membership projection.

### Explore by Month

The Tour Library `Explore by Month package` switch is replaced by one month selector:

- `Not shown`;
- January through December.

Each tour may belong to at most one month. Choosing a month adds the tour to that month. Choosing a different month removes the tour from its previous month and adds it to the new one. Choosing `Not shown` removes it from Explore by Month.

`Homepage → Explore by Month` retains its month-by-month cards and bilingual month-specific descriptions. It enforces the same single-month rule:

- selecting an unassigned tour adds it to the current month;
- selecting a tour already assigned to another month moves it to the current month;
- a tour is never rendered twice across months;
- moving a tour deletes its previous English and Chinese month-specific descriptions;
- the new month assignment starts with blank descriptions;
- editing a tour while it remains in the same month preserves its descriptions.

Tour Library only selects the month. Month-specific English and Chinese descriptions remain in the Homepage editor so the Tour form stays focused on reusable tour content.

## Data Model And Ownership

### Our Top Picks Module

Add a serialized ordered slug list to the existing `toursSection` Homepage module:

```ts
const TOP_PICKS_DATA_KEY = "selectedToursData";
type TopPicksSelection = string[];
```

The published module list is canonical for public membership and order. `TourRecord.specialOffer` remains a synchronized boolean projection used by Tour Library and legacy imports.

The homepage stops deriving Our Top Picks solely by filtering `tour.featured`. It resolves the published ordered slug list against currently published tours. Missing or unpublished tours are omitted. Installations without the new list initially derive it from published tours with `specialOffer`, preserving current tour display order.

### Explore by Month Module

The existing `exploreByMonth.monthsData` remains canonical for monthly cards, order within each month, and bilingual descriptions.

Add one normalized Tour projection:

```ts
type ExploreMonthKey = "Jan" | "Feb" | "Mar" | "Apr" | "May" | "Jun" |
  "Jul" | "Aug" | "Sep" | "Oct" | "Nov" | "Dec";

type TourRecord = {
  // existing fields
  travelNewsPackage: boolean;
  exploreMonth: ExploreMonthKey | "";
};
```

`travelNewsPackage` is retained for compatibility and always equals `Boolean(exploreMonth)` after synchronized persistence. New code uses `exploreMonth` for the Tour Library selector and treats the boolean only as a legacy projection.

For legacy rows, the migration derives `exploreMonth` from the first matching tour reference in the published Explore by Month module. A legacy true flag without a matching month cannot be assigned safely, so it becomes unselected rather than guessing a month.

## Synchronization Rules

Pure synchronization helpers centralize all transformations. They must not depend on React or Supabase:

- parse, normalize, serialize, add, remove, and reorder Our Top Picks slugs;
- find a tour's Explore by Month assignment;
- remove a tour from every month;
- assign a tour to exactly one month;
- preserve descriptions only when the month is unchanged;
- create Tour projection patches from a published Homepage module;
- patch both published and draft Homepage data for one Tour Library update without changing unrelated entries or descriptions.

When Tour Library saves a tour, the server performs one atomic operation that:

1. validates the complete Tour record and its expected tour revision;
2. loads the current Hot Sales, Our Top Picks, and Explore by Month module revisions;
3. applies the tour's Hot Sales values, Top Picks membership, and single month assignment to both each module's published and draft data;
4. preserves unrelated unsaved Homepage draft edits;
5. writes the Tour and changed modules together;
6. returns the saved Tour and linked modules so the open CMS updates immediately.

When a Homepage editor saves a draft, only that module draft changes. Tour Library and the public site remain unchanged.

When Our Top Picks or Explore by Month is published, the server performs one atomic operation that:

1. validates the draft and its expected module revision;
2. publishes the module data;
3. shallow-merges only the relevant Tour projection fields;
4. leaves fares, Hot Sales, room pricing, itinerary, status, and unrelated Tour fields untouched;
5. returns the published module and updated Tours;
6. revalidates affected public routes.

Publishing Our Top Picks patches only `specialOffer`. Publishing Explore by Month patches only `exploreMonth` and `travelNewsPackage`.

## Transactions And Concurrency

Add a service-role Supabase RPC for linked Homepage/Tour persistence. It accepts one or more complete Homepage rows, Tour insert/update operations, and expected revisions.

The RPC must:

- lock Homepage rows in stable module-id order;
- compare every supplied expected Homepage revision after locking;
- lock Tour rows in stable slug order;
- compare expected Tour revisions for complete Tour saves;
- shallow-merge projection-only patches instead of replacing whole Tour JSON;
- roll back the entire operation on missing rows, validation errors, or revision conflicts;
- return all saved Homepage rows and Tours;
- be executable only by `service_role`.

All linked persistence paths use the same home-first, tour-second lock order. A stale Tour editor or Homepage editor receives HTTP 409 with a message asking the editor to refresh and review the newer selections. The client keeps its unsaved values after a conflict.

The RPC requires `SUPABASE_SERVICE_ROLE_KEY`; it must never fall back to the public anonymous key.

## CMS Presentation

The Our Top Picks selected-tour editor follows the existing Hot Sales editor interaction pattern but omits promotion fields. Each row shows the tour image, title, region, status, and reorder/remove controls.

The Explore by Month editor continues showing twelve month groups. Its tour selector may list all eligible tours, but a tour already assigned elsewhere is labelled with its current month. Selecting it clearly performs a move rather than creating a duplicate.

The Tour Library field labels and help text become explicit:

- `Our Top Picks`: “Also editable in Homepage → Our Top Picks.”
- `Explore by Month`: single month selector with “Also editable in Homepage → Explore by Month. One month per tour.”
- `Hot sale`: “Also editable in Homepage → Hot Sales.”

These controls are independent. One tour may simultaneously be in Our Top Picks, Hot Sales, and one Explore by Month month.

## Validation

Our Top Picks validation requires:

- a normalized ordered list of unique non-empty tour slugs;
- every selected slug to reference an existing Tour record;
- no duplicate membership.

Explore by Month validation requires:

- only the twelve supported month keys;
- each linked tour slug to appear in at most one month;
- every linked slug to reference an existing Tour record;
- stable unique destination IDs;
- bounded English and Chinese descriptions;
- no attempt to infer a month from the legacy boolean alone.

Draft and unpublished tours may remain editable in CMS lists, but public components omit any tour that is not currently published.

## Migration And Compatibility

The database migration:

- adds no table columns because Homepage and Tour content are stored as JSON;
- seeds `toursSection.selectedToursData` from current `specialOffer` Tours when the key is absent;
- backfills each Tour's `exploreMonth` from existing published `monthsData` references;
- normalizes `travelNewsPackage` to match the backfilled month;
- installs the service-role-only linked persistence RPC;
- preserves existing Hot Sales data and the current Hot Sales RPC during rollout.

Application normalization defaults missing `exploreMonth` to an empty string. Import/export mapping keeps the legacy boolean compatible, but an imported `Explore by Month` true value without an explicit month remains unassigned until an editor chooses a month.

Static seed content and Supabase-unavailable fallbacks retain current homepage behavior. Legacy Explore by Month destinations without a Tour Library slug continue to render as static cards and do not participate in Tour synchronization.

## Testing

Use test-driven development for each slice. Add focused tests for:

- Our Top Picks parsing, deduplication, ordering, add/remove/move behavior, and legacy seeding;
- Homepage Our Top Picks editor controls;
- Tour Library Top Picks updates flowing to both published and draft module data;
- Homepage Top Picks publish updating only `specialOffer`;
- month-key validation and legacy Tour normalization;
- assigning, removing, and moving a tour between months;
- clearing descriptions on a month move and preserving them within the same month;
- duplicate prevention across all twelve months;
- Tour Library month changes flowing to both published and draft module data;
- Explore by Month publish updating only `exploreMonth` and `travelNewsPackage`;
- atomic rollback and HTTP 409 behavior for stale Tour and Homepage revisions;
- preservation of unrelated Homepage drafts and unrelated Tour JSON fields;
- public Our Top Picks order and omission of missing/unpublished tours;
- CMS state refresh after either editing path saves or publishes.

Before completion run the full Node test suite, lint, production build, `git diff --check`, and browser checks of the public homepage and both CMS workflows at desktop and mobile sizes.

## Success Criteria

Editors can manage Our Top Picks membership from either Tour Library or Homepage, with Homepage controlling card order. Editors can assign each tour to zero or one Explore by Month month from either entry point, and changing the month automatically removes the old assignment and its descriptions. Drafts, published content, Tour projections, and the public homepage remain consistent without duplicate selection work or silent concurrent overwrites.
