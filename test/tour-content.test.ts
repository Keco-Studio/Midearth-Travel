import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { tourSeeds } from "../src/data/cms-seed.ts";
import { defaultTourNotIncluded, getTourNotIncluded, tours } from "../src/data/tours.ts";
import {
  mapTourRecordToPublicTour,
  mapPublishedTourRecords,
  mergeTourRows,
  toTourRow,
  type TourRow,
} from "../src/lib/tour-content.ts";

const seed = tourSeeds[0];

test("uses the default exclusion list only when a static tour has no list", () => {
  assert.deepEqual(getTourNotIncluded(tours[0]), defaultTourNotIncluded);
  assert.deepEqual(getTourNotIncluded({ ...tours[0], notIncluded: [] }), []);
});

test("merges stored tour records over seeds and keeps new records", () => {
  const stored: TourRow = {
    ...toTourRow(seed),
    data: { ...seed, title: "Stored title" },
    updated_at: "2026-07-23T14:00:00Z",
  };
  const extra: TourRow = {
    ...stored,
    slug: "new-tour",
    data: { ...seed, slug: "new-tour", title: "New tour" },
  };
  const records = mergeTourRows([stored, extra]);

  assert.equal(records.find((record) => record.slug === seed.slug)?.title, "Stored title");
  assert.equal(records.find((record) => record.slug === "new-tour")?.title, "New tour");
});

test("normalizes legacy rows that predate tour detail CMS fields", () => {
  const legacyKeys = new Set([
    "departureCity",
    "localizedDepartureCity",
    "admissions",
    "localizedAdmissions",
    "cancellation",
    "localizedCancellation",
    "importantNotice",
    "localizedImportantNotice",
    "included",
    "localizedIncluded",
    "notIncluded",
    "localizedNotIncluded",
    "essentials",
  ]);
  const legacyData = Object.fromEntries(
    Object.entries(seed).filter(([key]) => !legacyKeys.has(key)),
  );
  const legacyRow: TourRow = {
    slug: "legacy-import",
    status: "published",
    data: { ...legacyData, slug: "legacy-import" } as TourRow["data"],
    updated_at: "2026-07-20T10:00:00Z",
  };

  const merged = mergeTourRows([legacyRow]);
  const imported = merged.find((record) => record.slug === "legacy-import")!;

  assert.equal(imported.departureCity, "");
  assert.equal(imported.admissions, "");
  assert.equal(imported.included, "");
  assert.equal(imported.notIncluded, "");
  assert.deepEqual(imported.essentials, {
    departureTime: "",
    meetingPlace: "",
    localizedMeetingPlace: "",
    hotels: "",
    localizedHotels: "",
    escortedCoach: "",
    localizedEscortedCoach: "",
  });
});

test("deep merges partial stored essentials over seed defaults", () => {
  const stored: TourRow = {
    ...toTourRow(seed),
    data: {
      ...seed,
      essentials: {
        departureTime: "7:30 AM",
      } as TourRow["data"]["essentials"],
    },
  };

  const merged = mergeTourRows([stored]).find((record) => record.slug === seed.slug)!;

  assert.equal(merged.essentials.departureTime, "7:30 AM");
  assert.equal(merged.essentials.meetingPlace, seed.essentials.meetingPlace);
  assert.equal(merged.essentials.hotels, seed.essentials.hotels);
});

test("maps editable tour fields to public tours while retaining rich static details", () => {
  const base = tours.find((tour) => tour.slug === seed.slug)!;
  const record = {
    ...seed,
    title: "Updated public title",
    localizedTourType: "巴士旅行团",
    image: "https://example.supabase.co/storage/tour.jpg",
    departures: "Aug 1, Sep 2",
    highlights: "Coast, Mountains",
    departureCity: "Montreal",
    admissions: "Included as listed.",
    cancellation: "30-day policy.",
    importantNotice: "Schedule may change.",
    included: "Coach transport\nHotels",
    notIncluded: "Flights\nInsurance",
    essentials: {
      ...seed.essentials,
      departureTime: "7:30 AM",
      meetingPlace: "Central Station",
      hotels: "4-star hotels",
      escortedCoach: "Guide and driver",
    },
    fares: { ...seed.fares, double: "$999" },
    specialOffer: false,
  };
  const mapped = mapTourRecordToPublicTour(record);

  assert.equal(mapped.title, "Updated public title");
  assert.equal(mapped.localizedTourType, "巴士旅行团");
  assert.equal(mapped.image, record.image);
  assert.deepEqual(mapped.departures, ["Aug 1", "Sep 2"]);
  assert.deepEqual(mapped.highlights, ["Coast", "Mountains"]);
  assert.equal(mapped.departureCity, "Montreal");
  assert.deepEqual(mapped.included, ["Coach transport", "Hotels"]);
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
    {
      title: "Important notice",
      content: "Schedule may change.",
      icon: "info",
      wide: true,
    },
  ]);
  assert.equal(mapped.fares?.find((fare) => fare.label === "Double")?.price, "$999");
  assert.equal(mapped.featured, false);
  assert.deepEqual(mapped.itinerary, base.itinerary);
});

