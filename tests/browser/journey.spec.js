import { test, expect } from "@playwright/test";
import { register, enterMission } from "./helpers.js";
import { MISSIONS } from "../../src/shared/missions.js";
test("incomplete answer stays active, keyboard choices and drafts survive navigation", async ({
  page,
}) => {
  await register(page);
  await enterMission(page, MISSIONS[0]);
  await page.locator("#submit").click();
  await expect(page.locator(".feedback")).toContainText("Lengkapi");
  await page.locator("[data-answer=phone]").selectOption("String");
  await page.getByRole("button", { name: "Peta", exact: true }).click();
  await page.locator('[data-mission="v2p01m01"]').click();
  await enterMission(page, MISSIONS[0]);
  await expect(page.locator("[data-answer=phone]")).toHaveValue("String");
});
test("cancelled logout resumes active timer and corrupt cache stays recoverable", async ({
  page,
  context,
}) => {
  await register(page, "Integritas Uji");
  await enterMission(page, MISSIONS[0]);
  await context.setOffline(true);
  await page.locator("[data-answer=phone]").selectOption("String");
  page.once("dialog", (d) => d.dismiss());
  await page.getByRole("button", { name: "Keluar", exact: true }).click();
  const time = () =>
    page.evaluate(() => {
      const a = JSON.parse(localStorage.getItem("pulau:last-account"));
      return JSON.parse(localStorage.getItem(`pulau:progress:v1:${a.user.id}`))
        .sessions[0].activeMs;
    });
  const before = await time();
  await expect.poll(time, { timeout: 10000 }).toBeGreaterThan(before + 1000);
  await context.setOffline(false);
  await page.locator(".brand").click();
  await expect(page.locator("[data-sync]").first()).toContainText(
    "Tersinkron",
    { timeout: 15000 },
  );
  await page.evaluate(() => {
    const a = JSON.parse(localStorage.getItem("pulau:last-account"));
    localStorage.setItem(
      `pulau:progress:v1:${a.user.id}`,
      "{recoverable-broken",
    );
  });
  await page.reload();
  await expect(page.getByRole("alert").first()).toContainText(
    "Data lokal rusak",
  );
  expect(
    await page.evaluate(() => {
      const a = JSON.parse(localStorage.getItem("pulau:last-account"));
      return localStorage.getItem(`pulau:progress:v1:${a.user.id}`);
    }),
  ).toBe("{recoverable-broken");
});
