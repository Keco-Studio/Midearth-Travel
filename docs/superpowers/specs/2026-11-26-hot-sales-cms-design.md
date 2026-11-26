# Hot Sales CMS Design

## Goal

Turn the existing homepage Hot Sales section into a promotion workspace that can be managed from its own Homepage CMS module. Editors can change the section copy, select the included tours, and maintain a discounted price and optional offer description for each selected tour. Hot Sales remains an existing public section; it moves ahead of Our Top Picks and uses the same heading typography.

## Editor Workflows

### Homepage Hot Sales

Add `Hot Sales` as a fixed Homepage module immediately before `Featured Tours` in the CMS menu. It follows the existing homepage module workflow:

- editing only changes a draft;
- `Save Draft` persists the draft without changing the public site;
- `Publish` makes the complete Hot Sales draft public;
- the section supports editable English and Chinese titles and descriptions;
- editors can add and remove tours from the promotion list;
- each selected tour has a discounted price plus optional English and Chinese offer descriptions;
- the selected-tour list controls both membership and display order.

The editor shows the tour's normal starting price as read-only context. That price is derived from the lowest valid fare already stored on the tour and is not copied into Hot Sales content.

### Tour Library

The individual Tour editor retains the `Hot sale` switch and adds the same discounted price and bilingual offer-description controls. This is a convenient single-tour editing path, not a separate source of truth.

Saving a Tour Library record updates that tour's Hot Sales promotion values. When an editor later opens the Homepage Hot Sales module, it loads those updated values. Changes published from the Homepage module likewise appear when the tour is next opened in Tour Library.

Tour Library updates continue to use the Tour Library's existing immediate save behavior. Homepage Hot Sales changes use the module's draft/publish behavior. If a Tour Library save occurs after a Homepage Hot Sales draft was created, the newer Tour Library values must not be silently overwritten: the Homepage editor must refresh or report a conflict before publishing stale promotion values.

## Data Ownership

The published Hot Sales configuration belongs to the new homepage module. It contains:

- section title and description in English and Chinese;
- an ordered list of promotion entries;
- for each entry: tour slug, discounted price, English offer description, and Chinese offer description;
- a revision marker used to detect stale drafts.

Tour records keep promotion editing fields as a synchronized projection so Tour Library remains useful. The normal tour fares remain canonical for the original price. The promotion price never replaces or mutates those fares.

Promotion entries are keyed by tour slug. Missing, draft, or unpublished tours are not rendered publicly. Removing a tour from Homepage Hot Sales turns off its Tour Library `Hot sale` state when the module is published. Turning on `Hot sale` in Tour Library adds that tour to the end of the current Hot Sales list.

Discounted prices are stored as editor-entered CAD values and normalized with the repository's existing CAD parsing and formatting utilities. A promotion may use an offer description without a discounted price, which supports offers such as “3rd & 4th guests 50% off.” At least one of discounted price or offer description is required for every selected tour.

## Public Presentation

The homepage keeps the existing Hot Sales section and moves it directly before Our Top Picks. It is not duplicated. If there are no valid published promotion entries, the section is hidden.

The Hot Sales heading uses the same type scale, weight, spacing, and responsive behavior as the Our Top Picks heading. The section may retain its own card treatment, but it must feel consistent with the current homepage and remain readable on mobile.

Each promotion card displays:

- the localized tour title and existing tour metadata;
- the localized offer description when supplied;
- the normal starting price derived from the lowest valid tour fare;
- the discounted price when supplied, with the original price visibly struck through;
- a link to the tour detail page.

For description-only promotions, the card shows the normal starting price without a misleading crossed-out value and gives the offer description primary promotional emphasis.

The tour detail page also displays the active published promotion. Price-based promotions show original and discounted prices. Description-only promotions show the offer description and retain normal fare presentation. Removing or unpublishing a promotion removes it from both public surfaces.

## Saving And Synchronization

The Homepage module API saves and publishes its content using the same authenticated module routes as the other fixed Homepage modules. Publishing performs one coordinated server-side operation:

1. validate the module content and all referenced tours;
2. reject a stale promotion revision with a clear conflict response;
3. publish the Hot Sales module data;
4. synchronize the affected Tour records' Hot Sales projection;
5. revalidate the public homepage and affected tour detail routes.

The operation must fail without partial public changes if validation or persistence fails. The editor remains dirty and shows the error so the user can retry.

Tour Library saves update the selected tour and the Hot Sales module's current published projection together. Existing unrelated homepage drafts must remain intact.

## Compatibility And Migration

The new module is added to the fixed Homepage module registry and seeded for installations that do not yet have it. Its initial promotion list is derived from published tours currently marked `specialDeals`, preserving the existing Hot Sales membership.

Existing static fallback tours continue to render if Supabase is unavailable. Legacy tour records without promotion detail fields remain valid. Existing `specialDeals` values are treated as membership only until the first synchronized save or publish.

## Validation

- Titles and descriptions follow bounded CMS text lengths.
- A promotion references an existing tour slug only once.
- A selected tour requires a discounted price, an offer description, or both.
- A discounted price must parse as a positive CAD amount.
- When both prices are numeric, the discounted price must be lower than the derived original starting price.
- A tour without a valid original fare may use a description-only promotion but cannot publish a discounted price.
- Draft and unpublished tours can be edited but are excluded from public Hot Sales output.

## Testing

Add focused tests for:

- module registry order and seed migration;
- promotion data parsing, validation, and legacy compatibility;
- original-price derivation and CAD display formatting;
- Homepage editor selection, ordering, price, and bilingual description controls;
- draft versus publish behavior;
- Tour Library synchronization in both directions;
- stale-draft conflict handling and atomic failure behavior;
- homepage ordering, empty-state hiding, price-based cards, and description-only cards;
- tour detail promotion display;
- responsive presentation and absence of overlap or clipping.

Run the full Node test suite, lint, production build, and browser checks at desktop and mobile sizes before completion.

## Success Criteria

Editors have a dedicated Homepage Hot Sales workspace with the same Save Draft and Publish behavior as other homepage modules. They can also update a single promotion from Tour Library without creating inconsistent data. The existing Hot Sales section appears before Our Top Picks, its title is editable, and public cards accurately distinguish normal prices, discounted prices, and conditional offers.
