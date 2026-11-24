# Tour Commerce and Content Improvements Design

## Goal

Improve tour merchandising and booking administration across the CMS and public site: give administrators control of the default tour order, collect an optional room count, preserve policy line breaks, add localized add-on details, and identify every visible tour price as Canadian dollars.

## Scope

This change covers Tour Library records and ordering, public tour lists and tour detail pricing, the tour booking form and booking persistence, paid-booking confirmation content, policy rendering, and optional activity/meal/service-fee editing and display.

It does not change how tour fares are calculated, how room count affects pricing, how Stripe represents CAD internally, or how customers temporarily sort a public listing by duration.

## Tour ordering

Each `TourRecord` gains a numeric `displayOrder`. Existing records without the property receive a stable fallback order based on their current merged order. A newly created tour receives the next available order and appears last.

The Tour Library table displays an `Order` column with move-up and move-down controls. The first row cannot move up and the last row cannot move down. A move sends the complete ordered slug list to a dedicated authenticated API route. The server validates that the submitted list contains every stored tour exactly once, assigns contiguous order values, and upserts all affected tour rows in one request. While the request is pending, order controls are disabled. A failed request restores the previous client order and displays an error.

Admin and public tour loaders sort records by `displayOrder`, with current merged order as the stable tie-breaker. All default public tour collections inherit this order. A visitor-selected sort, such as shortest duration, may temporarily override it within that listing view.

The order remains inside the existing tour JSON record rather than adding a second database column. This keeps one canonical tour representation and requires no schema migration for ordering.

## Optional room count

The booking form adds a Rooms input beside Adults and Children using the same visual treatment and responsive behavior. The input starts blank. Blank means that the customer did not specify a room count; room count has no maximum and never changes package fare, tax, add-ons, or the Stripe total. When populated, it must be a positive whole number.

Room count flows through booking request validation into a nullable `room_count` column on `bookings` and an optional `rooms` property on `BookingRecord`. It is also appended to the booking notes summary. The review screen, CMS booking detail, and paid-booking confirmation email show Rooms only when supplied. Historical bookings remain valid with a null room count.

The booking-page CMS gains localized labels for Rooms so the public field follows the current language.

## Policy text layout

Admissions, Cancellation, Important notice, Included, and Not included continue to use plain multiline CMS text. Public policy cards render the selected localized content with preserved newlines, comfortable line height, and safe wrapping for long unbroken content. Included and Not included continue using list semantics; policy cards preserve line breaks directly.

No HTML entered in these fields is interpreted, so the change does not introduce a content-injection path.

## Add-on details

`TourAddOn` gains optional English and Chinese description strings: `description` and `localizedDescription`. The Tour Library add-on editor places both detail fields immediately after the existing localized name inputs. Existing records normalize missing descriptions to empty strings.

The booking review shows the localized detail immediately beside or below the add-on name as subdued supporting text. It wraps naturally on small screens and does not alter the Stripe line-item name, snapshot identity, selection validation, or price calculation.

## CAD presentation

A shared presentation helper formats parseable tour fare strings and numeric cents as `CAD $<amount>`. It accepts the existing stored forms such as `$969`, `969`, and comma-formatted values without rewriting stored CMS data. Non-numeric call-for-quote copy remains unchanged.

Public tour cards, public tour fare tables, booking package fare, tax, add-on unit prices, totals, and payment action text use the helper. CMS pricing labels explicitly say CAD. Stripe remains configured with currency code `cad`; payment and email amount formatting continue to use the authoritative currency while visible site copy consistently identifies CAD.

## Data compatibility and error handling

- Stored tours without `displayOrder` or add-on descriptions are normalized safely.
- Stored bookings without `room_count` map to an absent `rooms` value.
- Invalid reorder payloads return a client error without changing records.
- Reorder failures restore the previous Tour Library order.
- Invalid populated room counts return the normal booking validation error and do not create a booking.
- Existing fare strings remain accepted by checkout.

## Testing

Automated tests will cover:

- stable order normalization, moving records, reorder payload validation, persistence, and public loader ordering;
- new-tour placement at the end;
- optional room-count request validation, database row mapping, booking creation, CMS detail rendering hooks, and localized confirmation email output;
- add-on description normalization and localized public rendering hooks;
- policy newline-preserving presentation;
- CAD formatting for stored fare strings and cent values, plus usage across public price surfaces;
- backwards compatibility for historical tour and booking records.

The full unit test suite, ESLint, TypeScript/Next production build, and focused integration checks will run before completion.
