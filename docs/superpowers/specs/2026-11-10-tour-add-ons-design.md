# Tour Add-ons Design

## Goal

Add configurable per-tour activities, meals, and service fees to the Book Now review step. Guests may select multiple items, choose a ticket type and quantity for each, and pay a server-calculated CAD total.

## Data model

Each `TourRecord` stores `addOns: TourAddOn[]`. An add-on has an id, English/Chinese names, category, icon key, required flag, and one or more ticket types. Each ticket type has localized labels and a tax-inclusive CAD price in cents. A booking stores immutable selected add-on snapshots so later configuration changes do not alter historical orders.

## Behavior

- Optional add-ons start unchecked.
- Required add-ons start selected and cannot be unchecked.
- Selected add-ons allow a ticket type and quantity of 1-99.
- Client totals are display-only. Checkout reloads the published tour, validates ids/types/required items/quantities, and calculates line items from configured cents.
- Stripe receives the package fare plus one line item per selected add-on ticket type.
- Existing direct fare checkout remains package-only; the Book Now review flow sends add-on selections.

## Admin

The tour editor exposes a dynamic add-on list with localized names, category, icon, required toggle, and nested ticket types with localized labels and tax-inclusive CAD prices.
