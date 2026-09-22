import assert from "node:assert/strict";
import test from "node:test";
import {
  hashAdminPassword,
  normalizeAdminEmail,
  verifyAdminPassword,
} from "../src/lib/admin-users.ts";

test("normalizes administrator email addresses", () => {
  assert.equal(
    normalizeAdminEmail(" Admin@MidearthTravel.ca "),
    "admin@midearthtravel.ca",
  );
});

test("verifies only a password derived with its stored random salt", async () => {
  const credentials = await hashAdminPassword("correct horse battery staple");

  assert.equal(
    await verifyAdminPassword(
      "correct horse battery staple",
      credentials.salt,
      credentials.hash,
    ),
    true,
  );
  assert.equal(
    await verifyAdminPassword("incorrect password", credentials.salt, credentials.hash),
    false,
  );
});
