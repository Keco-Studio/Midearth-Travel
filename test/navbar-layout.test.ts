import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

test("keeps desktop navigation centered between the brand and actions", () => {
  const css = readFileSync(new URL("../src/app/globals.css", import.meta.url), "utf8");

  assert.match(css, /\.header-inner\s*\{[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\)\s+auto\s+minmax\(0,\s*1fr\);/);
  assert.match(css, /\.nav-desktop\s*\{[\s\S]*justify-self:\s*center;/);
  assert.doesNotMatch(css, /\.nav-desktop\s*\{[\s\S]*margin-left:\s*auto;/);
});
