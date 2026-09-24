import assert from "node:assert/strict";
import test from "node:test";
import { isSupportedPublicHref } from "../src/lib/footer-links.ts";

test("accepts only supported public footer destinations", () => {
  const cases: Array<[string, boolean]> = [
    ["/", true],
    ["/#contact", true],
    ["/tours", true],
    ["/tours/category/bus-tours", true],
    ["/tours/grand-canyon", true],
    ["/routes/asia", true],
    ["/services/flights", true],
    ["/contact", true],
    ["mailto:hello@example.com", true],
    ["tel:+16135551212", true],
    ["https://example.com/travel", true],
    ["", false],
    ["  ", false],
    ["/tours/custom", false],
    ["/tours/category/", false],
    ["/admin", false],
    ["javascript:alert(1)", false],
    ["http://example.com", false],
  ];

  for (const [href, expected] of cases) {
    assert.equal(isSupportedPublicHref(href), expected, href);
  }
});
