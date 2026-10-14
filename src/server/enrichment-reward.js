import {randomUUID} from 'node:crypto';
import {BOSS} from '../shared/missions.js';
import {firstEnrichmentSession,enrichmentXp} from '../shared/leaderboard.js';
import {gradeWithGemini,validateAiGrade,aiFailureDetails} from './ai-grader.js';

export async function gradeEnrichmentSession(db,id,grader=(m,answers)=>gradeWithGemini(m,answers,{retry503:false,timeoutMs:45000})) {
 const client=await db.connect();let current,claim;
 try {
  await client.query('BEGIN');
  current=(await client.query('SELECT document FROM mission_sessions WHERE id=$1 FOR UPDATE',[id])).rows[0]?.document;
  if(!current||current.missionId!==BOSS.id||current.masteryCheck||!firstEnrichmentSession([current])||enrichmentXp(current)!==null||current.enrichmentReward?.leaseUntil>Date.now()) {
   await client.query('ROLLBACK');return current;
  }
  const sessions=(await client.query('SELECT document FROM mission_sessions WHERE participant_id=$1 AND mission_id=$2',[current.participantId,BOSS.id])).rows.map(r=>r.document);
  if(firstEnrichmentSession(sessions)?.id!==id){await client.query('ROLLBACK');return current;}
  claim=randomUUID();current.enrichmentReward={status:'grading',claimToken:claim,leaseUntil:Date.now()+60000};
  await client.query('UPDATE mission_sessions SET document=$1,updated_at=$2 WHERE id=$3',[JSON.stringify(current),new Date(),id]);
  await client.query('COMMIT');
 }catch(error){await client.query('ROLLBACK');throw error;}finally{client.release();}
 let reward;
 try {
  const proposal=await grader(BOSS,current.state.answers),result=validateAiGrade(BOSS,proposal);
  const total=Object.values(result.marks).reduce((n,value)=>n+value,0);
  reward={status:'complete',xp:Math.max(10,Math.min(100,Math.round(total))),provider:'google',model:proposal.model||'gemini',version:1,at:new Date().toISOString(),marks:result.marks,reasons:result.reasons};
 }catch(error){
  reward={status:'unavailable',at:new Date().toISOString()};
  console.error('[ENRICHMENT_REWARD_FAILURE]',aiFailureDetails(error));
 }
 const save=await db.connect();
 try {
  await save.query('BEGIN');
  const row=(await save.query('SELECT document FROM mission_sessions WHERE id=$1 FOR UPDATE',[id])).rows[0]?.document;
  if(!row||row.enrichmentReward?.claimToken!==claim){await save.query('ROLLBACK');return row;}
  // Merge only the game reward into the latest record, preserving concurrent teacher assessments.
  row.enrichmentReward=reward;
  await save.query('UPDATE mission_sessions SET document=$1,updated_at=$2 WHERE id=$3',[JSON.stringify(row),new Date(),id]);
  await save.query('COMMIT');return row;
 }catch(error){await save.query('ROLLBACK');throw error;}finally{save.release();}
}

export async function enrichmentCandidates(db) {
 const rows=(await db.query('SELECT document FROM mission_sessions WHERE mission_id=$1',[BOSS.id])).rows;
 const groups=new Map();
 for(const {document:s} of rows){if(!groups.has(s.participantId))groups.set(s.participantId,[]);groups.get(s.participantId).push(s);}
 return [...groups.values()].map(firstEnrichmentSession).filter(Boolean).map(s=>({id:s.id,xp:enrichmentXp(s),status:s.enrichmentReward?.status||'pending'}));
}
