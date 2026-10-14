import { test, expect } from "@playwright/test";
import { register, enterMission } from "./helpers.js";
import { MISSIONS } from "../../src/shared/missions.js";
test("mission stays compact, tips live in Nara and the plane remains in the scene", async ({
  page,
}) => {
  await register(page);
  await enterMission(page, MISSIONS[0]);
  await expect(page.locator(".side-panel")).toHaveCount(0);
  await expect(page.locator(".mission-panel #timer")).toBeVisible();
  await expect(page.locator(".mission-panel progress")).toHaveAttribute(
    "max",
    "15",
  );
  await expect(page.locator(".mission-panel")).not.toContainText(
    "Coba tidak mengakhiri",
  );
  await expect(page.locator(".mission-panel [data-sync]")).toHaveCount(0);
  await expect(page.locator(".resident-plane")).toBeVisible();
  await expect(page.getByLabel(/Apa tipe data.*nomor telepon/)).toBeVisible();
  await page.locator("#nara-close").click();
  await page.getByRole("button", { name: "Petunjuk", exact: true }).click();
  await expect(page.locator("#nara-toast")).toContainText(
    "Nomor telepon bisa diawali angka 0",
  );
  await expect(page.locator(".mission-panel")).not.toContainText(
    "Nomor telepon bisa diawali angka 0",
  );
  await expect(page.locator("#nara-toast")).not.toContainText("Pilih Ulang");
  await page.locator("#nara-close").click();
  await page.locator("[data-answer=phone]").selectOption("String");
  await expect(page.locator(".resident-plane")).toBeVisible();
  await page.screenshot({
    path: "test-results/compact-mission-desktop.png",
    fullPage: true,
  });
});
test("scene appears before plane arrives and the start button waits for arrival", async ({
  page,
}) => {
  await register(page);
  await expect(page.locator("#world")).toHaveAttribute(
    "data-phase",
    "approach",
  );
  await expect(page.locator("#begin-mission")).toHaveCount(0);
  await expect(page.locator("#world")).toHaveAttribute("data-phase", "dock", {
    timeout: 5000,
  });
  await expect(page.locator("#world .world-backdrop")).toHaveCSS(
    "background-image",
    /scene-pelabuhan-data/,
  );
  await expect(page.locator("#world .travel-ship")).toBeHidden();
  await expect(page.locator(".resident-plane")).toBeVisible();
  await expect(page.locator("#begin-mission")).toHaveCount(0);
  await page.locator("#begin-mission").click();
  await expect(page.locator(".resident-plane")).toBeVisible();
});
