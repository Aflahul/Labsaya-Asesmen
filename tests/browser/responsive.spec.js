import { test, expect } from "@playwright/test";
for (const [name, width, height] of [
  ["desktop", 1440, 900],
  ["tablet", 768, 1024],
  ["phone", 390, 844],
])
  test(`responsive ${name} and reduced motion`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await expect(
      page.getByRole("button", { name: "Mulai Petualangan", exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `test-results/home-${name}.png`,
      fullPage: true,
    });
    await page
      .getByRole("button", { name: "Mulai Petualangan", exact: true })
      .click();
    await page.getByLabel("Nama asli").fill("Responsif " + name);
    await page.getByLabel("Nama samaran").fill(name + Date.now());
    await page.getByLabel("Kelas / rombel").fill("X");
    await page.getByLabel("Nomor absen").fill("1");
    await page.getByRole("button", { name: "Buat akun & mulai" }).click();
    await expect(
      page.getByRole("heading", { name: "Bongkar Misi Pameran", exact: true }),
    ).toBeVisible();
    const btn = page.getByRole("button", {
      name: "Siapkan karya",
      exact: false,
    });
    await btn.focus();
    await page.keyboard.press("Enter");
    await expect(btn).toHaveAttribute("aria-pressed", "true");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `test-results/mission-${name}.png`,
      fullPage: true,
    });
  });
