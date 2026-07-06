import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { keyboardNavigationFixture } from "./fixtures.js";

test.beforeEach(async ({ page }) => {
  await page.route("**/api/bootstrap", async (route) => {
    await route.fulfill({
      body: JSON.stringify(keyboardNavigationFixture),
      contentType: "application/json",
      status: 200,
    });
  });
});

async function setTheme(page: Parameters<typeof test>[0]["page"], theme: "light" | "dark") {
  await page.addInitScript((nextTheme) => {
    window.localStorage.setItem("cicada-sense:theme-preference", nextTheme);
  }, theme);
}

async function tabUntilFocused(
  page: Parameters<typeof test>[0]["page"],
  locator: Parameters<Parameters<typeof expect>[0]["toBeFocused"]>[0] extends never
    ? never
    : ReturnType<Parameters<typeof test>[0]["getByRole"]>,
  maxTabs = 24,
) {
  for (let index = 0; index < maxTabs; index += 1) {
    if (await locator.evaluate((element) => element === document.activeElement)) {
      return;
    }

    await page.keyboard.press("Tab");
  }

  await expect(locator).toBeFocused();
}

test("renders shell at light desktop width", async ({ page }) => {
  await page.setViewportSize({ height: 1024, width: 1440 });
  await setTheme(page, "light");
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Cicada Sense" })).toBeVisible();
  await expect(page).toHaveScreenshot("dashboard-shell-light-desktop.png");
});

test("renders shell at dark desktop width", async ({ page }) => {
  await page.setViewportSize({ height: 1024, width: 1440 });
  await setTheme(page, "dark");
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Cicada Sense" })).toBeVisible();
  await expect(page).toHaveScreenshot("dashboard-shell-dark-desktop.png");
});

test("renders shell at tablet width", async ({ page }) => {
  await page.setViewportSize({ height: 1024, width: 834 });
  await setTheme(page, "light");
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Cicada Sense" })).toBeVisible();
  await expect(page).toHaveScreenshot("dashboard-shell-light-tablet.png");
});

test("passes an accessibility smoke scan", async ({ page }) => {
  await page.setViewportSize({ height: 1024, width: 1440 });
  await setTheme(page, "light");
  await page.goto("/");

  const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
  const seriousViolations = accessibilityScanResults.violations.filter((violation) =>
    ["critical", "serious"].includes(violation.impact ?? ""),
  );

  expect(seriousViolations).toEqual([]);
});

test("supports keyboard navigation through the first dashboard flow", async ({ page }) => {
  await page.unroute("**/api/bootstrap");
  await page.route("**/api/bootstrap", async (route) => {
    await route.fulfill({
      body: JSON.stringify(keyboardNavigationFixture),
      contentType: "application/json",
      status: 200,
    });
  });

  await page.setViewportSize({ height: 1024, width: 1440 });
  await setTheme(page, "light");
  await page.goto("/");

  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Skip to monitoring workspace" })).toBeFocused();

  await page.keyboard.press("Enter");
  await expect(page.getByRole("main", { name: "Monitoring workspace" })).toBeFocused();

  const searchInput = page.getByRole("searchbox", { name: "Global search" });
  await tabUntilFocused(page, searchInput);
  await expect(searchInput).toBeFocused();

  const firstMarker = page.getByRole("button", { name: "Sainte-Victoire Ridge" });
  await tabUntilFocused(page, firstMarker);
  await expect(firstMarker).toBeFocused();

  const secondMarker = page.getByRole("button", { name: "Calanques North Slope" });
  await tabUntilFocused(page, secondMarker);
  await expect(secondMarker).toBeFocused();

  await page.keyboard.press("Enter");
  await expect(page.getByLabel("Site detail").getByRole("heading", { name: "Calanques North Slope" })).toBeVisible();
});
