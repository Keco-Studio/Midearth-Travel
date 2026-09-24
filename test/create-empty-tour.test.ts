import assert from "node:assert/strict";
import test from "node:test";
import { createEmptyTourRecord } from "../src/lib/create-empty-tour.ts";

test("does not preselect a system tour type for new tours", () => {
  assert.equal(createEmptyTourRecord().tourType, "");
});
