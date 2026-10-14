import {test,expect} from 'vitest';
import {setup,loginSeededParticipant} from './helpers.js';
import {CORE_MISSIONS} from '../../src/shared/missions.js';
import {newSession} from '../../src/shared/assessment.js';
test('test-account leaderboard exclusion preserves assessment records and ranks real pupils correctly',async()=>{
 const app=await setup();
 try{
  for(const id of ['test-account','real-pupil']){
   await app.db.query('INSERT INTO participants(id,real_name,alias,alias_key,class_name,attendance) VALUES($1,$2,$3,$4,$5,$6)',[id,id,id,id,'X',1]);
   for(const m of CORE_MISSIONS){
    const s={...newSession(m,id),status:'complete',completedAt:new Date().toISOString(),score:100,components:{K:100}};
    await app.db.query('INSERT INTO mission_sessions(id,participant_id,mission_id,document) VALUES($1,$2,$3,$4)',[s.id,id,m.id,JSON.stringify(s)]);
   }
  }
  await app.db.query('INSERT INTO settings(name,value) VALUES($1,$2)',['leaderboard-excluded-participants',JSON.stringify(['test-account'])]);
  const r=await app.inject({method:'GET',url:'/api/leaderboard'});
  expect(r.json().data).toMatchObject([{alias:'real-pupil',score:1500,rank:1}]);
  expect((await app.db.query('SELECT id FROM mission_sessions WHERE participant_id=$1',['test-account'])).rows).toHaveLength(15);
 }finally{await app.close();}
});
test('removed attempts cannot be restored from old devices while fresh attempts remain allowed',async()=>{
 const app=await setup();
 try{
  const login=await loginSeededParticipant(app,{realName:'Uji',alias:'Reset',className:'X',attendance:1});const a=login.json().data,id=crypto.randomUUID();
  const headers={cookie:login.headers['set-cookie'].split(';')[0],'x-csrf-token':a.csrf};
  await app.db.query('INSERT INTO settings(name,value) VALUES($1,$2)',[`removed-session-ids:${a.user.id}`,JSON.stringify([id])]);
  const progress=await app.inject({method:'GET',url:'/api/progress',headers});expect(progress.json().data.removedSessionIds).toEqual([id]);
  const old=await app.inject({method:'POST',url:'/api/sessions',headers,payload:{id,missionId:CORE_MISSIONS[0].id}});expect(old.statusCode).toBe(410);
  const fresh=await app.inject({method:'POST',url:'/api/sessions',headers,payload:{id:crypto.randomUUID(),missionId:CORE_MISSIONS[0].id}});expect(fresh.statusCode).toBe(201);
 }finally{await app.close();}
});
