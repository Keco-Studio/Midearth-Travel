import assert from "node:assert/strict";
import test from "node:test";
import {
  loadPublishedHomeModulesStrictWithRequest,
  loadPublishedToursStrictWithRequest,
  type PublishedContentRequest,
} from "../src/lib/published-content-loaders.ts";
import { homeModuleSeeds, tourSeeds } from "../src/data/cms-seed.ts";
import { toHomeModuleRow } from "../src/lib/home-content.ts";
import { toTourRow } from "../src/lib/tour-content.ts";

function returning<TValue>(value: TValue): PublishedContentRequest {
  return async <T>() => value as T;
}

test("strict published home content loading propagates failures without logging", async () => {
  const failure = new Error("Home content unavailable");
  const originalConsoleError = console.error;
  let logs = 0;
  console.error = () => { logs += 1; };
  try {
    await assert.rejects(
      () => loadPublishedHomeModulesStrictWithRequest(async () => {
        throw failure;
      }),
      (error: Error) => {
        assert.equal(error.message, "Unable to load published homepage content");
        assert.equal(error.cause, failure);
        assert.doesNotMatch(error.message, /Home content unavailable/);
        return true;
      },
    );
  } finally {
    console.error = originalConsoleError;
  }
  assert.equal(logs, 0);
});

test("strict published tour loading propagates failures without logging", async () => {
  const failure = new Error("Tours unavailable");
  const originalConsoleError = console.error;
  let logs = 0;
  console.error = () => { logs += 1; };
  try {
    await assert.rejects(
      () => loadPublishedToursStrictWithRequest(async () => {
        throw failure;
      }),
      (error: Error) => {
        assert.equal(error.message, "Unable to load published tours");
        assert.equal(error.cause, failure);
        assert.doesNotMatch(error.message, /Tours unavailable/);
        return true;
      },
    );
  } finally {
    console.error = originalConsoleError;
  }
  assert.equal(logs, 0);
});

test("strict published home content rejects an empty successful response", async () => {
  await assert.rejects(
    () => loadPublishedHomeModulesStrictWithRequest(returning([])),
    { message: "Unable to load published homepage content" },
  );
});

test("strict published home content rejects missing or blank confirmation copy", async (t) => {
  const bookingPage = homeModuleSeeds.find((module) => module.id === "bookingPage");
  assert.ok(bookingPage);
  const completeRow = toHomeModuleRow(bookingPage);

  for (const [name, publishedData] of [
    [
      "missing key",
      Object.fromEntries(
        Object.entries(completeRow.published_data)
          .filter(([key]) => key !== "confirmationEmailSubjectEn"),
      ),
    ],
    [
      "blank key",
      { ...completeRow.published_data, confirmationEmailBodyZh: "   " },
    ],
    [
      "invalid key type",
      { ...completeRow.published_data, confirmationEmailClosingEn: false },
    ],
  ] as const) {
    await t.test(name, async () => {
      await assert.rejects(
        () => loadPublishedHomeModulesStrictWithRequest(returning([
          { ...completeRow, published_data: publishedData },
        ])),
        { message: "Unable to load published homepage content" },
      );
    });
  }
});

test("strict published home content returns only the stored Booking Page", async () => {
  const bookingPage = homeModuleSeeds.find((module) => module.id === "bookingPage");
  assert.ok(bookingPage);
  const storedEmailData = {
    confirmationEmailSubjectEn: "Stored English subject",
    confirmationEmailHeadingEn: "Stored English heading",
    confirmationEmailBodyEn: "Stored English body",
    confirmationEmailClosingEn: "Stored English closing",
    confirmationEmailSubjectZh: "Stored Chinese subject",
    confirmationEmailHeadingZh: "Stored Chinese heading",
    confirmationEmailBodyZh: "Stored Chinese body",
    confirmationEmailClosingZh: "Stored Chinese closing",
  };
  const storedFields = [{
    key: "confirmationEmailSubjectEn",
    label: "Stored subject field",
    type: "text" as const,
  }];
  const storedRow = {
    ...toHomeModuleRow(bookingPage),
    module_index: 77,
    name: "Stored Booking Page",
    description: "Stored metadata only",
    status: "draft" as const,
    published_version: 9,
    draft_version: 10,
    fields: storedFields,
    published_data: storedEmailData,
    updated_at: "2026-11-05T20:00:00.000Z",
  };
  const modules = await loadPublishedHomeModulesStrictWithRequest(
    returning([storedRow]),
  );
  assert.deepEqual(modules, [{
    id: "bookingPage",
    index: 77,
    name: "Stored Booking Page",
    description: "Stored metadata only",
    status: "draft",
    publishedVersion: 9,
    draftVersion: 10,
    updatedAt: "2026-11-05T20:00:00.000Z",
    fields: storedFields,
    data: storedEmailData,
  }]);
  assert.equal("book" in modules[0].data, false);
});

test("strict published tours reject empty and partial successful responses", async (t) => {
  await t.test("empty rows", async () => {
    await assert.rejects(
      () => loadPublishedToursStrictWithRequest(returning([])),
      { message: "Unable to load published tours" },
    );
  });

  await t.test("partial stored row", async () => {
    const seed = tourSeeds[0];
    assert.ok(seed);
    const row = toTourRow(seed);
    const partialData = { ...row.data } as Partial<typeof row.data>;
    delete partialData.title;
    await assert.rejects(
      () => loadPublishedToursStrictWithRequest(returning([
        { ...row, data: partialData },
      ])),
      { message: "Unable to load published tours" },
    );
  });

  await t.test("invalid stored row", async () => {
    const seed = tourSeeds[0];
    assert.ok(seed);
    const row = toTourRow(seed);
    await assert.rejects(
      () => loadPublishedToursStrictWithRequest(returning([
        { ...row, data: { ...row.data, duration: "" } },
      ])),
      { message: "Unable to load published tours" },
    );
  });
});

test("strict published tours return only rows actually stored in Supabase", async () => {
  const seed = tourSeeds[0];
  assert.ok(seed);
  const storedRecord = {
    ...seed,
    code: "DB99",
    title: "Stored title, not static",
    localizedTitle: "Stored localized title",
    duration: "Stored duration",
    localizedDuration: "Stored localized duration",
    departureCity: "Stored departure city",
    localizedDepartureCity: "Stored localized departure city",
    essentials: {
      ...seed.essentials,
      meetingPlace: "Stored meeting place",
      localizedMeetingPlace: "Stored localized meeting place",
    },
    galleryImages: "/stored-only-gallery.jpg",
  };
  const tours = await loadPublishedToursStrictWithRequest(
    returning([toTourRow(storedRecord)]),
  );
  assert.deepEqual(tours, [{
    slug: seed.slug,
    code: "DB99",
    title: "Stored title, not static",
    localizedTitle: "Stored localized title",
    duration: "Stored duration",
    localizedDuration: "Stored localized duration",
    departureCity: "Stored departure city",
    localizedDepartureCity: "Stored localized departure city",
    essentials: {
      meetingPlace: "Stored meeting place",
      localizedMeetingPlace: "Stored localized meeting place",
    },
  }]);
  assert.equal("gallery" in tours[0], false);
  assert.equal("itinerary" in tours[0], false);
});
