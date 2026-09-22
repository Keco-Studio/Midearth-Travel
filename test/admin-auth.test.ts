import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { basename, dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  AdminAuthConfigurationError,
  createAdminSession,
  getAdminAuthConfig,
  validateAdminCredentials,
  verifyAdminSession,
  type AdminAuthConfig,
} from "../src/lib/admin-session.ts";

const testDirectory = dirname(fileURLToPath(import.meta.url));
const projectDirectory = dirname(testDirectory);
const adminApiDirectory = join(projectDirectory, "src/app/api/admin");

const testConfig: AdminAuthConfig = {
  initialEmail: "admin@midearthtravel.ca",
  initialPassword: "correct horse battery staple",
  sessionSecret: "test-only-session-secret-with-at-least-32-characters",
};

test("verifies a valid signed admin session", async () => {
  const issuedAt = new Date("2026-09-22T00:00:00Z");
  const token = await createAdminSession("admin@midearthtravel.ca", issuedAt, testConfig);

  assert.deepEqual(
    await verifyAdminSession(token, new Date("2026-09-22T01:00:00Z"), testConfig),
    {
      email: "admin@midearthtravel.ca",
      issuedAt: issuedAt.getTime(),
      expiresAt: new Date("2026-09-22T08:00:00Z").getTime(),
    },
  );
});

test("rejects a tampered signed admin session", async () => {
  const token = await createAdminSession(
    "admin@midearthtravel.ca",
    new Date("2026-09-22T00:00:00Z"),
    testConfig,
  );

  assert.equal(
    await verifyAdminSession(`${token}x`, new Date("2026-09-22T01:00:00Z"), testConfig),
    null,
  );
});

test("rejects an expired signed admin session", async () => {
  const token = await createAdminSession(
    "admin@midearthtravel.ca",
    new Date("2026-09-22T00:00:00Z"),
    testConfig,
  );

  assert.equal(
    await verifyAdminSession(token, new Date("2026-09-22T08:00:00Z"), testConfig),
    null,
  );
});

test("rejects a signed admin session issued in the future", async () => {
  const token = await createAdminSession(
    "admin@midearthtravel.ca",
    new Date("2026-09-22T01:00:00Z"),
    testConfig,
  );

  assert.equal(
    await verifyAdminSession(token, new Date("2026-09-22T00:00:00Z"), testConfig),
    null,
  );
});

test("fails closed when initial admin configuration is incomplete", async () => {
  assert.throws(
    () => getAdminAuthConfig({ ADMIN_INITIAL_EMAIL: "admin@midearthtravel.ca" }),
    AdminAuthConfigurationError,
  );

  await assert.rejects(
    createAdminSession(
      "admin@midearthtravel.ca",
      new Date("2026-09-22T00:00:00Z"),
      { ...testConfig, sessionSecret: "" },
    ),
    AdminAuthConfigurationError,
  );
});

test("rejects weak, invalid, and placeholder admin configuration", () => {
  const validEnvironment = {
    ADMIN_INITIAL_EMAIL: "admin@midearthtravel.ca",
    ADMIN_INITIAL_PASSWORD: "correct horse battery staple",
    ADMIN_SESSION_SECRET: "test-only-session-secret-with-at-least-32-characters",
  };
  const invalidEnvironments = [
    { ...validEnvironment, ADMIN_INITIAL_EMAIL: "   " },
    { ...validEnvironment, ADMIN_INITIAL_EMAIL: "not-an-email" },
    { ...validEnvironment, ADMIN_INITIAL_EMAIL: "admin@example.com" },
    {
      ...validEnvironment,
      ADMIN_INITIAL_EMAIL: `${"a".repeat(240)}@midearthtravel.ca`,
    },
    { ...validEnvironment, ADMIN_INITIAL_PASSWORD: "short-pass" },
    { ...validEnvironment, ADMIN_INITIAL_PASSWORD: "           p " },
    { ...validEnvironment, ADMIN_INITIAL_PASSWORD: "            " },
    { ...validEnvironment, ADMIN_SESSION_SECRET: "s".repeat(31) },
    { ...validEnvironment, ADMIN_SESSION_SECRET: `${"s".repeat(31)} ` },
    { ...validEnvironment, ADMIN_SESSION_SECRET: " ".repeat(32) },
    {
      ...validEnvironment,
      ADMIN_INITIAL_PASSWORD: "replace_with_initial_admin_password",
    },
    {
      ...validEnvironment,
      ADMIN_SESSION_SECRET: "replace_with_a_long_random_session_secret",
    },
  ];

  for (const environment of invalidEnvironments) {
    assert.throws(
      () => getAdminAuthConfig(environment),
      AdminAuthConfigurationError,
    );
  }
});

