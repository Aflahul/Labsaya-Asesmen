import {test,expect} from '@playwright/test';
test('teacher can grade stored enrichment, skip completed rewards, and see pending failures without touching report',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'Guru',exact:true}).click();
 await page.getByLabel('Username guru').fill('guru');await page.getByLabel('Kata sandi',{exact:true}).fill('test-password-only');await page.locator('#auth-form button[type=submit]').click();
 await expect(page.getByRole('heading',{name:'Perkembangan belajar murid'})).toBeVisible();
 await page.route('**/api/teacher/enrichment',route=>route.fulfill({contentType:'application/json',body:JSON.stringify({data:[{id:'first',xp:null,status:'pending'},{id:'second',xp:null,status:'pending'},{id:'done',xp:90,status:'complete'}]})}));
 const requests=[];await page.route('**/api/teacher/enrichment/*/grade',route=>{
  const id=route.request().url().split('/').at(-2);requests.push(id);
  return route.fulfill({contentType:'application/json',body:JSON.stringify({data:{id,xp:id==='first'?75:null,status:id==='first'?'complete':'unavailable'}})});
 });
 await page.getByText('XP pengayaan',{exact:true}).click();await page.getByRole('button',{name:'Nilai XP pengayaan',exact:true}).click();
 await expect(page.locator('#enrichment-grading-status')).toHaveText('1 dinilai; 1 hasil menyusul.');
 await expect(page.getByRole('button',{name:'Nilai XP pengayaan',exact:true})).toBeEnabled();expect(requests).toEqual(['first','second']);
});
