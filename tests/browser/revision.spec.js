import { test, expect } from "@playwright/test";
import { register, enterMission, fillMission } from "./helpers.js";
import { MISSIONS } from "../../src/shared/missions.js";
for (const width of [390, 1440]) {
  test(`Nara remains fixed and map paths follow the island positions at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/");
    const nara = page.locator("#nara-toast");
    await expect(nara).toBeVisible();
    const before = await nara.boundingBox();
    await page.evaluate(() => scrollTo(0, document.body.scrollHeight));
    const after = await nara.boundingBox();
    expect(Math.abs(before.y - after.y)).toBeLessThan(1);
    await page.locator("#nara-close").click();
    await page.locator("#nara-open").click();
    await expect(nara).toBeVisible();
    await register(page);
    await enterMission(page, MISSIONS[0]);
    await expect(page.locator(".resident-plane")).toHaveAttribute(
      "src",
      /prop-cargo-crate/,
    );
    await page.getByRole("button", { name: "Peta", exact: true }).click();
    await expect(nara).toContainText("Pilih pulau yang terbuka untuk langsung masuk ke misi berikutnya.");
    await page.locator("#nara-close").click();
    await expect
      .poll(() => page.locator(".map-links path").getAttribute("d"))
      .toMatch(/^M/);
    const errors = await page.evaluate(() => {
      const grid = document.querySelector(".constellation");
      const coords = document
        .querySelector(".map-links path")
        .getAttribute("d")
        .match(/-?\d+(?:\.\d+)?/g)
        .map(Number);
      return [...grid.querySelectorAll(".island-card")].map((card, i) => {
        const art = card.querySelector(".island-art");
        return (
          Math.abs(
            coords[i * 2] -
              (card.offsetLeft + art.offsetLeft + art.offsetWidth / 2),
          ) +
          Math.abs(
            coords[i * 2 + 1] -
              (card.offsetTop + art.offsetTop + art.offsetHeight / 2),
          )
        );
      });
    });
    expect(Math.max(...errors)).toBeLessThan(1);
    await page.screenshot({
      path: `test-results/map-revision-${width}.png`,
      fullPage: true,
    });
  });
}
test("mission completion separates XP from capability indicators", async ({ page }) => {
  await register(page);
  await enterMission(page, MISSIONS[0]);
  await fillMission(page, MISSIONS[0]);
  await page.locator("#submit").click();
  await expect(page.locator(".score-breakdown")).toContainText("Pencapaian misi: 100 XP");
  await expect(page.locator(".score-breakdown")).toContainText("Total XP inti: 100");
  await expect(page.locator(".score-breakdown")).not.toContainText("Ketepatan");
  await page.getByRole("button", { name: "Peta", exact: true }).click();
  await page.locator("main [data-nav=report]").click();
  await expect(page.locator("main")).toContainText("XP menunjukkan pencapaian permainan");
  await expect(page.locator(".indicator-card").first()).toContainText("Memilih tipe data");
});
test("rak contents stay hidden while selecting answers and appear after Coba", async ({ page }) => {
  await register(page);
  await enterMission(page, MISSIONS[0]);
  await fillMission(page, MISSIONS[0]);
  await page.locator("#submit").click();
  await page.locator("#next").click();
  await enterMission(page, MISSIONS[1]);
  await fillMission(page, MISSIONS[1]);
  await expect(page.locator(".sim-caption")).toContainText("setelah kamu menekan Coba atau Kirim");
  await expect(page.locator(".sim-caption")).not.toContainText("Isi rak saat ini");
  await page.locator("#run").click();
  await expect(page.locator(".sim-caption")).toContainText("Isi rak saat ini");
  await page.locator('[data-answer="append"]').selectOption('rak.insert(0, "Obat")');
  await expect(page.locator(".sim-caption")).not.toContainText("Isi rak saat ini");
});
