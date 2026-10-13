import {test,expect,vi} from 'vitest';
import {presentAssessment} from '../../src/server/assessment-presentation.js';
import {gradeWithConsensus} from '../../src/server/ai-consensus.js';
import {getMission} from '../../src/shared/missions.js';
import {getIndicatorRubric} from '../../src/shared/indicator-rubrics.js';
const m=getMission('v2p01m01'),rubric=getIndicatorRubric(m.id),evidence={answers:m.rules.answers,fieldResults:Object.fromEntries(m.rules.fields.map(f=>[f.key,true])),mode:'practice'};
const indicators=rubric.indicators.map(i=>({id:i.id,level:3,evidenceStatus:'present',references:[{key:i.fields[0],quote:evidence.answers[i.fields[0]]}],reason:'Raw assessment notes'}));
const assessment={status:'agreed',indicators,providerReviews:[{provider:'google',status:'complete',result:{indicators,feedback:'Coba Uji Mandiri.'}}]};
test('Gemini writes final explanations without changing scores or verified evidence',async()=>{
 vi.stubEnv('GOOGLE_API_KEY','test');
 try{
  const result=await presentAssessment(m,evidence,assessment,{fetchImpl:async(_url,opts)=>{
   const body=JSON.parse(opts.body);expect(body.contents[0].parts[0].text).toContain('bukan menilai ulang');
   return {ok:true,json:async()=>({candidates:[{content:{parts:[{text:JSON.stringify({feedback:'Pilihanmu sudah sesuai. Coba Uji Mandiri untuk kasus baru.',indicators:indicators.map(i=>({id:i.id,reason:'Pilihanmu sesuai pada kasus ini.',level:1}))})}]}}]})};
  }});
  expect(result.presentationSource).toBe('google');expect(result.feedback).toContain('Uji Mandiri');
  expect(result.indicators.map(i=>i.level)).toEqual([3,3]);expect(result.indicators[0].references).toEqual(indicators[0].references);
  expect(result.indicators[0].reason).toBe('Pilihanmu sesuai pada kasus ini.');
 }finally{vi.unstubAllEnvs();}
});
test('invalid Gemini presentation falls back without technical failure messages or a zero grade',async()=>{
 vi.stubEnv('GOOGLE_API_KEY','test');
 try{
  const result=await presentAssessment(m,evidence,assessment,{fetchImpl:async()=>({ok:true,json:async()=>({candidates:[{content:{parts:[{text:'{"feedback":"hello","indicators":[]}'}]}}]})})});
  expect(result.presentationSource).toBe('local');expect(result.indicators[0].level).toBe(3);expect(result.indicators[0].reason).not.toContain('Raw');
 }finally{vi.unstubAllEnvs();}
});
test('new submissions use two reviewers, never call OpenRouter, and still flag disagreement',async()=>{
 const seen=[];
 const result=await gradeWithConsensus(m,evidence,{providerGrader:async provider=>{seen.push(provider);return {indicators,feedback:'Coba lagi.',model:'test'};},presenter:async(_m,_e,a)=>a});
 expect(seen).toEqual(['groq','google']);expect(result.status).toBe('agreed');expect(result.indicators[0].reviewerCount).toBe(2);
});
