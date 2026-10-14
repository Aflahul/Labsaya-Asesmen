import {CORE_MISSIONS,MISSIONS} from './missions.js';
const finished=s=>Boolean(s.activityCompletedAt)||s.status==='complete';
const finishTime=s=>{
 const time=Date.parse(s.submittedAt||s.activityCompletedAt||s.completedAt||'');
 return Number.isFinite(time)?time:null;
};
export function leaderboardStats(sessions) {
 const first=CORE_MISSIONS.map(m=>sessions.filter(s=>s.missionId===m.id&&finished(s)).sort((a,b)=>(finishTime(a)??Infinity)-(finishTime(b)??Infinity))[0]);
 const total=key=>first.every(s=>s&&Number.isFinite(s[key])&&s[key]>=0)?first.reduce((n,s)=>n+s[key],0):null;
 const ms=total('activeMs'),hints=total('hints'),times=first.map(s=>s&&finishTime(s));
 return {activeSeconds:ms===null?null:Math.round(ms/1000),hints,
  finishedAt:times.every(t=>Number.isFinite(t))?Math.max(...times):null,
  sepuh:sessions.some(s=>finished(s)&&MISSIONS.some(m=>m.id===s.missionId&&m.enrichment))};
}
const compare=(a,b)=>{
 for(const key of ['activeSeconds','hints','finishedAt']){
  const x=a[key]??Infinity,y=b[key]??Infinity;
  if(x!==y)return x<y?-1:1;
 }
 return 0;
};
export function rankLeaderboard(entries) {
 const sorted=[...entries].sort((a,b)=>compare(a,b)||a.alias.localeCompare(b.alias));
 let rank=0;
 return sorted.map((entry,index)=>{
  if(!index||compare(entry,sorted[index-1])!==0)rank=index+1;
  const {finishedAt,...publicEntry}=entry;
  return {...publicEntry,rank};
 });
}
