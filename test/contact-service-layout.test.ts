import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("places the quote form in the Contact Us sidebar and details in the main card", () => {
  const component = readFileSync(
    new URL("../src/components/contact/contact-page.tsx", import.meta.url),
    "utf8",
  );
  const css = readFileSync(
    new URL("../src/components/contact/contact-page.module.css", import.meta.url),
    "utf8",
  );

  assert.match(component, /<aside className=\{styles\.sidebar\}>[\s\S]*formCard/);
  assert.match(component, /<section className=\{styles\.content\}[^>]*>[\s\S]*contact-details-title/);
  assert.match(css, /\.shell\s*\{[\s\S]*grid-template-columns:\s*minmax\(240px,\s*280px\)\s+minmax\(0,\s*1fr\);/);
  assert.match(css, /\.input\s*\{[\s\S]*background:\s*#fff;[\s\S]*outline:\s*none;[\s\S]*transition:\s*border-color\s+0\.2s,\s*box-shadow\s+0\.2s;/);
  assert.match(css, /\.input:focus\s*\{[\s\S]*border-color:\s*var\(--amber\);/);
});
