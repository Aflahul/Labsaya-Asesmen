import { test, expect } from "@playwright/test";
import { MISSIONS, CORE_MISSIONS, BOSS } from "../../src/shared/missions.js";
import { solution } from "../fixtures/solutions.js";
import { register, enterMission, fillMission } from "./helpers.js";
test("15 core missions, real teacher review, optional boss and unchanged main grade", async ({
  page,
  browser,
}) => {
  test.setTimeout(240000);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const alias = "Ekspedisi" + Date.now();
  await register(page, "Siswa Lengkap", alias);
  for (const m of CORE_MISSIONS) {
    await enterMission(page, m);
    if (m.written) {
      if (process.env.TEST_BUILD) {
        await page.evaluate(() => navigator.serviceWorker.ready);
        await page.context().setOffline(true);
      }
      await page.locator("[data-answer=evidence]").evaluate((el) => {
        for (let i = 1; i <= 3300; i++) {
          el.value = "x".repeat(i);
          el.dispatchEvent(new Event("input", { bubbles: true }));
        }
      });
      const size = await page.evaluate(() => {
        const a = JSON.parse(localStorage.getItem("pulau:last-account"));
        const raw = localStorage.getItem(`pulau:progress:v1:${a.user.id}`);
        const s = JSON.parse(raw).sessions.findLast(
          (x) => x.missionId === "v2p05m03",
        );
        return {
          bytes: raw.length,
          draft: s.draftAnswers?.evidence || s.state.answers.evidence,
          events: s.events.length,
        };
      });
      expect(size.bytes).toBeLessThan(1000000);
      expect(size.draft).toHaveLength(3300);
      expect(size.events).toBeLessThan(30);
      await page.reload();
      await page
        .getByRole("button", { name: "Lanjutkan ekspedisi", exact: true })
        .click();
      await page.locator(`[data-mission="${m.id}"]`).click();
      await enterMission(page, m);
      await expect(page.locator("[data-answer=evidence]")).toHaveValue(
        "x".repeat(3300),
      );
      if (process.env.TEST_BUILD) await page.context().setOffline(false);
    }
    await fillMission(page, m);
    if (m.written) {
      await page.locator("#submit").click();
      await expect(page.locator(".badge")).toContainText("Menunggu guru");
      break;
    }
    await page.locator("#run").click();
    await expect(page.locator("#submit")).toBeVisible();
    await expect(page.locator(".feedback")).toContainText("Semua hasil");
    await page.locator("#submit").click();
    await expect(page.locator(".badge")).toContainText("Dinilai");
    await page.locator("#next").click();
  }
  await page.getByRole("button", { name: "Peta dunia", exact: true }).click();
  await expect(page.locator('[data-mission="' + BOSS.id + '"]')).toHaveCount(0);
  await expect(page.locator("[data-sync]").first()).toContainText(
    "Tersinkron",
    { timeout: 15000 },
  );
  const context = await browser.newContext();
  const teacher = await context.newPage();
  await teacher.goto("/");
  await teacher.getByRole("button", { name: "Guru", exact: true }).click();
  await teacher.getByLabel("Username guru").fill("guru");
  await teacher
    .getByLabel("Kata sandi", { exact: true })
    .fill("test-password-only");
  await teacher.getByRole("button", { name: "Masuk", exact: true }).click();
  await teacher.getByPlaceholder("Nama asli / samaran").fill(alias);
  await teacher.getByRole("button", { name: "Buka rapor" }).click();
  const review = teacher.locator(".review-form");
  await expect(review).toBeVisible();
  for (const [key, , max] of CORE_MISSIONS.at(-1).rubric)
    await review.locator(`[name="${key}"]`).fill(String(max));
  await review
    .locator("[name=comment]")
    .fill("Perbandingan data normal, ukuran berubah, dan kosong tepat.");
  await review.getByRole("button", { name: "Simpan penilaian" }).click();
  await expect(review).toHaveCount(0);
  await expect(teacher.locator(".summary-card").first()).toContainText("15/15");
  await page.reload();
  await page
    .getByRole("button", { name: "Lanjutkan ekspedisi", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Menara Awan kembali menyala." }),
  ).toBeVisible();
  await page.locator(`[data-mission="${BOSS.id}"]`).click();
  await enterMission(page, BOSS);
  await fillMission(page, BOSS);
  await page.locator("#submit").click();
  await expect(page.locator(".badge")).toContainText("Menunggu guru");
  await expect(page.locator("[data-sync]").first()).toContainText(
    "Tersinkron",
    { timeout: 15000 },
  );
  await teacher.getByRole("button", { name: "← Kembali", exact: true }).click();
  await teacher.getByPlaceholder("Nama asli / samaran").fill(alias);
  await teacher.getByRole("button", { name: "Buka rapor" }).click();
  for (const [key] of BOSS.rubric)
    await teacher.locator(`.review-form [name="${key}"]`).fill("0");
  await teacher
    .locator(".review-form [name=comment]")
    .fill("Pengayaan perlu dilengkapi; nilai inti tetap.");
  await teacher.getByRole("button", { name: "Simpan penilaian" }).click();
  await expect(teacher.locator(".review-form")).toHaveCount(0);
  await expect(teacher.locator(".summary-card").nth(1)).toContainText("100");
  await page.reload();
  await page.getByRole("button", { name: "Rapor saya", exact: true }).click();
  await expect(page.locator(".summary-card").first()).toContainText("15/15");
  await expect(page.locator(".summary-card").nth(1)).toContainText("100");
  await page.screenshot({
    path: "test-results/report-desktop.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
  await context.close();
});
