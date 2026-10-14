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

for(const width of [390,1440]) {
 test(`game leaderboard displays every award tier without overflow at ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:844});
  const regular=[1,2,3,4,10,11,35].map(rank=>({alias:rank===1?'Penjelajah Sangat Panjang 1234567890':`Teman ${rank}`,rank,score:1500,activeSeconds:1000,hints:0,attempts:15,sepuh:false}));
  await page.route('**/api/leaderboard',route=>route.fulfill({contentType:'application/json',body:JSON.stringify({data:[{alias:'Sepuh pertama',rank:null,score:1500,activeSeconds:905,hints:2,attempts:17,sepuh:true,enrichmentXp:75},...regular]})}));
  await page.goto('/');await page.getByRole('button',{name:'Peringkat',exact:true}).click();
  await expect(page.getByRole('heading',{level:1,name:'Peringkat penjelajah'})).toBeVisible();
  await expect(page.getByText('Lihat pencapaianmu di antara para penjelajah.',{exact:true})).toBeVisible();
  const cards=page.locator('.rank-card');await expect(cards).toHaveCount(8);
  await expect(page.locator('.leaderboard table')).toHaveCount(0);
  await expect(cards.first()).toHaveClass(/rank-sepuh/);
  await expect(cards.first().locator('.sepuh-badge')).toHaveText('Sepuh');
  await expect(cards.first().locator('.rank-bonus')).toHaveText('+75');
  await expect(cards.first()).toContainText('1500 XP inti');
  await expect(cards.first().locator('.rank-number')).toHaveCount(0);
  await expect(cards.first().locator('[data-stat="attempts"] dd')).toHaveText('17');
  await expect(page.locator('.rank-gold .rank-number')).toHaveText('1');
  await expect(page.locator('.rank-silver .rank-number')).toHaveText('2');
  await expect(page.locator('.rank-bronze .rank-number')).toHaveText('3');
  await expect(page.locator('.rank-elite')).toHaveCount(2);
  await expect(page.locator('.rank-explorer')).toHaveCount(2);
  await expect(page.locator('.rank-explorer .rank-number')).toHaveText(['11','35']);
  await expect(page.locator('.rank-gold')).toContainText('1500');
  await expect(page.locator('.leaderboard')).toContainText('15 m 5 dtk');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:`work/leaderboard-${width}.png`,fullPage:true});
 });
}
