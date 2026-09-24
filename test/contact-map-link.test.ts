import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("links the Contact Us map to the office location in Google Maps", () => {
  const source = readFileSync(
    new URL("../src/components/contact/contact-page.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /href="https:\/\/www\.google\.com\/maps\/search\/\?api=1&query=738%20Bronson%20Avenue%2C%20Ottawa%2C%20ON%20K1S%204G3"/);
  assert.match(source, /className=\{styles\.map\}/);
  assert.match(source, /target="_blank"/);
});
