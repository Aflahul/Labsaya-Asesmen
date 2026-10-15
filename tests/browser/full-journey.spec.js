import {test,expect} from '@playwright/test';
import {CORE_MISSIONS,BOSS} from '../../src/shared/missions.js';
import {register,enterMission,fillMission,waitForSaved} from './helpers.js';
import {getIndicatorRubric} from '../../src/shared/indicator-rubrics.js';
test('all missions, teacher correction, boss and XP remain separate from capability',async({page,browser})=>{
 test.setTimeout(240000);const errors=[];page.on('pageerror',e=>errors.push(e.message));const alias='Ekspedisi'+Date.now();
 await register(page,'Siswa Lengkap',alias);
 for(const m of CORE_MISSIONS){await enterMission(page,m);await fillMission(page,m);await page.locator('#submit').click();await expect(page.locator('.badge')).toContainText('Aktivitas selesai');await waitForSaved(page);await page.locator('#next').click();}
 await expect(page.getByRole('heading',{name:'Menara Awan kembali menyala.'})).toBeVisible();await page.locator(`[data-mission="${BOSS.id}"]`).click();await enterMission(page,BOSS);
 await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await fillMission(page,BOSS);await page.locator('#submit').click();await waitForSaved(page);
 const tc=await browser.newContext(),teacher=await tc.newPage();await teacher.goto('/');await teacher.getByRole('button',{name:'Guru',exact:true}).click();await teacher.getByLabel('Username guru').fill('guru');await teacher.getByLabel('Kata sandi',{exact:true}).fill('test-password-only');await teacher.locator('#auth-form button[type=submit]').click();
 await teacher.getByPlaceholder('Nama lengkap / samaran').fill(alias);await teacher.locator('#knowledge-table [data-report]').click();
 const form=teacher.locator(`.indicator-review-form[data-review]`).last();await form.locator('..').locator(':scope > summary').click();
 for(const i of getIndicatorRubric(BOSS.id).indicators){await form.locator(`[name="${i.id}"]`).selectOption('2');await form.locator(`[name="reason:${i.id}"]`).fill('Bagian aturan ini masih perlu diperjelas berdasarkan jawaban.');}
 await form.locator('[name=comment]').fill('Pengayaan perlu dilengkapi; XP inti tetap.');await form.getByRole('button',{name:'Simpan',exact:true}).click();
 await expect(teacher.locator('main')).toContainText('XP inti: 1500');
 await page.reload();await page.getByRole('button',{name:'Rapor',exact:true}).click();await expect(page.locator('main')).toContainText('XP inti: 1500');
 await page.getByRole('button',{name:'Peringkat',exact:true}).click();await expect(page.locator('.rank-card').filter({hasText:alias})).toContainText('1500');await expect(page.locator('main')).not.toContainText('Siswa Lengkap');
 expect(errors).toEqual([]);await tc.close();
});
