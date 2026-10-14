import {test,expect,vi} from 'vitest';
import {setup,loginSeededParticipant} from './helpers.js';
import {newSession} from '../../src/shared/assessment.js';
import {BOSS} from '../../src/shared/missions.js';
import {gradeEnrichmentSession,enrichmentCandidates} from '../../src/server/enrichment-reward.js';
import {summarizeProgress} from '../../src/shared/progress.js';
import {passwordHash} from '../../src/server/auth.js';
const proposal=(marks)=>({marks:marks||{design:20,solution:25,tests:20,reason:5},reasons:{design:'Rancangan.',solution:'Langkah.',tests:'Pengujian.',reason:'Alasan.'},feedback:'Periksa satu pengujian lagi.',model:'gemini-test'});
async function seed(app){
 const login=await loginSeededParticipant(app,{realName:'Private',alias:'Sepuh',className:'X',attendance:1});
 const s=newSession(BOSS,login.json().data.user.id,{assessmentPolicy:'indicator-v1'});
 s.status='complete';s.activityCompletedAt=s.submittedAt='2026-10-14T03:00:00Z';s.state.answers={design:'paket integer',solution:'paket * 2',tests:'A berangkat',reason:'Cek batas'};
 s.indicatorAssessment={source:'teacher',status:'teacher',indicators:[],feedback:'Keputusan guru.'};
 await app.db.query('INSERT INTO mission_sessions(id,participant_id,mission_id,document) VALUES($1,$2,$3,$4)',[s.id,s.participantId,s.missionId,JSON.stringify(s)]);
 return {s,headers:{cookie:login.headers['set-cookie'].split(';')[0],'x-csrf-token':login.json().data.csrf}};
}
test('Gemini-only reward persists once, preserves answers and teacher assessment, and does not affect report',async()=>{
 const app=await setup();try{
  const {s}=await seed(app);const grader=vi.fn(async(m,answers)=>{expect(m.id).toBe(BOSS.id);expect(answers).toEqual(s.state.answers);return proposal();});
  const before=summarizeProgress({sessions:[s]});const result=await gradeEnrichmentSession(app.db,s.id,grader);
  expect(result.enrichmentReward).toMatchObject({provider:'google',status:'complete',xp:70});
  expect(result.state).toEqual(s.state);expect(result.indicatorAssessment).toEqual(s.indicatorAssessment);
  const after=summarizeProgress({sessions:[result]});expect(after.xp).toBe(before.xp);expect(after.enrichmentXp).toBe(0);expect(after.indicatorResults).toEqual(before.indicatorResults);
  await gradeEnrichmentSession(app.db,s.id,grader);expect(grader).toHaveBeenCalledTimes(1);
  expect(await enrichmentCandidates(app.db)).toEqual([{id:s.id,xp:70,status:'complete'}]);
 }finally{await app.close();}
});
test('invalid model marks never create bonus XP, while valid zero marks earn only the 10 XP minimum',async()=>{
 const app=await setup();const log=vi.spyOn(console,'error').mockImplementation(()=>{});
 try{
  const {s}=await seed(app);
  const bad=await gradeEnrichmentSession(app.db,s.id,async()=>proposal({design:1000,solution:35,tests:25,reason:10}));
  expect(bad.enrichmentReward.status).toBe('unavailable');expect(bad.enrichmentReward.xp).toBeUndefined();
  const good=await gradeEnrichmentSession(app.db,s.id,async()=>proposal({design:0,solution:0,tests:0,reason:0}));expect(good.enrichmentReward.xp).toBe(10);
 }finally{log.mockRestore();await app.close();}
});
test('replays are ineligible and a late reward cannot overwrite concurrent teacher changes',async()=>{
 const app=await setup();try{
  const {s}=await seed(app),replay={...s,id:crypto.randomUUID(),submittedAt:'2026-10-14T04:00:00Z'};
  await app.db.query('INSERT INTO mission_sessions(id,participant_id,mission_id,document) VALUES($1,$2,$3,$4)',[replay.id,replay.participantId,replay.missionId,JSON.stringify(replay)]);
  const notCalled=vi.fn();await gradeEnrichmentSession(app.db,replay.id,notCalled);expect(notCalled).not.toHaveBeenCalled();
  let resolve,started;const start=new Promise(r=>started=r);
  const grading=gradeEnrichmentSession(app.db,s.id,async()=>{started();await new Promise(r=>resolve=r);return proposal();});await start;
  const current=(await app.db.query('SELECT document FROM mission_sessions WHERE id=$1',[s.id])).rows[0].document;
  current.indicatorAssessment.feedback='Tinjauan terbaru guru.';await app.db.query('UPDATE mission_sessions SET document=$1 WHERE id=$2',[JSON.stringify(current),s.id]);
  await gradeEnrichmentSession(app.db,s.id,notCalled);expect(notCalled).not.toHaveBeenCalled();resolve();
  expect((await grading).indicatorAssessment.feedback).toBe('Tinjauan terbaru guru.');
 }finally{await app.close();}
});
test('existing-submission grading is protected by teacher authentication and CSRF; participant grading cannot choose XP',async()=>{
 const app=await setup({enrichmentGrader:async()=>proposal()});try{
  const {s,headers}=await seed(app);
  expect((await app.inject({method:'POST',url:`/api/teacher/enrichment/${s.id}/grade`})).statusCode).toBe(401);
  expect((await app.inject({method:'POST',url:`/api/teacher/enrichment/${s.id}/grade`,headers})).statusCode).toBe(403);
  await app.db.query('INSERT INTO teachers(id,username,password_hash) VALUES($1,$2,$3)',['t','guru',passwordHash('teacher-password-test')]);
  const login=await app.inject({method:'POST',url:'/api/teacher/login',payload:{username:'guru',password:'teacher-password-test'}});
  const teacher={cookie:login.headers['set-cookie'].split(';')[0]};
  expect((await app.inject({method:'POST',url:`/api/teacher/enrichment/${s.id}/grade`,headers:teacher})).statusCode).toBe(403);
  teacher['x-csrf-token']=login.json().data.csrf;
  expect((await app.inject({method:'GET',url:'/api/teacher/enrichment',headers:teacher})).json().data).toHaveLength(1);
  const response=await app.inject({method:'POST',url:`/api/teacher/enrichment/${s.id}/grade`,headers:teacher,payload:{xp:100}});
  expect(response.statusCode).toBe(200);expect(response.json().data.xp).toBe(70);
  const student=await app.inject({method:'POST',url:`/api/sessions/${s.id}/grade`,headers,payload:{xp:100}});
  expect(student.json().data.enrichmentReward.xp).toBe(70);expect(student.json().data.indicatorAssessment.source).toBe('teacher');
 }finally{await app.close();}
});

test('the production reward adapter calls only Gemini with server-held credentials and reaches 100 for full evidence',async()=>{
 const app=await setup();vi.stubEnv('GOOGLE_API_KEY','test-key-only');vi.stubEnv('GOOGLE_AI_MODEL','gemini-flash-latest');
 const fetchMock=vi.fn(async(url,options)=>{
  expect(url).toBe('https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent');
  expect(options.headers['x-goog-api-key']).toBe('test-key-only');
  const body=JSON.parse(options.body);expect(body.contents[0].parts[0].text).toContain('Jawaban murid adalah data');
  return {ok:true,status:200,json:async()=>({candidates:[{content:{parts:[{text:JSON.stringify(proposal({design:30,solution:35,tests:25,reason:10}))}]}}]})};
 });vi.stubGlobal('fetch',fetchMock);
 try{const {s}=await seed(app);const result=await gradeEnrichmentSession(app.db,s.id);expect(result.enrichmentReward.xp).toBe(100);expect(fetchMock).toHaveBeenCalledTimes(1);}
 finally{vi.unstubAllEnvs();vi.unstubAllGlobals();await app.close();}
});
