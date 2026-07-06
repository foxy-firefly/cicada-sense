import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  fullyParallel: true,
  globalTimeout: 300000,
  reporter: "list",
  testDir: "./playwright-live",
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "on-first-retry",
  },
  webServer: {
    command: "node ./playwright-live/run-live-stack.mjs",
    reuseExistingServer: !process.env.CI,
    stderr: "pipe",
    stdout: "pipe",
    timeout: 180000,
    url: "http://127.0.0.1:4173",
  },
  workers: 1,
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
      },
    },
  ],
});
