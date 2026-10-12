import { test, expect } from "@playwright/test";

test("teacher creates a student and resets access without exposing stored hashes", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Daftar", exact: true }),
  ).toHaveCount(0);
  await page.locator('[data-nav="teacher-login"]').click();
  await page.getByLabel("Username guru").fill("guru");
  await page.getByLabel("Kata sandi").fill("test-password-only");
  await page.locator("#auth-form button[type=submit]").click();
  await expect(page.locator("#student-create-form")).not.toBeVisible();
  await page.getByText("Buat akun murid").click();
  const form = page.locator("#student-create-form");
  await expect(form.getByText("Nama lengkap murid")).toBeVisible();
  await expect(form.getByText("Nama samaran untuk peringkat")).toBeVisible();
  await form.locator('[name="realName"]').fill("Siswa Aman");
  await form.locator('[name="alias"]').fill("AmanUji");
  await form.locator('[name="className"]').fill("X RPL 1");
  await form.locator('[name="attendance"]').fill("9");
  await form.getByRole("button", { name: "Buat akun" }).click();
  await expect(page.locator("#student-credentials")).toContainText(
    "Akun dibuat · Siswa Aman",
  );
  const first = await page
    .locator("#student-credentials p")
    .first()
    .innerText();
  const password = first.split("Kata sandi: ")[1];
  expect(password?.length).toBeGreaterThanOrEqual(20);
  const row = page.locator("#teacher-table tr").filter({ hasText: "AmanUji" });
  await expect(row).toContainText("X RPL 1");
  await row.locator("[data-reset-password]").click();
  await expect(page.locator("#student-credentials")).toContainText(
    "Kata sandi baru",
  );
  const second = (
    await page.locator("#student-credentials p").first().innerText()
  ).split("Kata sandi: ")[1];
  expect(second).not.toBe(password);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
