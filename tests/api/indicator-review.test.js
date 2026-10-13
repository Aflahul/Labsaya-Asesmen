import { test, expect } from 'vitest';
import { setup,loginSeededParticipant } from './helpers.js';
import { getMission } from '../../src/shared/missions.js';
import { newSession,reduceSession } from '../../src/shared/assessment.js';
import { getIndicatorRubric } from '../../src/shared/indicator-rubrics.js';
import { gradeWithConsensus } from '../../src/server/ai-consensus.js';
import { gradeIndicatorSession } from '../../src/server/assessment-submissions.js';
const profile={realName:'Murid',alias:'Indikator',className:'X',attendance:1};
const grader=async(m,e,options)=>gradeWithConsensus(m,e,{...options,providerGrader:async provider=>({model:provider+'-test',indicators:getIndicatorRubric(m.id).indicators.map(i=>({id:i.id,level:3,evidenceStatus:'present',references:[{key:i.fields[0],quote:e.answers[i.fields[0]]}],reason:'Jawaban memenuhi bagian ini.'})),feedback:'Periksa satu kasus baru untuk memastikan langkahmu.'})});
async function seed(app){
 const login=await loginSeededParticipant(app,profile),id=login.json().data.user.id;
 const m=getMission('v2p01m01');let s=newSession(m,id,{assessmentPolicy:'indicator-v1'});
 for(const [key,value] of Object.entries(m.rules.answers))s=reduceSession(s,{id:crypto.randomUUID(),sessionId:s.id,seq:s.events.length+1,type:'action',activeMs:0,payload:{op:'answer',key,value}},m);
 s=reduceSession(s,{id:crypto.randomUUID(),sessionId:s.id,seq:s.events.length+1,type:'submit',activeMs:0,payload:{}},m);
 await app.db.query('INSERT INTO mission_sessions(id,participant_id,mission_id,document) VALUES($1,$2,$3,$4)',[s.id,id,m.id,JSON.stringify(s)]);
 return {s,headers:{cookie:login.headers['set-cookie'].split(';')[0],'x-csrf-token':login.json().data.csrf}};
}
test('submitted activity has separate pending indicator assessment and retries are idempotent',async()=>{
 let calls=0;const app=await setup({indicatorGrader:async(...args)=>{calls++;return grader(...args);}});
 const {s,headers}=await seed(app);expect(s.activityCompletedAt).toBeTruthy();expect(s.indicatorAssessment.status).toBe('pending');
 const r=await app.inject({method:'POST',url:`/api/sessions/${s.id}/grade`,headers});
 expect(r.statusCode).toBe(200);expect(r.json().data.indicatorAssessment.status).toBe('agreed');
 await app.inject({method:'POST',url:`/api/sessions/${s.id}/grade`,headers});expect(calls).toBe(1);
 await app.close();
});
test('concurrent calls coalesce and late result cannot replace teacher correction',async()=>{
 const app=await setup();const {s}=await seed(app);let resolve,started;
 const start=new Promise(r=>started=r);let calls=0;
 const delayed=async(...args)=>{calls++;started();await new Promise(r=>resolve=r);return grader(...args);};
 const first=gradeIndicatorSession(app.db,s.id,delayed);await start;
 const second=gradeIndicatorSession(app.db,s.id,delayed);
 const row=(await app.db.query('SELECT document FROM mission_sessions WHERE id=$1',[s.id])).rows[0].document;
 row.indicatorAssessment={...row.indicatorAssessment,status:'teacher',source:'teacher',indicators:[],feedback:'Keputusan guru.'};
 await app.db.query('UPDATE mission_sessions SET document=$1 WHERE id=$2',[JSON.stringify(row),s.id]);resolve();
 const [a,b]=await Promise.all([first,second]);expect(calls).toBe(1);expect(a.indicatorAssessment.source).toBe('teacher');expect(b.indicatorAssessment.source).toBe('teacher');await app.close();
});
test('all provider failures keep evidence and activity completion without a zero ability score',async()=>{
 const app=await setup({indicatorGrader:async(m,e,options)=>gradeWithConsensus(m,e,{...options,providerGrader:async()=>{throw Error('secret provider failure');}})});
 const {s,headers}=await seed(app);const r=await app.inject({method:'POST',url:`/api/sessions/${s.id}/grade`,headers});
 expect(r.json().data.indicatorAssessment.status).toBe('unavailable');expect(r.json().data.activityCompletedAt).toBeTruthy();expect(r.body).not.toContain('secret provider failure');await app.close();
});
