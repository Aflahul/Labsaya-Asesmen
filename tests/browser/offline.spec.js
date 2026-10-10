import { test, expect } from "@playwright/test";
import { register, enterMission } from "./helpers.js";
import { MISSIONS } from "../../src/shared/missions.js";
test("production assets and answer draft reload offline, then synchronize", async ({
  page,
  context,
}) => {
  test.skip(
    !process.env.TEST_BUILD,
    "Service worker enabled in production build",
  );
  await register(page, "Offline Uji");
  await enterMission(page, MISSIONS[0]);
  await page.locator("[data-answer=phone]").selectOption("String");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  await context.setOffline(true);
  await page.reload();
  await page.getByRole("button", { name: "Lanjut", exact: true }).click();
  await expect
    .poll(() =>
      page
        .locator(".island-art img")
        .evaluateAll((es) => es.every((e) => e.complete && e.naturalWidth > 0)),
    )
    .toBe(true);
  await page.locator('[data-mission="v2p01m01"]').click();
  await enterMission(page, MISSIONS[0]);
  await expect(page.locator("[data-answer=phone]")).toHaveValue("String");
  await page.locator("[data-answer=count]").selectOption("3");
  await context.setOffline(false);
  await expect(page.locator("[data-sync]").first()).toContainText(
    "Tersinkron",
    { timeout: 20000 },
  );
});
