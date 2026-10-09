import { test, expect } from "@playwright/test";
import { MISSIONS } from "../../src/shared/missions.js";
import { solution } from "../fixtures/solutions.js";
test("all 18 missions through real controls, report and teacher dashboard", async ({
  page,
}) => {
  test.setTimeout(300000);
  await page.goto("/");
  await page
    .getByRole("button", { name: "Mulai Petualangan", exact: true })
    .click();
  await page.getByLabel("Nama asli").fill("Siswa Lengkap");
  await page.getByLabel("Nama samaran").fill("Lengkap" + Date.now());
  await page.getByLabel("Kelas / rombel").fill("X RPL");
  await page.getByLabel("Nomor absen").fill("3");
  await page.getByRole("button", { name: "Buat akun & mulai" }).click();
  for (let i = 0; i < MISSIONS.length; i++) {
    const m = MISSIONS[i];
    console.log("Misi:", m.id);
    if (i === 16) {
      await page
        .getByRole("button", { name: "Peta dunia", exact: true })
        .click();
      await page.locator('[data-island="9"]').click();
    }
    await page
      .getByRole("button", { name: "Lewati perjalanan" })
      .click({ timeout: 3000 })
      .catch(async () => {
        await expect(
          page.getByRole("heading", { name: m.title, exact: true }),
        ).toBeVisible();
      });
    await expect(
      page.getByRole("heading", { name: m.title, exact: true }),
    ).toBeVisible();
    for (const a of solution(m)) {
      if (a.op === "place") {
        await page
          .locator(`select[data-select="place"][data-index="${a.index}"]`)
          .selectOption(String(a.group));
      } else if (a.op === "symbol") {
        await page
          .locator(`select[data-select="symbol"][data-index="${a.index}"]`)
          .selectOption(a.value);
      } else if (a.op === "branch") {
        await page.locator(`#branch-${a.branch}`).selectOption(a.value);
      } else if (a.op === "boundary") {
        await page.getByLabel("Batas keputusan").fill(String(a.value));
        await page.getByLabel("Batas keputusan").press("Tab");
      } else if (["set", "delete", "append", "read"].includes(a.op)) {
        await page.locator("#array-index").fill(String(a.index ?? 0));
        if (a.value) await page.locator("#array-value").fill(a.value);
        await page.locator(`[data-array="${a.op}"]`).click();
      } else {
        await page
          .locator(
            "button[data-action=" + JSON.stringify(JSON.stringify(a)) + "]",
          )
          .click();
      }
    }
    if (await page.locator("#submit").count())
      await page.locator("#submit").click();
    await expect(page.getByRole("status")).toContainText("berhasil");
    await page.locator("#next").click();
    if (i === 15) {
      await expect(
        page.getByRole("heading", { name: "Siswa Lengkap", exact: true }),
      ).toBeVisible();
      await expect(page.locator(".summary-card").nth(1)).toContainText("100");
    }
  }
  await expect(page.locator(".summary-card").nth(0)).toContainText("16/16");
  await page.reload();
  await page.getByRole("button", { name: "Rapor saya", exact: true }).click();
  await expect(page.locator(".summary-card").nth(0)).toContainText("16/16");
  await page.screenshot({
    path: "test-results/report-desktop.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Guru", exact: true }).click();
  await page.getByLabel("Username guru").fill("guru");
  await page
    .getByLabel("Kata sandi", { exact: true })
    .fill("test-password-only");
  await page.getByRole("button", { name: "Masuk", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Perjalanan belajar, terlihat." }),
  ).toBeVisible();
  await page.getByPlaceholder("Nama asli / samaran").fill("Siswa Lengkap");
  await expect(page.locator("#teacher-table")).toContainText("16/16");
});
