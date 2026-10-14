import {CORE_MISSIONS,MISSIONS,BOSS} from './missions.js';
const finished=s=>Boolean(s.activityCompletedAt)||s.status==='complete';
const finishTime=s=>{
 const time=Date.parse(s.submittedAt||s.activityCompletedAt||s.completedAt||'');
 return Number.isFinite(time)?time:null;
};
export function firstEnrichmentSession(sessions) {
 return sessions.filter(s=>s.missionId===BOSS.id&&!s.masteryCheck&&finished(s)).sort((a,b)=>(finishTime(a)??Infinity)-(finishTime(b)??Infinity))[0];
}
export function enrichmentXp(session) {
 const reward=session?.enrichmentReward;
 return reward?.status==='complete'&&reward.provider==='google'&&Number.isInteger(reward.xp)&&reward.xp>=10&&reward.xp<=100?reward.xp:null;
}
export function leaderboardStats(sessions) {
 const first=CORE_MISSIONS.map(m=>sessions.filter(s=>s.missionId===m.id&&finished(s)).sort((a,b)=>(finishTime(a)??Infinity)-(finishTime(b)??Infinity))[0]);
 const total=key=>first.every(s=>s&&Number.isFinite(s[key])&&s[key]>=0)?first.reduce((n,s)=>n+s[key],0):null;
 const ms=total('activeMs'),hints=total('hints'),attempts=total('attempts'),times=first.map(s=>s&&finishTime(s));
 return {activeSeconds:ms===null?null:Math.round(ms/1000),hints,attempts,enrichmentXp:enrichmentXp(firstEnrichmentSession(sessions)),
  finishedAt:times.every(t=>Number.isFinite(t))?Math.max(...times):null,
  sepuh:sessions.some(s=>finished(s)&&MISSIONS.some(m=>m.id===s.missionId&&m.enrichment))};
}
const compare=(a,b)=>{
 for(const key of ['activeSeconds','hints','attempts','finishedAt']){
  const x=a[key]??Infinity,y=b[key]??Infinity;
  if(x!==y)return x<y?-1:1;
 }
 return 0;
};
export function rankLeaderboard(entries) {
 const sorted=[...entries].sort((a,b)=>Number(Boolean(b.sepuh))-Number(Boolean(a.sepuh))||(a.sepuh&&b.sepuh?(b.enrichmentXp??-1)-(a.enrichmentXp??-1):0)||compare(a,b)||a.alias.localeCompare(b.alias));
 const sepuhCount=sorted.filter(entry=>entry.sepuh).length;
 let rank=0;
 return sorted.map((entry,index)=>{
  const numberedIndex=index-sepuhCount;
  if(!entry.sepuh&&(!numberedIndex||compare(entry,sorted[index-1])!==0))rank=numberedIndex+1;
  const {finishedAt,...publicEntry}=entry;
  return {...publicEntry,rank:entry.sepuh?null:rank};
 });
}
