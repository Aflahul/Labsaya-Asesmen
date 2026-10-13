import { test,expect } from 'vitest';
import { newSession,reduceSession } from '../../src/shared/assessment.js';
import { getMission,CORE_MISSIONS } from '../../src/shared/missions.js';
import { summarizeProgress,unlocked } from '../../src/shared/progress.js';
import { summarizeIndicators } from '../../src/shared/indicator-assessment.js';
import { getIndicatorRubric } from '../../src/shared/indicator-rubrics.js';
const m=getMission('v2p01m01');
const sent=(id,mode='practice',level=3)=>({id,missionId:m.id,missionVersion:2,assessmentPolicy:'indicator-v1',status:'complete',activityCompletedAt:id,completedAt:id,score:0,hints:20,errors:20,activeMs:900000,indicatorAssessment:{status:'agreed',at:id,evidenceMode:mode,indicators:getIndicatorRubric(m.id).indicators.map(i=>({id:i.id,level,evidenceStatus:'present',status:'agreed'}))}});
test('XP is unique per mission, all replays and help are free',()=>{
 const sessions=[sent('2026-01-01'),sent('2026-01-02')];
 expect(summarizeProgress({sessions}).xp).toBe(100);
 expect(summarizeProgress({sessions}).gameMissionGrades[m.id].replayPenalty).toBe(0);
});
test('latest independent evidence wins without averaging early mistakes or assisted success',()=>{
 const r=summarizeIndicators([sent('2026-01-01','independent_check',1),sent('2026-01-02','independent_check',3),sent('2026-01-03','practice',4)]);
 expect(r[0].group).toBe('independent');expect(r[0].level).toBe(3);
 expect(summarizeIndicators([sent('2026-01-01','practice',3)])[0].group).toBe('assisted');
});
test('activity completion unlocks next islands and boss despite unavailable scoring',()=>{
 const sessions=CORE_MISSIONS.map((mm,n)=>({...sent('2026-'+n),missionId:mm.id,indicatorAssessment:{status:'unavailable',indicators:[]}}));
 const summary=summarizeProgress({sessions});expect(summary.completed).toBe(15);expect(summary.bossUnlocked).toBe(true);expect(unlocked(getMission('v2p02m01'),summary)).toBe(true);
});
test('transfer answer and assistance are replayable without trusting imported AI fields',()=>{
 let s=newSession(m,'p',{assessmentPolicy:'indicator-v1',masteryCheck:true});
 const event=(type,payload={})=>({id:crypto.randomUUID(),sessionId:s.id,seq:s.events.length+1,type,payload,activeMs:0});
 s=reduceSession(s,event('action',{op:'answer',key:'response',value:'String Float 4 False'}),m);
 s=reduceSession(s,event('hint'),m);s=reduceSession(s,event('submit'),m);
 expect(s.masteryCheck.answer).toBe('String Float 4 False');expect(s.masteryCheck.hints).toBe(1);expect(s.indicatorAssessment.status).toBe('pending');
});
test('a fresh session after prior exposure is still practice, not proof of independence',async()=>{
 const {buildAssessmentEvidence}=await import('../../src/shared/indicator-assessment.js');
 const s=newSession(m,'p',{assessmentPolicy:'indicator-v1',previousExposure:true});s.state.answers=m.rules.answers;
 expect(buildAssessmentEvidence(m,s).mode).toBe('practice');
});
test('new ability reports do not derive numeric competency totals from the old accuracy formula',()=>{
 const s=sent('2026-01-01');s.score=100;s.components={K:100};
 const summary=summarizeProgress({sessions:[s]});expect(summary.score).toBeNull();expect(summary.scoringPolicy).toBe('indicator-v1');expect(summary.bestByMission[m.id]).toBeUndefined();
});
test('late grading of an old submission cannot replace newer independent evidence',()=>{
 const older=sent('2026-10-01','independent_check',1),newer=sent('2026-10-02','independent_check',4);
 older.submittedAt='2026-10-01';older.indicatorAssessment.at='2026-10-03';newer.submittedAt='2026-10-02';
 const r=summarizeIndicators([older,newer]);expect(r[0].level).toBe(4);expect(r[0].sessionId).toBe(newer.id);
});
test('persisted threshold applies to individual progress summaries',()=>{
 const s=sent('2026-01-01','independent_check',3);const r=summarizeProgress({sessions:[s],indicatorThreshold:{threshold:4,version:2}});
 expect(r.indicatorResults[0].group).toBe('needs_support');
});
test('transfer sessions reject normal mission fields instead of converting them into transfer answers',()=>{
 let s=newSession(m,'p',{assessmentPolicy:'indicator-v1',masteryCheck:true});
 s=reduceSession(s,{id:crypto.randomUUID(),sessionId:s.id,seq:1,type:'action',activeMs:0,payload:{op:'answer',key:'phone',value:'String'}},m);
 expect(s.masteryCheck.answer).toBe('');expect(s.errors).toBe(1);
});
test('repeating the same exposed transfer case does not create fresh independent proof',async()=>{
 const {buildAssessmentEvidence}=await import('../../src/shared/indicator-assessment.js');const s=newSession(m,'p',{assessmentPolicy:'indicator-v1',masteryCheck:true,previousCheckExposure:true});s.masteryCheck.answer='String Float 4 False';
 expect(buildAssessmentEvidence(m,s).mode).toBe('practice');
});
