import assert from "node:assert/strict";
import test from "node:test";
import { createEmptyTourRecord } from "../src/lib/create-empty-tour.ts";

test("does not preselect a system tour type for new tours", () => {
  assert.equal(createEmptyTourRecord().tourType, "");
});

test("places a new tour at the supplied display position", () => {
  assert.equal(createEmptyTourRecord([], 7).displayOrder, 7);
});

test("starts a new tour outside Explore by Month", () => {
  const tour = createEmptyTourRecord();

  assert.equal(tour.exploreMonth, "");
  assert.equal(tour.travelNewsPackage, false);
});
