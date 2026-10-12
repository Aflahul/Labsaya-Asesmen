import { test, expect } from "@playwright/test";
import {
  register,
  enterMission,
  fillMission,
  waitForSaved,
} from "./helpers.js";
import { MISSIONS } from "../../src/shared/missions.js";
test("completed missions reopen with Next and only Ulang creates a new attempt", async ({
  page,
}) => {
  await register(page);
  await enterMission(page, MISSIONS[0]);
  await fillMission(page, MISSIONS[0]);
  await page.locator("#submit").click();
  await waitForSaved(page);
  await page.getByRole("button", { name: "Peta", exact: true }).click();
  await page.locator("#nara-close").click();
  await page.locator('.island-art[data-island="1"]').click();
  await page.locator(`[data-mission="${MISSIONS[0].id}"]`).click();
  await enterMission(page, MISSIONS[0]);
  await expect(page.locator(".badge")).toContainText("Dinilai");
  await expect(page.locator("#next")).toHaveText("Next");
  await expect(page.locator("#submit")).toHaveCount(0);
  const count = () =>
    page.evaluate(() => {
      const a = JSON.parse(localStorage.getItem("pulau:last-account"));
      return JSON.parse(localStorage.getItem(`pulau:progress:v1:${a.user.id}`))
        .sessions.length;
    });
  expect(await count()).toBe(1);
  await page.locator("#replay").click();
  await expect(page.locator("#submit")).toBeVisible();
  expect(await count()).toBe(2);
  await fillMission(page, MISSIONS[0]);
  await page.locator("#submit").click();
  await waitForSaved(page);
  await expect(page.locator(".score-breakdown")).toContainText(
    "Skor permainan sesi: 100",
  );
  await expect(page.locator(".score-breakdown")).toContainText(
    "Skor permainan terbaik 100 − 1 poin (1 kali Ulang) = 99",
  );
  await expect(page.locator(".score-breakdown")).toContainText(
    "Nilai kompetensi misi: 100",
  );
  await page.reload();
  await page.getByRole("button", { name: "Lanjut", exact: true }).click();
  await page.locator("#nara-close").click();
  await page.locator('.island-art[data-island="1"]').click();
  await page.locator(`[data-mission="${MISSIONS[0].id}"]`).click();
  await enterMission(page, MISSIONS[0]);
  await expect(page.locator(".score-breakdown")).toContainText(
    "Skor permainan sesi: 100",
  );
  expect(await count()).toBe(2);
  await page.locator("#next").click();
  await enterMission(page, MISSIONS[1]);
});
