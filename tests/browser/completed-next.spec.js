import { test, expect } from "@playwright/test";
import { register, enterMission, fillMission, waitForSaved } from "./helpers.js";
import { MISSIONS } from "../../src/shared/missions.js";

test("all Ulang attempts are free and the island opens the next unfinished mission", async ({ page }) => {
  await register(page);
  await enterMission(page, MISSIONS[0]);
  await fillMission(page, MISSIONS[0]);
  await page.locator("#submit").click();
  await waitForSaved(page);
  await expect(page.locator("#next")).toHaveText("Next");
  const count = () => page.evaluate(() => {
    const a = JSON.parse(localStorage.getItem("pulau:last-account"));
    return JSON.parse(localStorage.getItem(`pulau:progress:v1:${a.user.id}`)).sessions.length;
  });
  expect(await count()).toBe(1);
  await page.locator("#replay").click();
  await expect(page.locator("#submit")).toBeVisible();
  expect(await count()).toBe(2);
  await fillMission(page, MISSIONS[0]);
  await page.locator("#submit").click();
  await waitForSaved(page);
  await expect(page.locator(".score-breakdown")).toContainText("Pencapaian misi: 100 XP");
  await expect(page.locator(".score-breakdown")).toContainText("Total XP inti: 100");
  await page.getByRole("button", { name: "Peta", exact: true }).click();
  await page.locator('.island-art[data-island="1"]').click();
  await enterMission(page, MISSIONS[1]);
  expect(await count()).toBe(3);
});
