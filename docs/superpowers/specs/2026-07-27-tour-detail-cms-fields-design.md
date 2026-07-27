# Tour Detail CMS Fields

## Goal

Make every content value shown in the supplied tour-detail screenshots editable in `Tour Library > Edit`, persisted in Supabase, and rendered on the public tour page. Preserve existing tour records and make the JSON format suitable for bulk data migration.

## Storage Contract

The existing `public.tours` table remains unchanged. Content continues to live in its `data jsonb` column. No SQL migration is required.

`TourRecord` adds the following fields:

```json
{
  "departureCity": "Ottawa",
  "localizedDepartureCity": "",
  "admissions": "Subject to actual arrangements.",
  "localizedAdmissions": "",
  "cancellation": "Cancellation in writing received 30 days before departure...",
  "localizedCancellation": "",
  "importantNotice": "Fares shown are for reference only...",
  "localizedImportantNotice": "",
  "included": "Coach transportation throughout\nHotel accommodation (3-4 stars)\nBilingual tour leader\nSelected meals (see itinerary)\nMajor attraction admissions",
  "localizedIncluded": "",
  "notIncluded": "International flights\nTravel insurance\nOptional excursions\nGratuities",
  "localizedNotIncluded": "",
  "essentials": {
    "departureTime": "6:00 AM",
    "meetingPlace": "670 Bronson Avenue, Ottawa ON K1S 4E9 (McDonald's parking lot)",
    "localizedMeetingPlace": "",
    "hotels": "3-star hotels or equivalent.",
    "localizedHotels": "",
    "escortedCoach": "Professional tour leader and driver.",
    "localizedEscortedCoach": ""
  }
}
```

Existing keys retain their current meaning:

- `departures` stores the departure dates shown in Trip essentials. Commas or line breaks delimit list items.
- `localizedDepartures` stores the Chinese departure dates.
- `duration` and `localizedDuration` supply the days/nights heading.
- `fares.child`, `fares.single`, `fares.double`, `fares.triple`, and `fares.quad` supply the Tour fares table.

English list fields use one item per line in the editor. The parser also accepts commas so existing and imported data remain compatible.

## Backward Compatibility

Seed conversion copies matching values from the existing static `Tour` objects into the new CMS keys. Stored Supabase rows are normalized against a complete empty/default shape, including a deep merge of `essentials` and `fares`.

An older row that lacks the new keys remains valid. Existing static content is used as its fallback where available; otherwise the new values are empty. A missing optional field must never invalidate or discard an otherwise valid imported tour.

## Admin Editor

Add three sections to the existing vertical editor:

1. `Trip essentials`: departure city/time, meeting place, hotels, and escorted coach, with English/Chinese pairs where the content is translatable. Dates and duration remain in the existing Schedule section.
2. `Policies and exclusions`: Admissions, Cancellation, Important notice, Included, and Not included, with English/Chinese pairs.
3. Existing `Pricing`: retain the five fare inputs without changing their stored keys.

Textarea fields are used for long policy text and exclusions. The new controls use the existing Ant Design form, section, grid, and responsive conventions.

## Public Rendering

The public mapper transfers the new CMS fields into the existing `Tour` model. The existing detail-page components render:

- Admissions, Cancellation, and Important notice policy cards;
- Included and Not included lists;
- Trip essentials;
- Tour fares and the departure-city subtitle.

CMS values take precedence over static data. Empty optional sections or list items are hidden. Fixed headings and icons remain presentation concerns and are not duplicated in Supabase.

## Validation And Testing

Required tour identity fields remain unchanged. New fields are optional strings, normalized by trimming values while preserving rich policy sentences. Tests cover:

- seed-to-CMS mapping for all new fields;
- old stored rows missing the new fields;
- nested essentials normalization and cloning;
- CMS-to-public mapping, including lists, policies, dates, fares, and departure city;
- editor validation and trimming;
- presence of the new editor controls.

Run focused Node tests, the complete test suite, lint, and a production build. The implementation must preserve the user's current uncommitted tour-description changes.
