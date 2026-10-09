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
test("cancelled logout resumes active timer and corrupt cache is retained", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Mulai Petualangan", exact: true })
    .click();
  await page.getByLabel("Nama asli").fill("Integritas Uji");
  await page.getByLabel("Nama samaran").fill("Integritas" + Date.now());
  await page.getByLabel("Kelas / rombel").fill("X");
  await page.getByLabel("Nomor absen").fill("1");
  await page.getByRole("button", { name: "Buat akun & mulai" }).click();
  await page.getByRole("button", { name: "Lewati perjalanan" }).click();
  await page
    .getByRole("button", { name: "Siapkan karya", exact: false })
    .click();
  await page
    .getByRole("button", { name: "Matikan suara", exact: true })
    .click();
  page.once("dialog", (d) => d.dismiss());
  await page.getByRole("button", { name: "Keluar", exact: true }).click();
  const before = await page.evaluate(() => {
    const a = JSON.parse(localStorage.getItem("pulau:last-account"));
    return JSON.parse(localStorage.getItem(`pulau:progress:v1:${a.user.id}`))
      .sessions[0].activeMs;
  });
  await expect
    .poll(
      () =>
        page.evaluate(() => {
          const a = JSON.parse(localStorage.getItem("pulau:last-account"));
          return JSON.parse(
            localStorage.getItem(`pulau:progress:v1:${a.user.id}`),
          ).sessions[0].activeMs;
        }),
      { timeout: 10000 },
    )
    .toBeGreaterThan(before + 1000);
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
