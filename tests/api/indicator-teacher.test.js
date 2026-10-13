import {test,expect} from 'vitest';
import {setup,loginSeededParticipant} from './helpers.js';
import {passwordHash} from '../../src/server/auth.js';
import {newSession,reduceSession} from '../../src/shared/assessment.js';
import {getMission} from '../../src/shared/missions.js';
import {getIndicatorRubric} from '../../src/shared/indicator-rubrics.js';
async function teacher(app){await app.db.query('INSERT INTO teachers(id,username,password_hash) VALUES($1,$2,$3)',['t','guru',passwordHash('test-only')]);const r=await app.inject({method:'POST',url:'/api/teacher/login',payload:{username:'guru',password:'test-only'}});return {cookie:r.headers['set-cookie'].split(';')[0],'x-csrf-token':r.json().data.csrf};}
test('teacher can inspect every indicator, configure threshold and correct with history',async()=>{
 const app=await setup();const login=await loginSeededParticipant(app,{realName:'A',alias:'AI',className:'X',attendance:1});
 const m=getMission('v2p01m01');let s=newSession(m,login.json().data.user.id,{assessmentPolicy:'indicator-v1'});
 s.status='complete';s.activityCompletedAt='2026-01-01';s.indicatorAssessment={status:'unavailable',indicators:[],evidenceMode:'independent_submission'};
 s.state.answers=m.rules.answers;
 await app.db.query('INSERT INTO mission_sessions(id,participant_id,mission_id,document) VALUES($1,$2,$3,$4)',[s.id,s.participantId,m.id,JSON.stringify(s)]);
 const headers=await teacher(app);
 const report=await app.inject({url:'/api/teacher/indicators?class=X',headers});expect(report.statusCode).toBe(200);expect(report.json().data.denominator).toBe(1);
 const config=await app.inject({method:'PUT',url:'/api/teacher/indicator-config',headers,payload:{threshold:4}});expect(config.statusCode).toBe(200);expect(config.json().data.version).toBe(2);
 const correction=await app.inject({method:'POST',url:`/api/teacher/sessions/${s.id}/review`,headers,payload:{indicators:getIndicatorRubric(m.id).indicators.map(i=>({id:i.id,level:3,reason:'Sesuai jawaban yang diperiksa.'})),comment:'Sudah sesuai pada kasus ini.'}});
 expect(correction.statusCode).toBe(200);expect(correction.json().data.indicatorAssessment.source).toBe('teacher');expect(correction.json().data.indicatorHistory).toHaveLength(1);
 const denied=await app.inject({url:'/api/teacher/indicators',headers:{cookie:login.headers['set-cookie'].split(';')[0]}});expect(denied.statusCode).toBe(403);
 await app.close();
});
