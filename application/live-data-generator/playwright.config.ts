import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  fullyParallel: true,
  reporter: "list",
  testDir: "./playwright",
  use: {
    baseURL: "http://127.0.0.1:5174",
    trace: "on-first-retry",
  },
  webServer: [
    {
      command: "npm run dev:backend",
      name: "generator-backend",
      reuseExistingServer: !process.env.CI,
      stderr: "pipe",
      stdout: "ignore",
      timeout: 120000,
      url: "http://127.0.0.1:3100/api/scenarios",
    },
    {
      command: "npm run dev:frontend -- --host 127.0.0.1",
      env: {
        VITE_GENERATOR_PROXY_TARGET: "http://127.0.0.1:3100",
      },
      name: "generator-frontend",
      reuseExistingServer: !process.env.CI,
      stderr: "pipe",
      stdout: "ignore",
      timeout: 120000,
      url: "http://127.0.0.1:5174",
    },
  ],
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
