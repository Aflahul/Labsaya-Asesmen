import {ISLANDS,CORE_MISSIONS} from './missions.js';
import {getIndicatorRubric} from './indicator-rubrics.js';
import {evaluateV2} from './v2-evaluator.js';
import {isUnknown} from './indicator-assessment.js';

// Grade the knowledge demonstrated in the task; a transfer check is optional.
const fromLevel=level=>Number.isInteger(level)&&level>=1&&level<=4?Math.min(90,10+40*(level-1)):null;
const fromRatio=ratio=>Math.round(10+80*Math.max(0,Math.min(1,ratio)));
const submitted=s=>Boolean(s.activityCompletedAt)||['complete','pending_review'].includes(s.status);
const time=s=>String(s.submittedAt||s.activityCompletedAt||s.completedAt||'');
function indicatorMark(m,i,s,evaluations) {
 const assessment=s.indicatorAssessment;
 const result=assessment?.indicators?.find(row=>row.id===i.id);
 if(assessment?.source==='teacher'||assessment?.status==='teacher'){
  if(result)return {score:fromLevel(result.level),source:'teacher',reason:result.reason||'Hasil tinjauan guru.'};
 }
 const answers=s.masteryCheck?{response:s.masteryCheck.answer||s.state?.answers?.response}:s.state?.answers||{};
 if(!s.masteryCheck){
  if(i.fields.every(key=>Object.hasOwn(m.rules.answers,key))){
   const available=i.fields.filter(key=>typeof answers[key]==='string'&&answers[key].trim());
   if(!available.length)return null;
   const correct=available.filter(key=>answers[key]===m.rules.answers[key]).length;
   return {score:fromRatio(correct/i.fields.length),source:'answer',reason:`${correct} dari ${i.fields.length} jawaban tepat.`};
  }
  if(i.fields.includes('code')&&typeof answers.code==='string'&&answers.code.trim()){
   if(!evaluations.has(s))evaluations.set(s,evaluateV2(m,s.state,s.assessmentRevision));
   const runs=evaluations.get(s).runs||[];
   if(runs.length){
    const correct=runs.filter(run=>run.ok&&(m.kind!=='python'||run.outputs.length===1)&&JSON.stringify(run.outputs.at(-1))===JSON.stringify(run.expected)).length;
    return {score:fromRatio(correct/runs.length),source:'program',reason:`${correct} dari ${runs.length} pengujian program tepat.`};
   }
  }
 }
 const fields=s.masteryCheck?['response']:i.fields;
 const values=fields.map(key=>String(answers[key]||'').trim()).filter(Boolean);
 if(values.length&&values.every(isUnknown))return {score:10,source:'answer',reason:'Jawaban menyatakan belum memahami bagian ini.'};
 const score=fromLevel(result?.level);
 if(score!==null)return {score,source:'assessment',reason:result.reason||'Dinilai dari jawaban pada indikator ini.'};
 // A single completed reviewer is usable even while another review is pending.
 for(const review of [...(assessment?.providerReviews||[])].sort((a,b)=>Number(b.provider==='google')-Number(a.provider==='google'))){
  if(review.status!=='complete')continue;
  const row=review.result?.indicators?.find(row=>row.id===i.id),value=fromLevel(row?.level);
  if(value!==null)return {score:value,source:'assessment',reason:row.reason||'Dinilai dari jawaban pada indikator ini.'};
 }
 return null;
}
export function buildKnowledgeReport(sessions=[]) {
 const evaluations=new Map();
 const indicators=CORE_MISSIONS.flatMap(m=>{
  const candidates=sessions.filter(s=>s.missionId===m.id&&submitted(s)).sort((a,b)=>time(b).localeCompare(time(a)));
  return getIndicatorRubric(m.id).indicators.map(i=>{
   let mark,selected;
   for(const session of candidates){mark=indicatorMark(m,i,session,evaluations);if(mark){selected=session;break;}}
   return {id:i.id,label:i.label,missionId:m.id,missionTitle:m.title,materialId:m.island,score:mark?.score??null,source:mark?.source||'pending',reason:mark?.reason||(candidates.length?'Penilaian jawaban menyusul.':'Belum ada jawaban terkirim.'),sessionId:selected?.id||null};
  });
 });
 return {materials:ISLANDS.map(material=>{
  const rows=indicators.filter(i=>i.materialId===material.id),scored=rows.filter(i=>i.score!==null);
  return {id:material.id,title:`Materi ${material.id}`,topic:material.topic,score:scored.length?Math.round(scored.reduce((n,i)=>n+i.score,0)/scored.length):null,assessed:scored.length,total:rows.length,indicators:rows};
 })};
}
export function knowledgeRows(participants) {
 return [...participants].sort((a,b)=>(Number(a.attendance)||Infinity)-(Number(b.attendance)||Infinity)||String(a.class_name||'').localeCompare(String(b.class_name||''),'id')||String(a.real_name||'').localeCompare(String(b.real_name||''),'id'));
}
export function knowledgeExportRows(participants) {
 return knowledgeRows(participants).map(p=>({'No. absen':p.attendance,'Nama lengkap':p.real_name,Kelas:p.class_name,...Object.fromEntries(ISLANDS.map(m=>[`Materi ${m.id}`,p.knowledge?.materials.find(row=>row.id===m.id)?.score??'']))}));
}