test("normalizes a valid configured admin email", () => {
  assert.deepEqual(
    getAdminAuthConfig({
      ADMIN_INITIAL_EMAIL: "  Admin@MidearthTravel.ca  ",
      ADMIN_INITIAL_PASSWORD: "correct horse battery staple",
      ADMIN_SESSION_SECRET: "test-only-session-secret-with-at-least-32-characters",
    }),
    {
      initialEmail: "Admin@MidearthTravel.ca",
      initialPassword: "correct horse battery staple",
      sessionSecret: "test-only-session-secret-with-at-least-32-characters",
    },
  );
});

test("validates both initial credentials without exposing which one failed", async () => {
  assert.equal(
    await validateAdminCredentials(
      "admin@midearthtravel.ca",
      "correct horse battery staple",
      testConfig,
    ),
    true,
  );
  assert.equal(
    await validateAdminCredentials(
      "other@midearthtravel.ca",
      "correct horse battery staple",
      testConfig,
    ),
    false,
  );
  assert.equal(
    await validateAdminCredentials("admin@midearthtravel.ca", "wrong password", testConfig),
    false,
  );
});

test("keeps admin access out of the public navbar", () => {
  const navbarSource = readProjectFile("src/components/navbar.tsx");

  assert.ok(!navbarSource.includes('href="/admin"'));
  assert.ok(!navbarSource.includes("Admin Portal"));
});

test("guards the admin page before loading private data", () => {
  const pageSource = readProjectFile("src/app/admin/page.tsx");
  const guardOffset = pageSource.indexOf("await requireAdminSession()");
  const preloadOffset = pageSource.indexOf("await Promise.all");

  assert.ok(pageSource.includes('from "@/lib/admin-auth"'));
  assert.ok(guardOffset >= 0, "admin page must require a session");
  assert.ok(preloadOffset >= 0, "admin page preload was not found");
  assert.ok(guardOffset < preloadOffset, "admin page must authorize before preloading data");
});

test("guards every pre-existing admin API method before parsing or data access", () => {
  const routeFiles = findRouteFiles(adminApiDirectory).filter(
    (file) => !relative(adminApiDirectory, file).split("/").includes("auth"),
  );

  assert.equal(routeFiles.length, 12, "expected all 12 pre-existing admin route files");

  for (const file of routeFiles) {
    const source = readFileSync(file, "utf8");
    const routeName = relative(projectDirectory, file);
    const handlers = [...source.matchAll(/export async function (?:GET|POST|PUT|PATCH|DELETE)\b/g)];
    const guardCalls = source.match(/await assertAdminRequest\(\)/g) ?? [];

    assert.ok(
      source.includes('from "@/lib/admin-auth"'),
      `${routeName} must import the admin authorization guard`,
    );
    assert.ok(handlers.length > 0, `${routeName} must export a route method`);
    assert.equal(
      guardCalls.length,
      handlers.length,
      `${routeName} must guard every exported route method`,
    );

    handlers.forEach((handler, index) => {
      const body = source.slice(handler.index, handlers[index + 1]?.index ?? source.length);
      const guardOffset = body.indexOf("await assertAdminRequest()");
      const sensitiveOperationOffset = body.search(
        /request\.(?:json|formData)\(|await (?:load|save|upload|publish|update|sync)[A-Z]/,
      );

      assert.ok(guardOffset >= 0, `${routeName} has an unguarded route method`);
      if (sensitiveOperationOffset >= 0) {
        assert.ok(
          guardOffset < sensitiveOperationOffset,
          `${routeName} must authorize before request parsing or data access`,
        );
      }
    });
  }
});

test("uses server-only auth and secure bounded cookie settings", () => {
  const authSource = readProjectFile("src/lib/admin-auth.ts");
  const loginSource = readProjectFile("src/app/api/admin/auth/login/route.ts");
  const logoutSource = readProjectFile("src/app/api/admin/auth/logout/route.ts");

  assert.ok(authSource.includes('import "server-only"'));
  assert.ok(authSource.includes("await cookies()"));
  assert.ok(loginSource.includes("await cookies()"));
  assert.ok(loginSource.includes("httpOnly: true"));
  assert.ok(loginSource.includes('sameSite: "lax"'));
  assert.ok(loginSource.includes('path: "/"'));
  assert.ok(loginSource.includes('secure: process.env.NODE_ENV === "production"'));
  assert.ok(loginSource.includes("maxAge: ADMIN_SESSION_MAX_AGE_SECONDS"));
  assert.ok(loginSource.includes("Invalid email or password"));
  assert.ok(logoutSource.includes("await cookies()"));
  assert.ok(logoutSource.includes("ADMIN_SESSION_COOKIE_NAME"));
});

function readProjectFile(path: string): string {
  return readFileSync(join(projectDirectory, path), "utf8");
}

function findRouteFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return findRouteFiles(path);
    return entry.isFile() && basename(path) === "route.ts" ? [path] : [];
  });
}
