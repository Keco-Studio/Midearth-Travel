import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const projectDirectory = dirname(dirname(fileURLToPath(import.meta.url)));
const readProjectFile = (path: string) => readFileSync(join(projectDirectory, path), "utf8");

test("renders an account menu instead of a standalone logout button", () => {
  const source = readProjectFile("src/components/admin-shell.tsx");
  assert.match(source, /AdminAccountMenu/);
  assert.match(source, /cms-workspace-topbar/);
  assert.match(source, /cms-workspace-topbar-title/);
  assert.match(source, /getWorkspaceTitle\(state\)/);
  assert.doesNotMatch(source, />\s*Log out\s*<\/Button>/);
});

test("account menu contains invite and logout actions", () => {
  const source = readProjectFile("src/components/admin-account-menu.tsx");
  assert.match(source, /\/admin\/invite/);
  assert.match(source, /\/api\/admin\/auth\/logout/);
  assert.match(source, /cms-admin-account-email/);
});
