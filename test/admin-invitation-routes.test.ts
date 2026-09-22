import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const projectDirectory = dirname(dirname(fileURLToPath(import.meta.url)));

function readProjectFile(path: string): string {
  return readFileSync(join(projectDirectory, path), "utf8");
}

test("authorizes invitation creation before reading request input", () => {
  const source = readProjectFile("src/app/api/admin/auth/invitations/route.ts");
  assert.ok(source.indexOf("await assertAdminRequest()") < source.indexOf("await request.json()"));
});

test("registration hashes the token before persistent lookup", () => {
  const source = readProjectFile("src/app/api/admin/auth/register/route.ts");
  assert.ok(
    source.indexOf("const tokenHash = await hashInvitationToken") <
      source.indexOf("findAdminInvitationByTokenHash(tokenHash)"),
  );
  assert.doesNotMatch(source, /token_hash\s*:\s*registration\.token/);
});
