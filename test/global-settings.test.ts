import assert from "node:assert/strict";
import test from "node:test";
import {
  canonicalizeSiteSettings,
  rowToSiteSettings,
  siteSettingsToRow,
} from "../src/lib/global-settings.ts";
import { siteSettingsSeed } from "../src/data/site-settings.ts";

test("global settings round-trip through the Supabase row shape", () => {
  const row = siteSettingsToRow(siteSettingsSeed, "2026-07-24T08:00:00.000Z");

  assert.equal(row.id, "site");
  assert.equal(row.updated_at, "2026-07-24T08:00:00.000Z");
  assert.deepEqual(rowToSiteSettings(row), siteSettingsSeed);
});

test("global settings validate contact href schemes", () => {
  assert.throws(
    () =>
      canonicalizeSiteSettings({
        ...siteSettingsSeed,
        primaryPhoneHref: "https://example.com",
      }),
    /must start with tel:/,
  );
});
