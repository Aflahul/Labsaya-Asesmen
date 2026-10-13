import {test,expect} from 'vitest';
import {indicatorResultsHtml,indicatorMissionHtml} from '../../src/client/ui/indicator-results.js';
import {getMission} from '../../src/shared/missions.js';
import {updateDraft} from '../../src/client/drafts.js';
test('indicator results show capability, evidence and pending status without numeric game score',()=>{
 const m=getMission('v2p01m01');const html=indicatorResultsHtml(m,{status:'partial',indicators:[{id:'v2p01m01.types',level:2,status:'partial',reason:'Periksa <script>kode</script>',references:[{key:'phone',quote:'Integer'}]}]});
 expect(html).toContain('Memilih tipe data');expect(html).toContain('Sementara');expect(html).not.toContain('<script>');expect(html).not.toContain('Nilai kompetensi misi');
});
test('new completed mission has free replay, transfer check and separate XP',()=>{
 const m=getMission('v2p01m01'),s={status:'complete',state:{answers:{}},activeMs:0,indicatorAssessment:{status:'unavailable',indicators:[]}};
 const html=indicatorMissionHtml(m,s,{completed:1,xp:100},'');expect(html).toContain('100 XP');expect(html).toContain('Uji Mandiri');expect(html).toContain('Mengulang gratis');expect(html).toContain('tidak mengurangi XP');
});
test('transfer answer drafts are validated and accepted',()=>{
 const s={status:'active',masteryCheck:{}};updateDraft(s,getMission('v2p01m01'),'response','String');expect(s.draftAnswers.response).toBe('String');
});
