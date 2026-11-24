import assert from "node:assert/strict";
import test from "node:test";
import { tourSeeds } from "../src/data/cms-seed.ts";
import type { TourRecord } from "../src/types/cms.ts";

type TourOrderModule = {
  orderTourRecords?: (records: readonly TourRecord[]) => TourRecord[];
  applyTourSlugOrder?: (
    records: readonly TourRecord[],
    orderedSlugs: readonly string[],
  ) => TourRecord[];
  moveTourRecord?: (
    records: readonly TourRecord[],
    slug: string,
    offset: -1 | 1,
  ) => TourRecord[];
  moveTourRecordToPosition?: (
    records: readonly TourRecord[],
    slug: string,
    position: number,
  ) => TourRecord[];
  parseTourOrderInput?: (value: unknown) => string[];
};

async function loadTourOrderModule(): Promise<TourOrderModule> {
  try {
    return await import("../src/lib/tour-order.ts") as TourOrderModule;
  } catch {
    return {};
  }
}

function record(slug: string, displayOrder?: number): TourRecord {
  return { ...tourSeeds[0], slug, displayOrder };
}

test("orders explicit positions before legacy records and keeps legacy ties stable", async () => {
  const { orderTourRecords } = await loadTourOrderModule();
  assert.equal(typeof orderTourRecords, "function");
  if (!orderTourRecords) return;

  const ordered = orderTourRecords([
    record("legacy-a"),
    record("second", 1),
    record("first", 0),
    record("legacy-b"),
  ]);

  assert.deepEqual(
    ordered.map(({ slug, displayOrder }) => ({ slug, displayOrder })),
    [
      { slug: "first", displayOrder: 0 },
      { slug: "second", displayOrder: 1 },
      { slug: "legacy-a", displayOrder: 2 },
      { slug: "legacy-b", displayOrder: 3 },
    ],
  );
});

test("applies only a complete unique slug order", async () => {
  const { applyTourSlugOrder } = await loadTourOrderModule();
  assert.equal(typeof applyTourSlugOrder, "function");
  if (!applyTourSlugOrder) return;

  const first = record("first");
  const second = record("second");
  const ordered = applyTourSlugOrder([first, second], [second.slug, first.slug]);

  assert.deepEqual(
    ordered.map(({ slug, displayOrder }) => ({ slug, displayOrder })),
    [
      { slug: "second", displayOrder: 0 },
      { slug: "first", displayOrder: 1 },
    ],
  );
  assert.throws(
    () => applyTourSlugOrder([first, second], [first.slug]),
    /every tour exactly once/i,
  );
  assert.throws(
    () => applyTourSlugOrder([first, second], [first.slug, first.slug]),
    /every tour exactly once/i,
  );
  assert.throws(
    () => applyTourSlugOrder([first, second], [first.slug, "unknown"]),
    /every tour exactly once/i,
  );
});

test("moves a tour one position and leaves boundary moves unchanged", async () => {
  const { moveTourRecord } = await loadTourOrderModule();
  assert.equal(typeof moveTourRecord, "function");
  if (!moveTourRecord) return;

  const records = [record("first", 0), record("second", 1), record("third", 2)];
  assert.deepEqual(
    moveTourRecord(records, "second", -1).map(({ slug }) => slug),
    ["second", "first", "third"],
  );
  assert.deepEqual(
    moveTourRecord(records, "first", -1).map(({ slug }) => slug),
    ["first", "second", "third"],
  );
  assert.deepEqual(
    moveTourRecord(records, "third", 1).map(({ slug }) => slug),
    ["first", "second", "third"],
  );
});

test("moves a tour directly to a one-based position and shifts the other tours", async () => {
  const { moveTourRecordToPosition } = await loadTourOrderModule();
  assert.equal(typeof moveTourRecordToPosition, "function");
  if (!moveTourRecordToPosition) return;

  const moved = moveTourRecordToPosition(
    [record("first", 0), record("second", 1), record("third", 2), record("fourth", 3)],
    "fourth",
    2,
  );

  assert.deepEqual(
    moved.map(({ slug, displayOrder }) => ({ slug, displayOrder })),
    [
      { slug: "first", displayOrder: 0 },
      { slug: "fourth", displayOrder: 1 },
      { slug: "second", displayOrder: 2 },
      { slug: "third", displayOrder: 3 },
    ],
  );
});

test("accepts only a non-empty string slug list from the reorder route", async () => {
  const { parseTourOrderInput } = await loadTourOrderModule();
  assert.equal(typeof parseTourOrderInput, "function");
  if (!parseTourOrderInput) return;

  assert.deepEqual(
    parseTourOrderInput({ orderedSlugs: [" first ", "second"] }),
    ["first", "second"],
  );
  assert.throws(() => parseTourOrderInput(null), /tour order/i);
  assert.throws(() => parseTourOrderInput({ orderedSlugs: [] }), /tour order/i);
  assert.throws(
    () => parseTourOrderInput({ orderedSlugs: ["first", 2] }),
    /tour order/i,
  );
  assert.throws(
    () => parseTourOrderInput({ orderedSlugs: ["first", " "] }),
    /tour order/i,
  );
});
