import {test,expect} from 'vitest';
import {setup,loginSeededParticipant} from './helpers.js';
import {passwordHash} from '../../src/server/auth.js';
import {getMission} from '../../src/shared/missions.js';
test('teacher knowledge marks derive from saved answers without AI evidence requirements or changing stored records',async()=>{
 const app=await setup();try{
  const login=await loginSeededParticipant(app,{realName:'Nama Lengkap',alias:'Alias',className:'X',attendance:2});const id=login.json().data.user.id;
  const m=getMission('v2p01m01'),document={id:'knowledge-session',participantId:id,missionId:m.id,missionVersion:2,assessmentPolicy:'indicator-v1',status:'complete',submittedAt:'2026-10-15T01:00:00Z',activityCompletedAt:'2026-10-15T01:00:00Z',state:{answers:m.rules.answers},hints:20,activeMs:999999,events:[],scoringConfig:{formulaVersion:5},indicatorAssessment:{status:'unavailable',indicators:[]}};
  await app.db.query('INSERT INTO mission_sessions(id,participant_id,mission_id,document) VALUES($1,$2,$3,$4)',[document.id,id,m.id,JSON.stringify(document)]);
  await app.db.query('INSERT INTO teachers(id,username,password_hash) VALUES($1,$2,$3)',['t','guru',passwordHash('teacher-test-password')]);
  const teacher=await app.inject({method:'POST',url:'/api/teacher/login',payload:{username:'guru',password:'teacher-test-password'}}),headers={cookie:teacher.headers['set-cookie'].split(';')[0]};
  expect((await app.inject({method:'GET',url:'/api/teacher/participants'})).statusCode).toBe(401);
  const result=await app.inject({method:'GET',url:'/api/teacher/participants',headers});expect(result.statusCode).toBe(200);
  const p=result.json().data.find(p=>p.id===id);expect(p.knowledge.materials[0].score).toBe(90);expect(p.knowledge.materials[1].score).toBeNull();
  expect(result.body).not.toContain('password_hash');
  const saved=(await app.db.query('SELECT document FROM mission_sessions WHERE id=$1',[document.id])).rows[0].document;expect(saved).toEqual(document);
  const publicBoard=await app.inject({method:'GET',url:'/api/leaderboard'});expect(publicBoard.body).not.toContain('knowledge');expect(publicBoard.body).not.toContain('Nama Lengkap');
 }finally{await app.close();}
});
