import { spawn } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

export function buildNextRuntimeEnv(env) {
  return {
    ...env,
    NODE_USE_ENV_PROXY: env.NODE_USE_ENV_PROXY ?? "1",
  };
}

const isMainModule =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMainModule) {
  const nextBin = fileURLToPath(
    new URL("../node_modules/next/dist/bin/next", import.meta.url),
  );
  const child = spawn(process.execPath, [nextBin, ...process.argv.slice(2)], {
    env: buildNextRuntimeEnv(process.env),
    stdio: "inherit",
  });

  child.on("error", (error) => {
    console.error(error);
    process.exitCode = 1;
  });

  child.on("exit", (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }

    process.exitCode = code ?? 1;
  });
}
