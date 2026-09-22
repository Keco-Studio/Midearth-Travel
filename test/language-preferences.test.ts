import assert from "node:assert/strict";
import test from "node:test";
import { serializeLanguageCookie } from "../src/lib/language-preferences.ts";

test("serializes the persisted language cookie for client-side language changes", () => {
  assert.equal(
    serializeLanguageCookie("zh"),
    "midearth-lang=zh; Path=/; Max-Age=31536000; SameSite=Lax",
  );
  assert.equal(
    serializeLanguageCookie("en"),
    "midearth-lang=en; Path=/; Max-Age=31536000; SameSite=Lax",
  );
});
