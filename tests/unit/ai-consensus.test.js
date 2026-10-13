import { test, expect } from 'vitest';
import { getMission } from '../../src/shared/missions.js';
import { getIndicatorRubric } from '../../src/shared/indicator-rubrics.js';
import { validateIndicatorGrade, combineIndicatorReviews, limitNaraFeedback } from '../../src/shared/indicator-assessment.js';
import { gradeWithConsensus } from '../../src/server/ai-consensus.js';
const m=getMission('v2p05m04'), rubric=getIndicatorRubric(m.id);
const evidence={answers:{design:'jumlah_paket integer',solution:'tolak negatif',tests:'A berangkat',reason:'batas termasuk'},mode:'practice',fieldResults:{},runs:[]};
const proposal=(level)=>({indicators:rubric.indicators.map(i=>({id:i.id,level,evidenceStatus:'present',references:[{key:i.fields[0],quote:evidence.answers[i.fields[0]]}],reason:'Bukti sebagian memenuhi aturan.'})),feedback:'Coba periksa berat tepat 10 kg. Apa keputusan programmu?'});
const reviews=(levels)=>levels.map((n,index)=>({provider:['groq','openrouter','google'][index],status:'complete',result:validateIndicatorGrade(rubric,evidence,proposal(n))}));
test('consensus preserves disagreement and requires three valid reviewers',()=>{
 expect(combineIndicatorReviews(rubric,evidence,reviews([3,3,3])).status).toBe('agreed');
 expect(combineIndicatorReviews(rubric,evidence,reviews([2,3,3])).status).toBe('provisional');
 expect(combineIndicatorReviews(rubric,evidence,reviews([1,3,4])).status).toBe('needs_review');
 expect(combineIndicatorReviews(rubric,evidence,reviews([3,3])).status).toBe('partial');
 expect(combineIndicatorReviews(rubric,evidence,[]).status).toBe('unavailable');
});
test('rejects fabricated evidence, duplicate indicators and invalid levels',()=>{
 const p=proposal(3); p.indicators[0].references[0].quote='saya sudah ahli';
 expect(()=>validateIndicatorGrade(rubric,evidence,p)).toThrow();
 const dup=proposal(3);dup.indicators[1]=dup.indicators[0];expect(()=>validateIndicatorGrade(rubric,evidence,dup)).toThrow();
 expect(()=>validateIndicatorGrade(rubric,evidence,proposal(5))).toThrow();
});
test('unknown answer cannot earn a level or fabricated praise',()=>{
 const e={...evidence,answers:Object.fromEntries(Object.keys(evidence.answers).map(k=>[k,'tidak tauuu']))};
 const p=proposal(3);p.indicators.forEach(i=>i.references=[{key:i.references[0].key,quote:'tidak tauuu'}]);
 const r=validateIndicatorGrade(rubric,e,p);
 expect(r.indicators.every(i=>i.level===null&&i.evidenceStatus==='insufficient')).toBe(true);
 expect(r.feedback).not.toContain('sudah');
});
test('deterministic incorrect answers prevent perfect grading',()=>{
 const mm=getMission('v2p01m01'),rr=getIndicatorRubric(mm.id);
 const e={answers:{phone:'Integer',weight:'Float',count:'3',ready:'True'},fieldResults:{phone:false,weight:true,count:true,ready:true},mode:'practice'};
 const p={indicators:rr.indicators.map(i=>({id:i.id,level:3,evidenceStatus:'present',references:[{key:i.fields[0],quote:e.answers[i.fields[0]]}],reason:'Cek jawaban.'})),feedback:'Periksa nomor telepon.'};
 expect(validateIndicatorGrade(rr,e,p).indicators[0].level).toBe(2);
});
test('Unicode feedback limit keeps up to 400 characters and removes incomplete tail',()=>{
 expect(limitNaraFeedback('🙂'.repeat(350))).toBe('🙂'.repeat(350));
 expect(Array.from(limitNaraFeedback('Kalimat. '.repeat(100))).length).toBeLessThanOrEqual(400);
});
test('all providers run independently and retry retains successful reviews',async()=>{
 const seen=[];const providerGrader=async(provider)=>{seen.push(provider);if(provider==='google')throw Error('unavailable');return { ...proposal(3),model:'test'};};
 const first=await gradeWithConsensus(m,evidence,{providerGrader});
 expect(first.status).toBe('partial');expect(new Set(seen).size).toBe(3);
 seen.length=0;
 const second=await gradeWithConsensus(m,evidence,{providerGrader,previousReviews:first.providerReviews});
 expect(seen).toEqual(['google']);expect(second.providerReviews.filter(r=>r.status==='complete')).toHaveLength(2);
});
test('status disagreement stays reviewable even when the available numbers match',()=>{
 const rows=reviews([3,3,3]);rows[2].result.indicators[0]={...rows[2].result.indicators[0],level:null,evidenceStatus:'insufficient'};
 expect(combineIndicatorReviews(rubric,evidence,rows).status).toBe('needs_review');
});
test('transfer prompt uses the new case instead of original numeric answers',async()=>{
 const {indicatorPrompt}=await import('../../src/server/ai-consensus.js');
 const e={...evidence,check:{prompt:'3 energi per peti',expectedEvidence:'hasil12'},answers:{response:'4 peti membutuhkan12'}};
 const prompt=indicatorPrompt(m,e);
 expect(prompt).toContain('Aturan kasus baru menggantikan');
 const payload=JSON.parse(prompt.split('\n\n').at(-1));expect(payload.mission.instructions).toBe(e.check.prompt);expect(payload.mission.expectedAnswers).toBeNull();
});
test('an unknown reasoning section gets targeted guidance even when other sections contain evidence',()=>{
 const e={...evidence,answers:{...evidence.answers,reason:'tidak tahu'}};const p=proposal(3);p.indicators.at(-1).references=[{key:'reason',quote:'tidak tahu'}];p.feedback='Kamu sudah menjelaskan alasan dengan baik.';
 const r=validateIndicatorGrade(rubric,e,p);expect(r.feedback).not.toContain('sudah menjelaskan alasan');expect(r.feedback).toContain('10 kg');
});
