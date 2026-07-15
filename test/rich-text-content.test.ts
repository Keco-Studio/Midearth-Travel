import assert from "node:assert/strict";
import test from "node:test";
import {
  isSafeRichTextHref,
  normalizeRichText,
  richTextToPlainText,
} from "../src/lib/rich-text-content.ts";

test("converts legacy multiline text into paragraphs and line breaks", () => {
  assert.equal(
    normalizeRichText("Day 1: Ottawa\nVisit the gardens.\n\nDay 2: Gaspe"),
    "<p>Day 1: Ottawa<br />Visit the gardens.</p><p>Day 2: Gaspe</p>",
  );
});

test("preserves only supported rich text elements", () => {
  assert.equal(
    normalizeRichText(
      '<h2 style="color:red">Day 1</h2><p onclick="run()"><strong>Visit</strong> <span>Ottawa</span></p>',
    ),
    "<h2>Day 1</h2><p><strong>Visit</strong> Ottawa</p>",
  );
});

test("removes embedded content and unsafe link destinations", () => {
  const result = normalizeRichText(
    '<p>Plan<img src="x"><script>alert(1)</script><a href="javascript:alert(1)">bad</a><a href="/tours">good</a></p>',
  );

  assert.equal(result, '<p>Plan<a>bad</a><a href="/tours">good</a></p>');
});

test("accepts only supported absolute and relative link destinations", () => {
  assert.equal(isSafeRichTextHref("https://example.com/tour"), true);
  assert.equal(isSafeRichTextHref("mailto:travel@example.com"), true);
  assert.equal(isSafeRichTextHref("tel:+16135550123"), true);
  assert.equal(isSafeRichTextHref("/tours/canada"), true);
  assert.equal(isSafeRichTextHref("javascript:alert(1)"), false);
  assert.equal(isSafeRichTextHref("//example.com/tour"), false);
});

test("normalizes visually empty content and provides plain-text fallback content", () => {
  assert.equal(normalizeRichText("<p><br></p>"), "");
  assert.equal(
    richTextToPlainText("<h2>Day 1</h2><p>Visit<br>Ottawa</p>"),
    "Day 1\nVisit\nOttawa",
  );
});
