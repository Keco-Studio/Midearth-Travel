import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("Tour Library does not render the published tour content audit", () => {
  const source = readFileSync(
    new URL("../src/components/admin-shell.tsx", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(source, /TourContentAuditReport/);
  assert.doesNotMatch(source, /Published Tour Content Audit/);
  assert.doesNotMatch(source, /published-tour-content-audit\.csv/);
});
