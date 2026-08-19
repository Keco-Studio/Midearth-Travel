import { readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const projectDir = process.cwd();
const envPath = resolve(projectDir, ".env.local");
const configHome = resolve(projectDir, ".tools/config");
const result = spawnSync(
  "supabase",
  ["projects", "api-keys", "--project-ref", "ocamnlhvnwsalluvsnud", "--output", "json"],
  { encoding: "utf8", env: { ...process.env, XDG_CONFIG_HOME: configHome } },
);

if (result.status !== 0) {
  throw new Error(result.stderr.trim() || "Supabase CLI could not list API keys");
}

const keys = JSON.parse(result.stdout);
const serviceKey = keys.find((key) => key.id === "service_role")?.api_key;
if (!serviceKey) throw new Error("Supabase service_role key was not returned");

const envFile = readFileSync(envPath, "utf8");
const nextEnvFile = /^SUPABASE_SERVICE_ROLE_KEY=.*$/m.test(envFile)
  ? envFile.replace(/^SUPABASE_SERVICE_ROLE_KEY=.*$/m, `SUPABASE_SERVICE_ROLE_KEY=${serviceKey}`)
  : `${envFile.replace(/\s*$/, "")}\nSUPABASE_SERVICE_ROLE_KEY=${serviceKey}\n`;
writeFileSync(envPath, nextEnvFile, { mode: 0o600 });
console.log("SUPABASE_SERVICE_ROLE_KEY configured in .env.local");
