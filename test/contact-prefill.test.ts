import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  getContactQuoteHref,
  getContactQuoteRequirements,
} from "../src/lib/contact-prefill.ts";

test("builds a Contact Us link that preserves the selected tour", () => {
  assert.equal(
    getContactQuoteHref("Maple Leaves in Mont Tremblant"),
    "/contact?tour=Maple+Leaves+in+Mont+Tremblant",
  );
});

test("builds a generic Contact Us quote link when no tour is selected", () => {
  assert.equal(getContactQuoteHref(), "/contact?quote=1");
});

test("builds a generic quote link that preserves the entered email address", () => {
  assert.equal(
    getContactQuoteHref(undefined, "traveler@example.ca"),
    "/contact?quote=1&email=traveler%40example.ca",
  );
});

test("prefills a bilingual quote request with the selected tour", () => {
  assert.equal(
    getContactQuoteRequirements("Maple Leaves in Mont Tremblant", "en"),
    "Quote request for: Maple Leaves in Mont Tremblant",
  );
  assert.equal(
    getContactQuoteRequirements("蒙特朗布朗枫叶之旅", "zh"),
    "咨询报价：蒙特朗布朗枫叶之旅",
  );
});

test("loads published Contact Us content and uses it for visible page copy", () => {
  const route = readFileSync(
    new URL("../src/app/contact/page.tsx", import.meta.url),
    "utf8",
  );
  const component = readFileSync(
    new URL("../src/components/contact/contact-page.tsx", import.meta.url),
    "utf8",
  );

  assert.match(route, /loadPublishedHomeModules/);
  assert.match(route, /getHomeModule\(modules, "contactPage"\)/);
  assert.match(route, /getPageBackgroundImage/);
  assert.match(component, /getLocalizedContent/);
  assert.match(component, /content: ContentData/);
  assert.match(component, /backgroundImage/);
});
