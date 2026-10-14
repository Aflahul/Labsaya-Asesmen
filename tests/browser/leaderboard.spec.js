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
  await page.getByText("Bagaimana urutannya?",{exact:true}).click();
  await expect(
    page.getByText("Nama samaranmu tampil di sini", {
      exact: false,
    }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Kembali" })).toBeVisible();
});

test('leaderboard shows time, hints and Sepuh without overflowing a phone screen',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.route('**/api/leaderboard',route=>route.fulfill({contentType:'application/json',body:JSON.stringify({data:[{alias:'Penjelajah Sangat Panjang 1234567890',rank:null,score:1500,activeSeconds:905,hints:2,sepuh:true},{alias:'Teman',rank:1,score:1500,activeSeconds:1000,hints:0,sepuh:false}]})}));
 await page.goto('/');await page.getByRole('button',{name:'Peringkat',exact:true}).click();
 await expect(page.getByRole('heading',{level:1,name:'Peringkat penjelajah'})).toBeVisible();
 await expect(page.locator('.sepuh-badge')).toHaveCount(1);
 await expect(page.locator('.leaderboard tbody tr').first().locator('td').first()).toHaveText('Sepuh');
 await expect(page.locator('.leaderboard tbody tr').first().locator('td').nth(1)).not.toContainText('Sepuh');
 await expect(page.locator('.leaderboard tbody tr').nth(1).locator('td').first()).toHaveText('1');await expect(page.locator('.leaderboard')).toContainText('15 m 5 dtk');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