test("omits policy and exclusion sections cleared in the CMS", () => {
  const mapped = mapTourRecordToPublicTour({
    ...seed,
    admissions: "",
    cancellation: "",
    importantNotice: "",
    included: "",
    notIncluded: "",
    departureCity: "",
  });

  assert.equal(mapped.departureCity, undefined);
  assert.equal(mapped.policies, undefined);
  assert.deepEqual(mapped.included, []);
  assert.deepEqual(mapped.notIncluded, []);
});

test("hides the Included card when its editable list is empty", () => {
  const detailSource = readFileSync(
    new URL("../src/components/tour/tour-detail.tsx", import.meta.url),
    "utf8",
  );

  assert.ok(detailSource.includes("{included.length > 0 && ("));
});

test("routes the tour contact CTA to the contact page with the selected tour", () => {
  const detailSource = readFileSync(
    new URL("../src/components/tour/tour-detail.tsx", import.meta.url),
    "utf8",
  );

  assert.ok(detailSource.includes('href={getContactQuoteHref(displayTitle)}'));
});

test("wraps standalone tour introductions in a content card", () => {
  const detailSource = readFileSync(
    new URL("../src/components/tour/tour-detail.tsx", import.meta.url),
    "utf8",
  );

  assert.match(detailSource, /className=\{styles\.descriptionCard\}/);
});

test("does not invent an introduction when CMS description is a day-by-day itinerary", () => {
  const mapped = mapTourRecordToPublicTour({
    ...seed,
    description: "Day 4: Halifax – Peggy's Cove\nDrive to Peggy's Cove...",
  });

  assert.equal(mapped.description, "");
  assert.equal(mapped.descriptionHtml, undefined);
});

test("maps Chinese CMS day-by-day content to a localized itinerary", () => {
  const mapped = mapTourRecordToPublicTour({
    ...seed,
    localizedDescription:
      "<p><strong>第 1 天：渥太华 - 里维耶尔迪卢普</strong> 清晨从渥太华出发。</p><p><strong>第 2 天：坎贝尔顿 - 佩尔塞</strong> 早餐后继续沿海旅行。</p>",
  });

  assert.deepEqual(mapped.localizedItinerary, [
    { day: 1, title: "渥太华 - 里维耶尔迪卢普", description: "清晨从渥太华出发。" },
    { day: 2, title: "坎贝尔顿 - 佩尔塞", description: "早餐后继续沿海旅行。" },
  ]);
});

test("preserves sanitized description markup for the tour detail view", () => {
  const mapped = mapTourRecordToPublicTour({
    ...seed,
    description: "<h2>Highlights</h2><p>Visit <strong>Kyoto</strong>.</p>",
  });

  assert.equal(mapped.description, "Highlights\nVisit Kyoto.");
  assert.equal(
    mapped.descriptionHtml,
    "<h2>Highlights</h2><p>Visit <strong>Kyoto</strong>.</p>",
  );
});

test("excludes non-published records from the public mapping", () => {
  const publicTours = mergeTourRows([
    { ...toTourRow(seed), status: "draft", data: { ...seed, status: "draft" } },
  ])
    .filter((record) => record.status === "published")
    .map(mapTourRecordToPublicTour);

  assert.equal(publicTours.some((tour) => tour.slug === seed.slug), false);
});

test("derives the published audit collection from the current edited tour records", () => {
  const edited = {
    ...seed,
    description: "Current edited description",
    status: "published" as const,
  };

  const result = mapPublishedTourRecords([
    edited,
    { ...seed, slug: "draft-tour", status: "draft" as const },
  ]);

  assert.equal(result.length, 1);
  assert.equal(result[0]?.description, "Current edited description");
  assert.equal(result.some((tour) => tour.slug === "draft-tour"), false);
});
