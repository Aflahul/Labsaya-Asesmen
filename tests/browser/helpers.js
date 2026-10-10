import { expect } from "@playwright/test";
import { solution } from "../fixtures/solutions.js";
export async function register(
  page,
  name = "Murid Uji",
  alias = "Uji" + Date.now(),
) {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Mulai ekspedisi", exact: true })
    .click();
  await page.getByLabel("Nama asli").fill(name);
  await page.getByLabel("Nama samaran").fill(alias);
  await page.getByLabel("Kelas / rombel").fill("X RPL");
  await page.getByLabel("Nomor absen").fill("1");
  await page.getByRole("button", { name: "Buat akun & mulai" }).click();
}
export async function enterMission(page, m) {
  await page
    .getByRole("button", { name: "Lewati perjalanan" })
    .click({ timeout: 2000 })
    .catch(() => {});
  await expect(
    page.getByRole("heading", { name: m.title, exact: true }),
  ).toBeVisible();
}
export async function fillMission(page, m) {
  for (const a of solution(m)) {
    const el = page.locator(`[data-answer="${a.key}"]`);
    if (await el.evaluate((e) => e.tagName === "SELECT"))
      await el.selectOption(a.value);
    else await el.fill(a.value);
  }
}
