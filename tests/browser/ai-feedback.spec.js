import { test, expect } from "@playwright/test";
import { CORE_MISSIONS, BOSS } from "../../src/shared/missions.js";
import { register, enterMission, fillMission } from "./helpers.js";

test.skip(process.env.TEST_AI_GRADER !== "1", "Run with TEST_AI_GRADER=1 to exercise Nara's grading flow");

test("Nara grades mission 15 and boss promptly; teacher can correct her rubric", async ({ page, browser }) => {
  test.setTimeout(180000);
  const alias = `AiUji${Date.now()}`;
  await register(page, "Siswa AI", alias);
  for (const mission of CORE_MISSIONS) {
    await enterMission(page, mission);
    await fillMission(page, mission);
    await page.locator("#submit").click();
    if (mission.id === CORE_MISSIONS.at(-1).id) {
      await expect(page.locator(".badge")).toContainText("Dinilai Nara", { timeout: 20000 });
      await expect(page.locator("#nara-toast")).toContainText("Kamu sudah menunjukkan bukti");
    } else {
      await page.locator("#next").click();
    }
  }
  await page.locator("#next").click();
  await page.locator(`[data-mission="${BOSS.id}"]`).click();
  await enterMission(page, BOSS);
  await fillMission(page, BOSS);
  await page.locator("#submit").click();
  await expect(page.locator(".badge")).toContainText("Dinilai Nara", { timeout: 20000 });
  await expect(page.locator("#nara-toast")).toContainText("Kamu sudah menunjukkan bukti");
  const teacherContext = await browser.newContext();
  const teacher = await teacherContext.newPage();
  await teacher.goto("/");
  await teacher.getByRole("button", { name: "Guru", exact: true }).click();
  await teacher.getByLabel("Username guru").fill("guru");
  await teacher.getByLabel("Kata sandi").fill("test-password-only");
  await teacher.locator("#auth-form button[type=submit]").click();
  await teacher.getByPlaceholder("Nama lengkap / samaran").fill(alias);
  await teacher.getByRole("button", { name: "Buka" }).click();
  await expect(teacher.locator(".review-form")).toHaveCount(2);
  const correction = teacher.locator(".review-form").first();
  await expect(correction).toContainText("Nara (AI) memberi nilai 100");
  await correction.locator('[name="decision"]').fill("20");
  await correction.locator('[name="comment"]').fill("Koreksi guru: alasan pilihan masih perlu diperdalam.");
  await correction.getByRole("button", { name: "Koreksi" }).click();
  await expect(teacher.locator(".review-form")).toHaveCount(1);
  await expect(teacher.locator(".review-feedback")).toContainText("Koreksi guru");
  await teacherContext.close();
});
