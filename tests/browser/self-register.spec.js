import { test, expect } from "@playwright/test";

test("a student creates an account and returns with their chosen password", async ({
  page,
}) => {
  const alias = `Daftar${Date.now()}`;
  const password = "rahasia-murid-2026";
  await page.goto("/");
  await page.locator('.hero [data-nav="register"]').click();
  await page.getByLabel("Nama lengkap murid").fill("Dewi Larasati");
  await page.getByLabel("Nama samaran").fill(alias);
  await page.getByLabel("Kelas").fill("X RPL 1");
  await page.getByLabel("Nomor absen").fill("8");
  await page.getByLabel("Kata sandi", { exact: true }).fill(password);
  await page.getByLabel("Ulangi kata sandi").fill(password);
  await page.locator('#auth-form button[type="submit"]').click();
  await expect(page.locator(".island-card")).toHaveCount(5);
  await page.getByRole("navigation").getByRole("button", { name: "Rapor" }).click();
  await expect(
    page.getByRole("heading", { name: "Dewi Larasati" }),
  ).toBeVisible();
  await page.locator("#logout").click();
  await page.locator('.hero [data-nav="login"]').click();
  await page.getByLabel("Nama samaran").fill(alias);
  await page.getByLabel("Kata sandi").fill(password);
  await page.locator('#auth-form button[type="submit"]').click();
  await expect(page.locator(".island-card")).toHaveCount(5);
});
