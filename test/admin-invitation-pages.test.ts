import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const projectDirectory = dirname(dirname(fileURLToPath(import.meta.url)));
const readProjectFile = (path: string) => readFileSync(join(projectDirectory, path), "utf8");

test("requires an administrator session for the invite page", () => {
  const source = readProjectFile("src/app/admin/invite/page.tsx");
  assert.match(source, /await requireAdminSession\(\)/);
});

test("keeps registration off the ordinary login page", () => {
  assert.doesNotMatch(readProjectFile("src/components/admin-login-form.tsx"), /\/admin\/register/);
});
