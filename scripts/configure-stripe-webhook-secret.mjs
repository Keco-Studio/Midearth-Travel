import { readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const projectDir = process.cwd();
const envPath = resolve(projectDir, ".env.local");
const stripePath = resolve(projectDir, ".tools/stripe/stripe");
const configPath = resolve(projectDir, ".tools/config/stripe/config.toml");
const envFile = readFileSync(envPath, "utf8");
const apiKey = envFile.match(/^STRIPE_SECRET_KEY=(.+)$/m)?.[1]?.trim();

if (!apiKey || !apiKey.startsWith("sk_")) {
  throw new Error("STRIPE_SECRET_KEY is missing or invalid in .env.local");
}

const result = spawnSync(
  stripePath,
  [
    "listen",
    "--print-secret",
    "--skip-update",
    "--api-key",
    apiKey,
    "--config",
    configPath,
  ],
  { encoding: "utf8", env: process.env },
);

if (result.status !== 0) {
  throw new Error(result.stderr.trim() || "Stripe CLI could not create a webhook secret");
}

const webhookSecret = result.stdout.trim();
if (!/^whsec_[A-Za-z0-9]+$/.test(webhookSecret)) {
  throw new Error("Stripe CLI returned an invalid webhook secret");
}

const nextEnvFile = /^STRIPE_WEBHOOK_SECRET=.*$/m.test(envFile)
  ? envFile.replace(/^STRIPE_WEBHOOK_SECRET=.*$/m, `STRIPE_WEBHOOK_SECRET=${webhookSecret}`)
  : `${envFile.replace(/\s*$/, "")}\nSTRIPE_WEBHOOK_SECRET=${webhookSecret}\n`;

writeFileSync(envPath, nextEnvFile, { mode: 0o600 });
console.log("STRIPE_WEBHOOK_SECRET configured in .env.local");
