import assert from "node:assert/strict";
import test from "node:test";
import { getPageBackgroundImage } from "../src/lib/page-content.ts";

test("uses a page-specific background before the published Hero background", () => {
  assert.equal(
    getPageBackgroundImage(
      { backgroundImage: "https://cdn.example.com/booking.jpg" },
      { backgroundImage: "https://cdn.example.com/hero.jpg" },
    ),
    "https://cdn.example.com/booking.jpg",
  );
});

test("uses the published Hero background then the static default for blank page media", () => {
  assert.equal(
    getPageBackgroundImage({ backgroundImage: "" }, { backgroundImage: "/hero/live.jpg" }),
    "/hero/live.jpg",
  );
  assert.equal(getPageBackgroundImage({}, {}), "/hero/hero-coast.jpg");
});
