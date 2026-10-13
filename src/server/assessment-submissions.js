import { presentAssessment } from './assessment-presentation.js';
import { getMasteryCheckGuide } from "./mastery-check-guide.js";
import { createHash,randomUUID } from 'node:crypto';
import { getMission } from '../shared/missions.js';
import { canonicalJson } from '../shared/contracts.js';
import { getIndicatorRubric } from '../shared/indicator-rubrics.js';
import { buildAssessmentEvidence,validateIndicatorGrade,combineIndicatorReviews } from '../shared/indicator-assessment.js';
import { gradeWithConsensus } from './ai-consensus.js';
const inFlight=new WeakMap();
export function gradeIndicatorSession(db,id,grader=gradeWithConsensus) {
 let pending=inFlight.get(db);if(!pending){pending=new Map();inFlight.set(db,pending);}
 if(pending.has(id))return pending.get(id);
 const run=gradeClaimed(db,id,grader).finally(()=>pending.delete(id));pending.set(id,run);return run;
}
async function gradeClaimed(db,id,grader) {
 const client=await db.connect();let current,mission,evidence,fingerprint,claimToken;
 try {
  await client.query('BEGIN');
  current=(await client.query('SELECT document FROM mission_sessions WHERE id=$1 FOR UPDATE',[id])).rows[0]?.document;
  if(!current){await client.query('ROLLBACK');return null;}
  const old=current.indicatorAssessment;
  if(current.assessmentPolicy!=='indicator-v1'||!current.activityCompletedAt||old?.source==='teacher'||['agreed','provisional','needs_review'].includes(old?.status)||old?.leaseUntil>Date.now()){
   await client.query('ROLLBACK');return current;
  }
  mission=getMission(current.missionId);
  {
   const previous=(await client.query('SELECT document FROM mission_sessions WHERE participant_id=$1 AND mission_id=$2',[current.participantId,current.missionId])).rows;
   if(current.masteryCheck) current.scoringConfig.previousCheckExposure ||= previous.some(({document:s})=>s.id!==current.id && s.masteryCheck && (s.activityCompletedAt || s.masteryCheck.hints));
   else current.scoringConfig.previousExposure ||= previous.some(({document:s})=>s.id!==current.id&&(s.activityCompletedAt||s.status==='complete'||s.hints||s.events?.some(e=>e.type==='run')));
  }
  evidence=buildAssessmentEvidence(mission,current);
  if(evidence.check) evidence.check.expectedEvidence=getMasteryCheckGuide(mission.id);
  fingerprint=createHash('sha256').update(canonicalJson({missionId:mission.id,revision:current.assessmentRevision,rubric:getIndicatorRubric(mission.id),evidence})).digest('hex');
  if(old?.fingerprint===fingerprint&&old.providerReviews?.every(r=>r.status==='complete'||r.attempts>=2)){await client.query('ROLLBACK');return current;}
  claimToken=randomUUID();current.indicatorAssessment={...old,fingerprint,claimToken,leaseUntil:Date.now()+150000,status:'grading'};
  await client.query('UPDATE mission_sessions SET document=$1,updated_at=$2 WHERE id=$3',[JSON.stringify(current),new Date(),id]);await client.query('COMMIT');
 }catch(e){await client.query('ROLLBACK');throw e;}finally{client.release();}
 let result;
 try {
  const proposed=await grader(mission,evidence,{previousReviews:current.indicatorAssessment.providerReviews||[]});
  const reviews=['groq','google'].map(provider=>{
   const p=proposed.providerReviews?.find(p=>p.provider===provider);
   if(p?.status==='complete')return {...p,result:validateIndicatorGrade(getIndicatorRubric(mission.id),evidence,p.result)};
   return {provider,status:'unavailable',attempts:p?.attempts||1,error:p?.error||'RESPONSE_OR_NETWORK_ERROR'};
  });
  result=combineIndicatorReviews(getIndicatorRubric(mission.id),evidence,reviews,2);
 }catch{
  const previous=current.indicatorAssessment.providerReviews||[];
  result=combineIndicatorReviews(getIndicatorRubric(mission.id),evidence,['groq','google'].map(provider=>previous.find(p=>p.provider===provider&&p.status==='complete')||{provider,status:'unavailable',attempts:(previous.find(p=>p.provider===provider)?.attempts||0)+1,error:'RESPONSE_OR_NETWORK_ERROR'}),2);
 }
 result=await presentAssessment(mission,evidence,result);
 const save=await db.connect();
 try{
  await save.query('BEGIN');
  const row=(await save.query('SELECT document FROM mission_sessions WHERE id=$1 FOR UPDATE',[id])).rows[0]?.document;
  if(!row||row.indicatorAssessment?.claimToken!==claimToken||row.indicatorAssessment?.source==='teacher'){await save.query('ROLLBACK');return row;}
  row.indicatorAssessment={...result,fingerprint,rubricVersion:1,at:new Date().toISOString(),source:'ai',evidenceMode:evidence.mode,assistance:evidence.assistance};
  row.feedback=result.feedback;
  await save.query('UPDATE mission_sessions SET document=$1,updated_at=$2 WHERE id=$3',[JSON.stringify(row),new Date(),id]);await save.query('COMMIT');return row;
 }catch(e){await save.query('ROLLBACK');throw e;}finally{save.release();}
}
