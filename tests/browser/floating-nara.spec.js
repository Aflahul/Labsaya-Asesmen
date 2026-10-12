import { test, expect } from "@playwright/test";
import {
  register,
  enterMission,
  fillMission,
  expectShortButtons,
} from "./helpers.js";
import { MISSIONS } from "../../src/shared/missions.js";
test("Nara floats outside the question panel, can be dismissed and reopened without losing answers", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expectShortButtons(page);
  await register(page);
  await enterMission(page, MISSIONS[0]);
  await expect(page.locator(".mission-panel .nara-guide")).toHaveCount(0);
  await expect(page.locator("#nara-toast")).toBeVisible();
  await page.locator("#nara-next").click();
  await expect(page.locator("#nara-toast")).toContainText("Langkahmu");
  await page.locator("#nara-close").click();
  await expect(page.locator("#nara-toast")).toHaveCount(0);
  await page.locator("[data-answer=phone]").selectOption("String");
  await page.locator("#nara-open").click();
  await expect(page.locator("#nara-toast")).toBeVisible();
  await expect(page.locator("[data-answer=phone]")).toHaveValue("String");
  await page.screenshot({ path: "test-results/nara-floating-phone.png" });
});
test("selecting an unlocked island starts its next mission directly", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await register(page);
  await enterMission(page, MISSIONS[0]);
  await page.getByRole("button", { name: "Peta", exact: true }).click();
  await page.locator('.island-art[data-island="1"]').click();
  await expect(page.locator(".island-entry")).toHaveCount(0);
  await enterMission(page, MISSIONS[0]);
});
test("entry zoom has no ship; island travel sails before zooming, with skip cancellation", async ({
  page,
}) => {
  await register(page);
  await expect(page.locator("#world")).toHaveAttribute(
    "data-phase",
    "approach",
  );
  await expect(page.locator("#world .travel-ship")).toBeHidden();
  await enterMission(page, MISSIONS[0]);
  for (let i = 0; i < 3; i++) {
    await fillMission(page, MISSIONS[i]);
    await page.locator("#submit").click();
    await page.locator("#next").click();
    if (i < 2) await enterMission(page, MISSIONS[i + 1]);
  }
  await expect(page.locator("#world")).toHaveAttribute("data-phase", "sail");
  await expect(page.locator("#world .arrival-island")).toBeHidden();
  await page.locator("#skip").click();
  await expect(page.locator("#world")).not.toHaveAttribute("data-phase", /.+/);
  await expect(page.locator("#begin-mission")).toBeVisible();
});
