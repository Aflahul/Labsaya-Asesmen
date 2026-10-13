import {test,expect} from '@playwright/test';
import {CORE_MISSIONS,BOSS} from '../../src/shared/missions.js';
import {register,enterMission,fillMission,waitForSaved} from './helpers.js';
test('unknown boss reasoning gets no fabricated praise and no numeric ability level',async({page})=>{
 test.skip(process.env.TEST_INDICATOR_GRADER!=='1','Uses synthetic reviewer responses');test.setTimeout(180000);
 await register(page,'Siswa Bukti');
 for(const m of CORE_MISSIONS){await enterMission(page,m);await fillMission(page,m);await page.locator('#submit').click();await waitForSaved(page);await page.locator('#next').click();}
 await page.locator(`[data-mission="${BOSS.id}"]`).click();await enterMission(page,BOSS);
 for(const [key] of BOSS.written)await page.locator(`[data-answer="${key}"]`).fill('tidak tauuu');
 await page.locator('#submit').click();await waitForSaved(page);await expect(page.locator('.indicator-results')).toContainText('Belum cukup bukti');
 await expect(page.locator('#nara-toast')).toContainText('−2 kg');await expect(page.locator('#nara-toast')).not.toContainText('Kamu sudah');
 await expect(page.locator('.indicator-results')).not.toContainText('3/4');await expect(page.locator('.score-breakdown')).toContainText('Total XP inti: 1500');
});
