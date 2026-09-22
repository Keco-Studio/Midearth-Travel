import assert from "node:assert/strict";
import test from "node:test";
import {
  ADMIN_LOGIN_EMAIL_MAX_LENGTH,
  ADMIN_LOGIN_PASSWORD_MAX_LENGTH,
  parseAdminLoginPayload,
} from "../src/lib/admin-login-input.ts";
import { createAdminLoginAttemptLimiter } from "../src/lib/admin-login-attempt-limiter.ts";
import { resolveAdminLoginSource } from "../src/lib/admin-login-source.ts";

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

test("blocks a sixth failed login for the normalized email and source", async () => {
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
        "203.0.113.10",
        rejectCredentials,
        now,
      ),
      false,
    );
  }

  assert.equal(
    await limiter.validate(
      "admin@midearthtravel.ca",
      "203.0.113.10",
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

test("keeps attempt windows separate by login source", async () => {
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

test("prunes expired windows before enforcing capacity", async () => {
  const limiter = createAdminLoginAttemptLimiter({ maxTrackedKeys: 2 });
  const windowStart = new Date("2026-09-22T00:00:00Z").getTime();
  const rejectCredentials = async () => false;

  await limiter.validate("oldest@midearthtravel.ca", "direct", rejectCredentials, windowStart);
  await limiter.validate("expired@midearthtravel.ca", "direct", rejectCredentials, windowStart);

  const refreshedAt = windowStart + 15 * 60 * 1000;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    await limiter.validate(
      "oldest@midearthtravel.ca",
      "direct",
      rejectCredentials,
      refreshedAt,
    );
  }

  await limiter.validate(
    "new@midearthtravel.ca",
    "direct",
    rejectCredentials,
    refreshedAt + 1,
  );

  let credentialChecks = 0;
  await limiter.validate(
    "oldest@midearthtravel.ca",
    "direct",
    async () => {
      credentialChecks += 1;
      return false;
    },
    refreshedAt + 1,
  );

  assert.equal(credentialChecks, 0, "active oldest window must survive stale-record pruning");
});

test("evicts the oldest active window when capacity is reached", async () => {
  const limiter = createAdminLoginAttemptLimiter({ maxTrackedKeys: 2 });
  const now = new Date("2026-09-22T00:00:00Z").getTime();
  const rejectCredentials = async () => false;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    await limiter.validate("oldest@midearthtravel.ca", "direct", rejectCredentials, now);
    await limiter.validate("newer@midearthtravel.ca", "direct", rejectCredentials, now + 1);
  }
  await limiter.validate("new@midearthtravel.ca", "direct", rejectCredentials, now + 2);

  let newerChecks = 0;
  await limiter.validate(
    "newer@midearthtravel.ca",
    "direct",
    async () => {
      newerChecks += 1;
      return false;
    },
    now + 2,
  );

  let oldestChecks = 0;
  await limiter.validate(
    "oldest@midearthtravel.ca",
    "direct",
    async () => {
      oldestChecks += 1;
      return false;
    },
    now + 2,
  );

  assert.equal(oldestChecks, 1, "oldest window must be evicted first");
  assert.equal(newerChecks, 0, "newer active window must remain blocked");
});

test("rejects excess concurrent unique keys without growing pending state", async () => {
  const limiter = createAdminLoginAttemptLimiter({ maxTrackedKeys: 2 });
  let releaseCredentials = () => {};
  const credentialsPending = new Promise<void>((resolve) => {
    releaseCredentials = resolve;
  });
  const pendingValidation = async () => {
    await credentialsPending;
    return false;
  };

  const firstAttempt = limiter.validate(
    "first@midearthtravel.ca",
    "direct",
    pendingValidation,
  );
  const secondAttempt = limiter.validate(
    "second@midearthtravel.ca",
    "direct",
    pendingValidation,
  );

  let excessCredentialChecks = 0;
  assert.equal(
    await limiter.validate("excess@midearthtravel.ca", "direct", async () => {
      excessCredentialChecks += 1;
      return false;
    }),
    false,
  );
  assert.equal(excessCredentialChecks, 0, "excess unique keys must fail closed");

  releaseCredentials();
  await Promise.all([firstAttempt, secondAttempt]);
});

test("ignores forwarded login sources unless proxy headers are explicitly trusted", () => {
  assert.equal(resolveAdminLoginSource("203.0.113.10, 10.0.0.1", {}), "direct");
  assert.equal(
    resolveAdminLoginSource("203.0.113.10, 10.0.0.1", {
      ADMIN_TRUST_PROXY_HEADERS: "TRUE",
    }),
    "direct",
  );
  assert.equal(
    resolveAdminLoginSource("203.0.113.10, 10.0.0.1", {
      ADMIN_TRUST_PROXY_HEADERS: "true",
    }),
    "203.0.113.10",
  );
  assert.equal(
    resolveAdminLoginSource("  , 10.0.0.1", { ADMIN_TRUST_PROXY_HEADERS: "true" }),
    "direct",
  );
});
