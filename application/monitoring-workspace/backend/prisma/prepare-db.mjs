import { spawnSync } from "node:child_process";

if (!process.env.DATABASE_URL) {
  process.exit(0);
}

const result = spawnSync("npx", ["prisma", "db", "push", "--config", "./prisma.config.ts"], {
  cwd: process.cwd(),
  env: process.env,
  stdio: "inherit",
});

process.exit(result.status ?? 1);
