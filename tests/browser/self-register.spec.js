import { test, expect } from "@playwright/test";

test("a student creates an account and returns with their chosen password", async ({
  page,
}) => {
  test.setTimeout(20000);
  const alias = `Daftar${Date.now()}`;
  const password = "rahasia-murid-2026";
  await page.goto("/");
  await page.locator('.hero [data-nav="register"]').click();
  await page.getByLabel("Nama lengkap murid").fill("Dewi Larasati");
  await page.getByLabel("Nama samaran").fill(alias);
  await page.getByLabel("Kelas").fill("X RPL 1");
  await page.getByLabel("Nomor absen").fill("8");
  await page.getByLabel("Kata sandi", { exact: true }).fill(password);
  await page
    .getByRole("button", { name: "Tampilkan sandi", exact: true })
    .click();
  await expect(page.getByLabel("Kata sandi", { exact: true })).toHaveAttribute(
    "type",
    "text",
  );
  await page.getByLabel("Ulangi kata sandi", { exact: true }).fill(password);
  await page.locator('#auth-form button[type="submit"]').click();
  await expect(
    page.getByRole("heading", { name: "Simpan kode pemulihan" }),
  ).toBeVisible();
  const initialCode = await page.getByLabel("Kode pemulihan").inputValue();
  expect(initialCode.length).toBeGreaterThanOrEqual(20);
  expect(await page.evaluate(() => localStorage.getItem("pulau:last-account"))).not.toContain(initialCode);
  await page.getByRole("button", { name: "Lanjut ke peta" }).click();
  await expect(page.locator(".island-card")).toHaveCount(5);
  await page.getByRole("button", { name: "Pengaturan" }).click();
  await page.getByLabel("Kata sandi saat ini", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Buat kode baru" }).click();
  const code = await page.getByLabel("Kode pemulihan").inputValue();
  expect(code).not.toBe(initialCode);
  await page.getByRole("button", { name: "Lanjut ke peta" }).click();
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Rapor" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Dewi Larasati" }),
  ).toBeVisible();
  await page.locator("#logout").click();
  await page.locator('.hero [data-nav="login"]').click();
  await page.getByRole("button", { name: "Lupa kata sandi?" }).click();
  await page.getByLabel("Nama samaran").fill(alias);
  await page.getByLabel("Kode pemulihan").fill(code);
  await page
    .getByLabel("Kata sandi baru", { exact: true })
    .fill("sandi-baru-2026");
  await page
    .getByLabel("Ulangi kata sandi baru", { exact: true })
    .fill("sandi-baru-2026");
  await page.getByRole("button", { name: "Simpan kata sandi baru" }).click();
  await expect(
    page.getByRole("heading", { name: "Simpan kode pemulihan" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Masuk" }).last().click();
  await page.getByLabel("Nama samaran").fill(alias);
  await page.getByLabel("Kata sandi", { exact: true }).fill("sandi-baru-2026");
  await page.locator('#auth-form button[type="submit"]').click();
  await expect(page.locator(".island-card")).toHaveCount(5);
});
