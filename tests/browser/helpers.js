import { expect } from "@playwright/test";
import { solution } from "../fixtures/solutions.js";
export async function register(
  page,
  name = "Murid Uji",
  alias = "Uji" + Date.now(),
) {
  await page.goto("/");
  await page.getByRole("button", { name: "Daftar", exact: true }).click();
  await expectShortButtons(page);
  await page.getByLabel("Nama asli").fill(name);
  await page.getByLabel("Nama samaran").fill(alias);
  await page.getByLabel("Kelas / rombel").fill("X RPL");
  await page.getByLabel("Nomor absen").fill("1");
  // The complete browser suite can legitimately reach the production limit
  // of ten registrations per minute. Honor Retry-After rather than weakening it.
  for (let attempt = 0; attempt < 2; attempt++) {
    const responsePromise = page.waitForResponse(
      (r) =>
        r.url().endsWith("/api/register") && r.request().method() === "POST",
    );
    await page.getByRole("button", { name: "Daftar" }).click();
    const response = await responsePromise;
    if (response.status() !== 429 || attempt === 1) {
      expect(response.ok(), `Registration returned ${response.status()}`).toBe(
        true,
      );
      break;
    }
    const retry = Number(response.headers()["retry-after"]);
    expect(retry).toBeGreaterThanOrEqual(0);
    expect(retry).toBeLessThanOrEqual(60);
    await page.waitForTimeout(retry * 1000 + 250);
  }
}
export async function enterMission(page, m) {
  await page
    .getByRole("button", { name: "Lewati" })
    .click({ timeout: 2000 })
    .catch(() => {});
  await page.locator("#begin-mission").click();
  await expect(
    page.getByRole("heading", { name: m.title, exact: true }),
  ).toBeVisible();
  await expectShortButtons(page);
}
export async function fillMission(page, m) {
  for (const a of solution(m)) {
    const el = page.locator(`[data-answer="${a.key}"]`);
    if (await el.evaluate((e) => e.tagName === "SELECT"))
      await el.selectOption(a.value);
    else await el.fill(a.value);
  }
}
export async function expectShortButtons(page) {
  const long = await page
    .locator("button:visible")
    .evaluateAll((buttons) =>
      buttons
        .map((b) => b.innerText.trim())
        .filter((text) => (text.match(/[\p{L}\p{N}]+/gu) || []).length > 2),
    );
  expect(long, "Visible buttons should use at most two words").toEqual([]);
}
