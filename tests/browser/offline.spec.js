import { test, expect } from "@playwright/test";
test("built application reloads offline with isolated participant cache", async ({
  page,
  context,
}) => {
  test.skip(
    !process.env.TEST_BUILD,
    "Service worker enabled only in production build",
  );
  page.on("pageerror", (e) => console.log("PAGE ERROR", e.message));
  page.on("requestfailed", (r) => console.log("REQUEST FAILED", r.url()));
  await page.goto("/");
  await page
    .getByRole("button", { name: "Mulai Petualangan", exact: true })
    .click();
  await page.getByLabel("Nama asli").fill("Offline Uji");
  await page.getByLabel("Nama samaran").fill("Offline" + Date.now());
  await page.getByLabel("Kelas / rombel").fill("X");
  await page.getByLabel("Nomor absen").fill("1");
  await page.getByRole("button", { name: "Buat akun & mulai" }).click();
  await page.getByRole("button", { name: "Lewati perjalanan" }).click();
  await page
    .getByRole("button", { name: "Siapkan karya", exact: false })
    .click();
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  console.log(
    "CACHE CONTENTS",
    await page.evaluate(async () => {
      const c = await caches.open((await caches.keys())[0]);
      return await Promise.all(
        (await c.keys()).map(async (r) => ({
          url: r.url,
          vary: (await c.match(r)).headers.get("vary"),
        })),
      );
    }),
  );
  await context.setOffline(true);
  await page.reload();
  console.log(
    "OFFLINE DIAGNOSTIC",
    await page.evaluate(async () => ({
      online: navigator.onLine,
      html: document.body.innerHTML.slice(0, 200),
      account: localStorage.getItem("pulau:last-account")?.length,
      cache: await caches.keys(),
      worker: !!navigator.serviceWorker.controller,
    })),
  );
  await page
    .getByRole("button", { name: "Lanjutkan Petualangan", exact: true })
    .click({ timeout: 15000 });
  await page.locator('[data-island="1"]').click();
  await page.getByRole("button", { name: "Lewati perjalanan" }).click();
  await expect(
    page.getByRole("button", { name: "Siapkan karya", exact: false }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Atur tamu", exact: false }).click();
  await context.setOffline(false);
  await expect(page.locator("[data-sync]").first()).toContainText(
    "Tersinkron",
    { timeout: 20000 },
  );
});
