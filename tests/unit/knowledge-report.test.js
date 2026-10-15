import {test,expect} from 'vitest';
import {CORE_MISSIONS,getMission} from '../../src/shared/missions.js';
import {buildKnowledgeReport,knowledgeRows,knowledgeExportRows} from '../../src/shared/knowledge-report.js';
const submitted=(id,answers,extra={})=>({id,missionId:id,missionVersion:2,status:'complete',submittedAt:'2026-10-15T01:00:00Z',state:{answers},...extra});
const correct=id=>submitted(id,{...getMission(id).rules.answers});
test('material average weights indicators equally, awards exact answers 90, and includes assisted answers without AI reviews',()=>{
 const sessions=CORE_MISSIONS.filter(m=>m.island===1).map(m=>correct(m.id));sessions[0].state.answers.phone='Integer';sessions[0].hints=20;
 const material=buildKnowledgeReport(sessions).materials[0];
 expect(material.indicators.map(i=>i.score)).toEqual([50,90,90,90]);expect(material.score).toBe(80);expect(material.assessed).toBe(4);
});
test('unknown or unsubmitted responses do not invent marks, while explicit not-knowing and wrong answers receive 10',()=>{
 const empty=buildKnowledgeReport([]);expect(empty.materials.every(m=>m.score===null)).toBe(true);
 const m=getMission('v2p05m03');
 expect(buildKnowledgeReport([submitted(m.id,{choice:'A',reason:'tidak tahu',evidence:'tidak tahu'})]).materials[4].indicators.slice(-3).map(i=>i.score)).toEqual([null,10,10]);
 const active={...correct('v2p01m01'),status:'active',submittedAt:null};expect(buildKnowledgeReport([active]).materials[0].score).toBeNull();
 const wrong=submitted('v2p01m01',{phone:'Integer',weight:'String',count:'0',ready:'False'});expect(buildKnowledgeReport([wrong]).materials[0].score).toBe(10);
});
test('numeric AI results can be used without quote, consensus or independence gates; teacher decisions take precedence',()=>{
 const s=submitted('v2p05m03',{choice:'A',reason:'Alasan sendiri',evidence:'Contoh pengujian'},{indicatorAssessment:{status:'needs_review',evidenceMode:'practice',indicators:[{id:'v2p05m03.decision',level:3},{id:'v2p05m03.evidence',level:2},{id:'v2p05m03.reason',level:1}]}});
 const scores=buildKnowledgeReport([s]).materials[4].indicators.slice(-3).map(i=>i.score);expect(scores).toEqual([90,50,10]);
 const teacher=correct('v2p01m01');teacher.indicatorAssessment={source:'teacher',status:'teacher',indicators:[{id:'v2p01m01.types',level:2,reason:'Pilihan perlu diperbaiki.'}]};
 expect(buildKnowledgeReport([teacher]).materials[0].indicators[0]).toMatchObject({score:50,source:'teacher'});
});
test('knowledge ignores game metrics and enrichment, uses actual program outcomes, and never modifies saved sessions',()=>{
 const s=correct('v2p01m01');const before=JSON.stringify(s),base=buildKnowledgeReport([s]);
 const altered={...s,score:1,firstAccuracy:0,activeMs:999999,hints:99,attempts:99,enrichmentReward:{xp:100}};
 expect(buildKnowledgeReport([altered,{...altered,missionId:'v2p05m04'}])).toEqual(base);expect(JSON.stringify(s)).toBe(before);
 const code=submitted('v2p05m01',{code:'nilai = [70,80,90,60,100]\ntotal = sum(nilai)\nrata = total / len(nilai)\nprint(rata)'});
 expect(buildKnowledgeReport([code]).materials[4].indicators[0].score).toBe(90);
});
test('latest assessable work is used without erasing older results while a new response waits for marking',()=>{
 const first=correct('v2p01m01'),later={...first,id:'later',submittedAt:'2026-10-15T02:00:00Z',masteryCheck:{answer:'String sesuai untuk nomor telepon'},state:{answers:{response:'String sesuai untuk nomor telepon'}}};
 expect(buildKnowledgeReport([first,later]).materials[0].score).toBe(90);
 const revised={...first,id:'revised',submittedAt:'2026-10-15T03:00:00Z',state:{answers:{...first.state.answers,phone:'Integer'}}};expect(buildKnowledgeReport([first,revised]).materials[0].indicators[0].score).toBe(50);
});
test('teacher rows sort attendance numerically and export knowledge marks with blanks for unavailable materials',()=>{
 const p=(id,attendance)=>({id,attendance,real_name:'Murid '+id,class_name:'X',knowledge:buildKnowledgeReport([correct('v2p01m01')])});
 const rows=knowledgeRows([p('ten',10),p('two',2),p('one',1)]);expect(rows.map(r=>r.attendance)).toEqual([1,2,10]);
 const exported=knowledgeExportRows(rows);expect(exported[0]['Materi 1']).toBe(90);expect(exported[0]['Materi 2']).toBe('');
});
