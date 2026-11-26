import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("Our Top Picks renders the published explicit tour order", () => {
  const source = readFileSync(
    new URL("../src/components/tours-section.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /resolveTopPickTours\(content, sourceTours\)/);
  assert.doesNotMatch(source, /sourceTours\.filter\(\(tour\) => tour\.featured\)/);
  assert.match(source, /featuredTours\.map/);
  assert.match(source, /className="section-title"/);
});
