import assert from "node:assert/strict";
import test from "node:test";
import {
  ADMIN_LOGIN_EMAIL_MAX_LENGTH,
  ADMIN_LOGIN_PASSWORD_MAX_LENGTH,
  parseAdminLoginPayload,
} from "../src/lib/admin-login-input.ts";
import { createAdminLoginAttemptLimiter } from "../src/lib/admin-login-attempt-limiter.ts";

test("accepts bounded login fields and rejects oversized values", () => {
  assert.deepEqual(
    parseAdminLoginPayload({
      email: "e".repeat(ADMIN_LOGIN_EMAIL_MAX_LENGTH),
      password: "p".repeat(ADMIN_LOGIN_PASSWORD_MAX_LENGTH),
    }),
    {
      email: "e".repeat(ADMIN_LOGIN_EMAIL_MAX_LENGTH),
      password: "p".repeat(ADMIN_LOGIN_PASSWORD_MAX_LENGTH),
    },
  );
  assert.equal(
    parseAdminLoginPayload({
      email: "e".repeat(ADMIN_LOGIN_EMAIL_MAX_LENGTH + 1),
      password: "password",
    }),
    null,
  );
  assert.equal(
    parseAdminLoginPayload({
      email: "admin@midearthtravel.ca",
      password: "p".repeat(ADMIN_LOGIN_PASSWORD_MAX_LENGTH + 1),
    }),
    null,
  );
});

test("blocks a sixth failed login for the normalized email and first forwarded IP", async () => {
  const limiter = createAdminLoginAttemptLimiter();
  const now = new Date("2026-09-22T00:00:00Z").getTime();
  let credentialChecks = 0;
  const rejectCredentials = async () => {
    credentialChecks += 1;
    return false;
  };

  for (let attempt = 0; attempt < 5; attempt += 1) {
    assert.equal(
      await limiter.validate(
        " Admin@MidearthTravel.ca ",
        "203.0.113.10, 10.0.0.1",
        rejectCredentials,
        now,
      ),
      false,
    );
  }

  assert.equal(
    await limiter.validate(
      "admin@midearthtravel.ca",
      "203.0.113.10, 192.0.2.5",
      rejectCredentials,
      now,
    ),
    false,
  );
  assert.equal(credentialChecks, 5, "blocked requests must not validate credentials");
});

test("starts a new fixed window after fifteen minutes", async () => {
  const limiter = createAdminLoginAttemptLimiter();
  const windowStart = new Date("2026-09-22T00:00:00Z").getTime();
  let credentialChecks = 0;
  const rejectCredentials = async () => {
    credentialChecks += 1;
    return false;
  };

  for (let attempt = 0; attempt < 5; attempt += 1) {
    await limiter.validate("admin@midearthtravel.ca", "203.0.113.10", rejectCredentials, windowStart);
  }
  await limiter.validate(
    "admin@midearthtravel.ca",
    "203.0.113.10",
    rejectCredentials,
    windowStart + 15 * 60 * 1000,
  );

  assert.equal(credentialChecks, 6);
});

test("keeps attempt windows separate by first forwarded IP", async () => {
  const limiter = createAdminLoginAttemptLimiter();
  const now = new Date("2026-09-22T00:00:00Z").getTime();
  let credentialChecks = 0;
  const rejectCredentials = async () => {
    credentialChecks += 1;
    return false;
  };

  for (let attempt = 0; attempt < 5; attempt += 1) {
    await limiter.validate("admin@midearthtravel.ca", "203.0.113.10", rejectCredentials, now);
  }
  await limiter.validate("admin@midearthtravel.ca", "198.51.100.4", rejectCredentials, now);

  assert.equal(credentialChecks, 6);
});

test("a successful login resets its attempt window", async () => {
  const limiter = createAdminLoginAttemptLimiter();
  const now = new Date("2026-09-22T00:00:00Z").getTime();
  let credentialChecks = 0;
  const rejectCredentials = async () => {
    credentialChecks += 1;
    return false;
  };

  for (let attempt = 0; attempt < 4; attempt += 1) {
    await limiter.validate("admin@midearthtravel.ca", "203.0.113.10", rejectCredentials, now);
  }
  assert.equal(
    await limiter.validate(
      "admin@midearthtravel.ca",
      "203.0.113.10",
      async () => {
        credentialChecks += 1;
        return true;
      },
      now,
    ),
    true,
  );
  for (let attempt = 0; attempt < 5; attempt += 1) {
    await limiter.validate("admin@midearthtravel.ca", "203.0.113.10", rejectCredentials, now);
  }

  assert.equal(credentialChecks, 10);
});
