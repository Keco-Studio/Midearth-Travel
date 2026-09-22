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

test("global settings reject inert telephone and malformed email actions", () => {
  for (const primaryPhoneHref of ["tel:", "tel:call-us", "tel:+"]) {
    assert.throws(
      () => canonicalizeSiteSettings({ ...siteSettingsSeed, primaryPhoneHref }),
      /valid telephone link/,
    );
  }

  for (const emailHref of ["mailto:", "mailto:not-an-email", "mailto:user@"]) {
    assert.throws(
      () => canonicalizeSiteSettings({ ...siteSettingsSeed, emailHref }),
      /valid email link/,
    );
  }
});

test("global settings retain a Chinese office address independently", () => {
  const settings = rowToSiteSettings({
    ...siteSettingsToRow(siteSettingsSeed),
    office_address_zh: "加拿大安大略省渥太华市布朗森大道",
  });

  assert.equal(settings.officeAddress, "Bronson Avenue, Ottawa, Ontario");
  assert.equal(settings.officeAddressZh, "加拿大安大略省渥太华市布朗森大道");
});
