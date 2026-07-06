import { expect, test } from "@playwright/test";

const generatorApiUrl = process.env.GENERATOR_API_URL ?? "http://127.0.0.1:4310";

test("starts a generator scenario and updates the dashboard live", async ({ page, request }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Cicada Sense" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Sainte-Victoire Ridge" })).toBeVisible();
  await expect(page.getByText("sensor-ridge-01 • 92% • intensity 78")).toBeVisible();

  const response = await request.post(`${generatorApiUrl}/api/playback/start`, {
    data: {
      scenarioId: "chorus-spike",
      speed: 1,
    },
  });

  expect(response.ok()).toBe(true);
  await expect(page.getByText("sensor-ridge-01 • 93% • intensity 96")).toBeVisible();
});
