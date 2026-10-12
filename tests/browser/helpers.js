import { expect } from "@playwright/test";
import { solution } from "../fixtures/solutions.js";
// Browser fixture: teacher provisions the account, then the student logs in.
export async function register(
  page,
  name = "Murid Uji",
  alias = "Uji" + Date.now(),
) {
  await page.goto("/");
  let teacher;
  for (let attempt = 0; attempt < 2; attempt++) {
    teacher = await page.request.post("/api/teacher/login", {
      data: { username: "guru", password: "test-password-only" },
    });
    if (teacher.status() !== 429 || attempt === 1) break;
    const retry = Number(teacher.headers()["retry-after"] || 1);
    await page.waitForTimeout(retry * 1000 + 250);
  }
  expect(teacher.ok(), `Teacher login returned ${teacher.status()}`).toBe(true);
  const { csrf } = (await teacher.json()).data;
  const created = await page.request.post("/api/teacher/participants", {
    headers: { "x-csrf-token": csrf },
    data: { realName: name, alias, className: "X RPL", attendance: 1 },
  });
  expect(created.status()).toBe(201);
  const { password } = (await created.json()).data;
  await page.request.post("/api/logout", { headers: { "x-csrf-token": csrf } });
  await page.goto("/");
  await page.locator(".hero [data-nav=login]").click();
  await page.getByLabel("Nama samaran").fill(alias);
  await page.getByLabel("Kata sandi").fill(password);
  await page.locator("#auth-form button[type=submit]").click();
  await expect(page.locator(".island-card")).toHaveCount(5);
  await page.locator('.island-art[data-island="1"]').click();
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

export async function waitForSaved(page) {
  await expect
    .poll(
      () =>
        page.evaluate(() => {
          const account = JSON.parse(
            localStorage.getItem("pulau:last-account"),
          );
          const progress = JSON.parse(
            localStorage.getItem(`pulau:progress:v1:${account.user.id}`),
          );
          return (
            !!progress?.sessions.length &&
            progress.sessions.every(
              (s) => s.serverCreated && s.syncedCount === s.events.length,
            )
          );
        }),
      { timeout: 15000 },
    )
    .toBe(true);
}
