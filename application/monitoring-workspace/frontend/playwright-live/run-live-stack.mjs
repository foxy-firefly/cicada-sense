import { spawn } from "node:child_process";
import process from "node:process";
import { setTimeout as delay } from "node:timers/promises";

const backendPort = "4300";
const generatorPort = "4310";
const frontendRoot = process.cwd();
const backendRoot = new URL("../../backend/", import.meta.url);
const generatorRoot = new URL("../../../live-data-generator/", import.meta.url);
const startupTimeoutMs = 120000;
const processes = [];
let shuttingDown = false;

const serviceDefinitions = [
  {
    args: ["run", "dev"],
    cwd: backendRoot,
    env: {
      PORT: backendPort,
    },
    name: "dashboard-backend",
    readyUrl: `http://127.0.0.1:${backendPort}/api/health/live`,
  },
  {
    args: ["run", "dev:backend"],
    cwd: generatorRoot,
    env: {
      CICADA_BACKEND_URL: `http://127.0.0.1:${backendPort}`,
      PORT: generatorPort,
    },
    name: "generator-backend",
    readyUrl: `http://127.0.0.1:${generatorPort}/api/health/live`,
  },
  {
    args: ["run", "dev", "--", "--host", "127.0.0.1", "--port", "4173"],
    cwd: frontendRoot,
    env: {
      VITE_DEV_PROXY_TARGET: `http://127.0.0.1:${backendPort}`,
      VITE_FIXED_NOW: "2026-05-29T10:10:00.000Z",
    },
    name: "dashboard-frontend",
    readyUrl: "http://127.0.0.1:4173",
  },
];

const log = (name, chunk, writer) => {
  const lines = chunk
    .toString()
    .split(/\r?\n/)
    .filter((line) => line.length > 0)
    .map((line) => `[${name}] ${line}\n`)
    .join("");

  if (lines.length > 0) {
    writer.write(lines);
  }
};

const terminateChild = async (child) => {
  if (child.exitCode !== null) {
    return;
  }

  try {
    process.kill(-child.pid, "SIGTERM");
  } catch {
    child.kill("SIGTERM");
  }

  await delay(1000);

  if (child.exitCode !== null) {
    return;
  }

  try {
    process.kill(-child.pid, "SIGKILL");
  } catch {
    child.kill("SIGKILL");
  }
};

const shutdown = async (exitCode = 0) => {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  await Promise.all(processes.toReversed().map(({ child }) => terminateChild(child)));
  process.exit(exitCode);
};

const waitForService = async (name, readyUrl) => {
  const deadline = Date.now() + startupTimeoutMs;
  let lastError = new Error(`${name} was not reachable at ${readyUrl}`);

  while (Date.now() < deadline) {
    try {
      const response = await fetch(readyUrl, {
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok) {
        process.stdout.write(`[${name}] ready at ${readyUrl}\n`);
        return;
      }

      lastError = new Error(`${name} returned ${response.status} for ${readyUrl}`);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }

    await delay(1000);
  }

  throw lastError;
};

const startService = async ({ args, cwd, env, name, readyUrl }) => {
  const child = spawn("npm", args, {
    cwd,
    detached: true,
    env: {
      ...process.env,
      ...env,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  child.stdout.on("data", (chunk) => log(name, chunk, process.stdout));
  child.stderr.on("data", (chunk) => log(name, chunk, process.stderr));
  child.on("exit", (code, signal) => {
    if (!shuttingDown) {
      process.stderr.write(`[${name}] exited before teardown (code=${code}, signal=${signal})\n`);
      void shutdown(1);
    }
  });

  processes.push({ child, name });
  await waitForService(name, readyUrl);
};

process.on("SIGINT", () => {
  void shutdown(0);
});

process.on("SIGTERM", () => {
  void shutdown(0);
});

try {
  for (const serviceDefinition of serviceDefinitions) {
    await startService(serviceDefinition);
  }

  process.stdout.write("[live-stack] ready\n");
  await new Promise(() => {});
} catch (error) {
  const message = error instanceof Error ? (error.stack ?? error.message) : String(error);
  process.stderr.write(`[live-stack] ${message}\n`);
  await shutdown(1);
}
