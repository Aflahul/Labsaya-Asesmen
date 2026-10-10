import { test, expect } from "@playwright/test";
import { register, enterMission } from "./helpers.js";
import { MISSIONS } from "../../src/shared/missions.js";
for (const [name, width, height] of [
  ["desktop", 1440, 900],
  ["tablet", 768, 1024],
  ["phone", 390, 844],
])
  test(`responsive ${name}, actual assets and reduced motion`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await expect(page.locator(".hero-island")).toBeVisible();
    await expect
      .poll(() =>
        page
          .locator(".hero-island")
          .evaluate((e) => e.complete && e.naturalWidth > 0),
      )
      .toBe(true);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `test-results/home-${name}.png`,
      fullPage: true,
    });
    await register(page, "Responsif " + name);
    await enterMission(page, MISSIONS[0]);
    await page.locator("[data-answer=phone]").focus();
    await page.keyboard.press("s");
    await page.keyboard.press("Enter");
    await expect(page.locator("[data-answer=phone]")).toHaveValue("String");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `test-results/mission-${name}.png`,
      fullPage: true,
    });
    await page.getByRole("button", { name: "Peta", exact: true }).click();
    await expect(page.locator(".island-card")).toHaveCount(5);
    await expect
      .poll(() =>
        page
          .locator(".island-art img")
          .evaluateAll((es) =>
            es.every((e) => e.complete && e.naturalWidth > 0),
          ),
      )
      .toBe(true);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `test-results/map-${name}.png`,
      fullPage: true,
    });
  });
