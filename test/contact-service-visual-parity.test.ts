import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("renders Contact Us with its configured background and card treatment", () => {
  const component = readFileSync(
    new URL("../src/components/contact/contact-page.tsx", import.meta.url),
    "utf8",
  );
  const css = readFileSync(
    new URL("../src/components/contact/contact-page.module.css", import.meta.url),
    "utf8",
  );

  assert.match(component, /backgroundImage: string/);
  assert.match(component, /src=\{backgroundImage\}/);
  assert.match(component, /className=\{styles\.bg\}/);
  assert.match(css, /\.bgVeil\s*\{[\s\S]*linear-gradient\(105deg/);
  assert.match(css, /\.content\s*\{[\s\S]*backdrop-filter:\s*blur\(10px\);[\s\S]*box-shadow:\s*var\(--shadow-lg\);/);
});
