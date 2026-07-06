import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route("**/api/scenarios", async (route) => {
    await route.fulfill({
      body: JSON.stringify([
        {
          id: "chorus-spike",
          name: "Chorus spike",
          description: "Spike",
          cadenceMs: 1,
          events: [],
        },
      ]),
      contentType: "application/json",
      status: 200,
    });
  });

  await page.route("**/api/playback/start", async (route) => {
    await route.fulfill({
      body: JSON.stringify({
        currentScenarioId: "chorus-spike",
        emittedEvents: [
          {
            organizationId: "org",
            projectId: "project",
            siteId: "site",
            sensorId: "sensor-site-sainte-victoire-1",
            speciesId: "species",
            confidence: 0.9,
            intensity: 96,
            recordedAt: "2026-05-29T10:00:00.000Z",
          },
        ],
        isPlaying: false,
        speed: 1,
      }),
      contentType: "application/json",
      status: 200,
    });
  });
});

test("starts a scenario from the console and shows emitted events in the log", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Live Data Generator" })).toBeVisible();
  await page.getByRole("combobox", { name: "Scenario" }).selectOption("chorus-spike");
  await page.getByRole("button", { name: "Start" }).click();

  await expect(page.getByText("sensor-site-sainte-victoire-1 intensity 96")).toBeVisible();
});
