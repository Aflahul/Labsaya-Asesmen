import { test, expect } from "@playwright/test";
import { register, enterMission, fillMission } from "./helpers.js";
import { MISSIONS } from "../../src/shared/missions.js";
test("Nara briefing waits for the learner, controls keep focus, mission and island travel differ", async ({
  page,
}) => {
  await register(page);
  await expect(page.locator('section[data-transition="enter"]')).toBeVisible();
  await page.locator("#skip").click();
  await expect(page.locator("#begin-mission")).toBeVisible();
  await expect(page.locator("#submit")).toHaveCount(0);
  await page.locator("#begin-mission").click();
  await expect(page.locator(".nara-guide")).toContainText("Langkahmu");
  await page.locator("[data-answer=phone]").focus();
  await page.locator("[data-answer=phone]").selectOption("String");
  await expect(page.locator("[data-answer=phone]")).toBeFocused();
  for (let i = 0; i < 3; i++) {
    await fillMission(page, MISSIONS[i]);
    await page.locator("#submit").click();
    await page.locator("#next").click();
    await expect(
      page.locator(`section[data-transition="${i === 2 ? "island" : "task"}"]`),
    ).toBeVisible();
    await enterMission(page, MISSIONS[i + 1]);
  }
  await expect(page.locator(".flow-preview")).not.toContainText(
    "stok ≥ pesanan",
  );
  await expect(page.locator(".flow-preview")).not.toContainText("YA → Terima");
});
test("leaving arrival cancels pending mission opening", async ({ page }) => {
  await register(page);
  await page.getByRole("button", { name: "Peta dunia", exact: true }).click();
  await expect(page.locator(".map-stage")).toBeVisible();
  await expect(page.locator("#begin-mission")).toHaveCount(0);
  await expect(page.locator("#submit")).toHaveCount(0);
});
