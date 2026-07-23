import assert from "node:assert/strict";
import test from "node:test";
import packageJson from "../package.json" with { type: "json" };
import { buildNextRuntimeEnv } from "../scripts/run-next-with-env-proxy.mjs";

test("starts Next.js with Node environment proxy support", () => {
  assert.equal(packageJson.scripts.dev, "node scripts/run-next-with-env-proxy.mjs dev");
  assert.equal(
    packageJson.scripts.build,
    "node scripts/run-next-with-env-proxy.mjs build --webpack",
  );
  assert.equal(packageJson.scripts.start, "node scripts/run-next-with-env-proxy.mjs start");
  assert.equal(buildNextRuntimeEnv({ NODE_USE_ENV_PROXY: undefined }).NODE_USE_ENV_PROXY, "1");
  assert.equal(buildNextRuntimeEnv({ NODE_USE_ENV_PROXY: "0" }).NODE_USE_ENV_PROXY, "0");
});
