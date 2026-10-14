import {test,expect} from '@playwright/test';
import {register,enterMission,fillMission,waitForSaved} from './helpers.js';
import {CORE_MISSIONS} from '../../src/shared/missions.js';
const snapshot=page=>page.evaluate(()=>{const a=JSON.parse(localStorage.getItem('pulau:last-account'));const p=JSON.parse(localStorage.getItem(`pulau:progress:v1:${a.user.id}`));return p.sessions.map(s=>({id:s.id,events:s.events.length,status:s.status}));});
test('completed island opens saved results without creating or modifying attempts',async({page})=>{
 await register(page);
 for(let i=0;i<3;i++){
  await enterMission(page,CORE_MISSIONS[i]);await fillMission(page,CORE_MISSIONS[i]);await page.locator('#submit').click();await waitForSaved(page);
  if(i<2)await page.locator('#next').click();
 }
 await page.getByRole('button',{name:'Peta',exact:true}).click();const before=await snapshot(page);
 await page.locator('.island-art[data-island="1"]').click();
 await expect(page.locator('.mission-history')).toBeVisible();await expect(page.getByRole('button',{name:'Lihat Hasil',exact:true})).toHaveCount(3);
 await expect(page.locator('#begin-mission')).toHaveCount(0);
 await page.getByRole('button',{name:'Lihat Hasil',exact:true}).first().click();
 await expect(page.locator('.indicator-results')).toBeVisible();await expect(page.locator('#submit')).toHaveCount(0);
 expect(await snapshot(page)).toEqual(before);
 await page.getByRole('button',{name:'Rapor',exact:true}).click();
 await expect(page.getByRole('heading',{level:1,name:'Rapor Kemampuan'})).toBeVisible();
 await expect(page.locator('.summary-grid')).toContainText('Bukti belum cukup');await expect(page.locator('.summary-grid')).toContainText('Menunggu penilaian');
 const first=page.locator('.indicator-card').first();await first.getByText('Dasar penilaian',{exact:true}).click();
 await expect(first).toContainText('Belum ditinjau guru');await expect(first).toContainText('String');
 await first.getByText('Acuan kemampuan',{exact:true}).click();await expect(first.locator('ol li')).toHaveCount(4);
 await expect(page.locator('[data-sync]')).toHaveAttribute('aria-live','polite');
});
test('required form validation uses Indonesian and clears after editing',async({page})=>{
 await page.goto('/');await page.locator('.hero [data-nav="login"]').click();
 await page.locator('#auth-form [type=submit]').click();
 expect(await page.locator('#alias').evaluate(el=>el.validationMessage)).toBe('Isi bagian ini terlebih dahulu.');
 await page.locator('#alias').fill('MuridUji');
 expect(await page.locator('#alias').evaluate(el=>el.validationMessage)).toBe('');
});
