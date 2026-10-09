import { test, expect } from "@playwright/test";
test("register and start expedition with skip travel", async ({ page }) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Mulai Petualangan", exact: true })
    .click();
  await page.getByLabel("Nama asli").fill("Murid Uji");
  await page.getByLabel("Nama samaran").fill("Bintang" + Date.now());
  await page.getByLabel("Kelas / rombel").fill("X RPL");
  await page.getByLabel("Nomor absen").fill("1");
  await page.getByRole("button", { name: "Buat akun & mulai" }).click();
  await page.getByRole("button", { name: "Lewati perjalanan" }).click();
  await expect(
    page.getByRole("heading", { name: "Bongkar Misi Pameran", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Periksa jawaban", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("belum");
});
