import { test, expect } from "@playwright/test";

test("leaderboard recovers from a failed request instead of staying on loading", async ({
  page,
}) => {
  let failOnce = true;
  await page.route("**/api/leaderboard", async (route) => {
    if (failOnce) {
      failOnce = false;
      await route.abort();
    } else {
      await route.continue();
    }
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Peringkat" }).click();
  await expect(page.getByRole("alert")).toContainText("Failed to fetch");
  await page.getByRole("button", { name: "Coba lagi" }).click();
  await expect(page.getByText("Memuat peringkat…")).toHaveCount(0);
  await expect(
    page.getByText("Hanya nama samaran yang ditampilkan di sini", {
      exact: false,
    }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Kembali" })).toBeVisible();
});
