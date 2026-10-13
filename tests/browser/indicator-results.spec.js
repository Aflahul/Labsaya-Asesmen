import {test,expect} from '@playwright/test';
import {register,enterMission,fillMission,waitForSaved} from './helpers.js';
import {MISSIONS} from '../../src/shared/missions.js';
test('three reviews persist, learner sees capabilities, free replay and independent transfer',async({page})=>{
 test.skip(process.env.TEST_INDICATOR_GRADER!=='1','Synthetic three-provider grading fixture');
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await register(page);await enterMission(page,MISSIONS[0]);await fillMission(page,MISSIONS[0]);await page.locator('#submit').click();await waitForSaved(page);
 await expect(page.locator('.indicator-results')).toContainText('tiga penilai sepakat');await expect(page.locator('.score-breakdown')).toContainText('100 XP');
 await expect.poll(()=>page.locator('.nara-toast-message').innerText()).toContain('kasus baru');
 const msg=await page.locator('.nara-toast-message').innerText();expect(Array.from(msg).length).toBeGreaterThanOrEqual(300);expect(Array.from(msg).length).toBeLessThanOrEqual(400);
 await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.locator('#mastery-check').click();await page.locator('[data-answer=response]').fill('Nomor kontak String karena nol awal dipertahankan, berat Float, paket 4 dan belum disetujui False.');await page.locator('#submit').click();await waitForSaved(page);
 await expect(page.locator('.indicator-results')).toContainText('4/4');await expect(page.locator('.score-breakdown')).toContainText('Total XP inti: 100');
 await page.locator('#replay').click();await fillMission(page,MISSIONS[0]);await page.locator('#submit').click();await waitForSaved(page);await expect(page.locator('.score-breakdown')).toContainText('Total XP inti: 100');
 await page.getByRole('button',{name:'Rapor',exact:true}).click();await expect(page.locator('.indicator-card').first()).toContainText('Memenuhi mandiri');
 expect(errors).toEqual([]);
});
test('long transfer drafts survive reload without one event per keystroke',async({page})=>{
 await register(page);await enterMission(page,MISSIONS[0]);await fillMission(page,MISSIONS[0]);await page.locator('#submit').click();await waitForSaved(page);await page.locator('#mastery-check').click();
 const answer='Penjelasan data '.repeat(200);await page.locator('[data-answer=response]').fill(answer);
 await page.reload();await page.getByRole('button',{name:'Lanjut',exact:true}).click();await page.locator('.island-art[data-island="1"]').click();await enterMission(page,MISSIONS[0]);
 await expect(page.locator('[data-answer=response]')).toHaveValue(answer);
 const events=await page.evaluate(()=>{const a=JSON.parse(localStorage.getItem('pulau:last-account'));return JSON.parse(localStorage.getItem(`pulau:progress:v1:${a.user.id}`)).sessions.at(-1).events.length;});expect(events).toBeLessThan(10);
});
