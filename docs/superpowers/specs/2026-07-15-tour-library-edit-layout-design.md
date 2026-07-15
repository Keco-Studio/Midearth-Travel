# Tour Library Edit Layout Redesign

## Goal

Refine the Tour Library Edit screen so the long form is easier to scan and feels consistent with the Midearth CMS. Preserve every existing field, label, section, validation rule, value, and interaction. The change is intentionally conservative and limited to layout and styling.

## Scope

The implementation may adjust presentation markup and class names in `src/components/tour-editor.tsx` and the related styles in `src/app/admin/admin.css`.

The implementation must not:

- add, remove, rename, or reorder fields or sections;
- change form initial values or validation;
- change Tour Type autocomplete behavior;
- change image or PDF selection and removal behavior;
- change switches, status selection, Cancel, or Update behavior;
- add tabs, collapsible sections, sticky actions, animation, or explanatory copy;
- overwrite the current uncommitted Tour Type work.

## Visual Direction

Use the existing CMS palette and typography without introducing new fonts or a separate visual language.

| Role | Value | Use |
| --- | --- | --- |
| Forest | `#12312B` | Section headings and primary text |
| Gold | `#C8953F` | Primary action and section wayfinding marker |
| Cream | `#FFFAF1` | Restrained section emphasis |
| Layout background | `#F4F1EA` | Existing page background |
| White | `#FFFFFF` | Inputs and editing surfaces |
| Warm border | `#E4DED1` | Dividers and field boundaries |

Continue using Inter. Section headings use a compact `600` weight treatment; labels and utility text retain the existing CMS type scale. A short gold line beside each section title is the sole signature detail. It evokes an itinerary marker and helps users locate themselves in a long travel record without adding decoration or copy.

## Layout

Keep the existing vertical editing flow and section order:

1. Tour information
2. Schedule and highlights
3. Pricing
4. Tour descriptions
5. Media and PDF
6. Publishing and categories
7. Cancel and Update actions

Each section is an unframed, full-width content band rather than a floating card. Use spacing, a subtle background shift, and a fine divider to distinguish sections. Avoid nested cards and pronounced shadows.

On wide screens:

- retain the existing paired English and Chinese fields;
- align the five price inputs into equal-width columns;
- retain vertically stacked English and Chinese rich-text editors;
- retain the image/PDF split, with the image preview on the left and PDF fields on the right;
- present each category switch as a compact row with its label on the left and switch on the right;
- keep Status and Order grouped in their existing position;
- keep Cancel and Update at the end of the form, right aligned.

At tablet widths, existing grids reduce to two columns where space permits. On mobile, all form content stacks into one column, category rows remain readable, and Cancel and Update share the available width equally. No label, button text, or control may overflow its container.

## Interaction Contract

Presentation changes must leave the form contract intact. Existing handlers, hidden fields, upload interception, object URL cleanup, form submission, cancellation, and validation errors continue unchanged. Layout changes must preserve keyboard navigation order and visible focus styles.

## Implementation Boundaries

Prefer small presentational wrappers or section variants only where CSS cannot express the approved layout clearly. Do not refactor state or form logic. Reuse Ant Design components and current theme tokens. Keep selectors scoped below `.cms-tour-editor` so the redesign cannot alter other CMS workspaces.

## Verification

Verify the final screen at representative desktop, tablet, and mobile widths. Confirm there is no overlap, horizontal clipping, or unexpected layout shift.

Run the repository lint and production build checks. Smoke-test:

- required-field validation;
- Tour Type autocomplete and custom values;
- image selection and removal;
- PDF selection and removal;
- category switches and status selection;
- Cancel returning to Tour Library;
- Update persisting the edited record.

## Success Criteria

The Edit screen is visibly more ordered and easier to scan, yet remains immediately familiar to an existing CMS user. It matches the forest, gold, cream, and warm-neutral admin language, and every pre-existing content and interaction path behaves as before.
