import assert from "node:assert/strict";
import test from "node:test";
import {
  parseAdminInvitationPayload,
  parseAdminRegistrationPayload,
} from "../src/lib/admin-invitation-input.ts";

test("accepts a bounded administrator invitation email", () => {
  assert.deepEqual(parseAdminInvitationPayload({ email: " Admin@MidearthTravel.ca " }), {
    email: "admin@midearthtravel.ca",
  });
  assert.equal(parseAdminInvitationPayload({ email: "not-an-email" }), null);
  assert.equal(parseAdminInvitationPayload({ email: "a".repeat(255) }), null);
});

test("accepts only complete bounded registration input", () => {
  const payload = {
    email: "new.admin@midearthtravel.ca",
    password: "correct horse battery staple",
    token: "A".repeat(43),
  };
  assert.deepEqual(parseAdminRegistrationPayload(payload), payload);
  assert.equal(parseAdminRegistrationPayload({ ...payload, password: "short" }), null);
  assert.equal(parseAdminRegistrationPayload({ ...payload, token: "bad" }), null);
});
