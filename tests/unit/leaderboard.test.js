import {test,expect} from 'vitest';
import {leaderboardStats,rankLeaderboard} from '../../src/shared/leaderboard.js';
import {CORE_MISSIONS,BOSS} from '../../src/shared/missions.js';
const sessions=()=>CORE_MISSIONS.map((m,index)=>({id:m.id,missionId:m.id,status:'complete',activeMs:60000,hints:1,attempts:2,submittedAt:new Date(Date.UTC(2026,9,14,1,index)).toISOString()}));
test('first completion freezes core time and hints; later practice and enrichment do not increase them',()=>{
 const first=sessions();const base=leaderboardStats(first);
 const replay={...first[0],id:'replay',activeMs:1000,hints:0,attempts:20,submittedAt:'2026-10-14T02:00:00Z'};
 const boss={...replay,id:'boss',missionId:BOSS.id,activeMs:900000,hints:10};
 const result=leaderboardStats([...first,replay,boss]);
 expect(base).toMatchObject({activeSeconds:900,hints:15,attempts:30,sepuh:false});expect(result).toMatchObject({activeSeconds:900,hints:15,attempts:30,sepuh:true});expect(result.finishedAt).toBe(base.finishedAt);
});
test('time, then fewer hints, then earlier finish determine rank; equal criteria share rank',()=>{
 const rows=rankLeaderboard([
  {alias:'slow',activeSeconds:200,hints:0,finishedAt:1,sepuh:false},
  {alias:'fast-help',activeSeconds:100,hints:4,finishedAt:1},
  {alias:'first',activeSeconds:100,hints:0,finishedAt:2},
  {alias:'second',activeSeconds:100,hints:0,finishedAt:3},
  {alias:'tied',activeSeconds:100,hints:0,finishedAt:3}
 ]);
 expect(rows.map(r=>[r.alias,r.rank])).toEqual([['first',1],['second',2],['tied',2],['fast-help',4],['slow',5]]);expect(rows.every(r=>!Object.hasOwn(r,'finishedAt'))).toBe(true);
});
test('missing telemetry stays unknown instead of becoming the fastest time',()=>{
 const data=sessions();delete data[0].activeMs;const stats=leaderboardStats(data);
 expect(stats.activeSeconds).toBeNull();
 const rows=rankLeaderboard([{alias:'unknown',...stats},{alias:'known',activeSeconds:1000,hints:20,finishedAt:stats.finishedAt}]);expect(rows[0].alias).toBe('known');
});
test('opening or leaving enrichment unfinished does not award Sepuh',()=>{
 expect(leaderboardStats([...sessions(),{missionId:BOSS.id,status:'active'}]).sepuh).toBe(false);
});

test('Sepuh stays above numbered ranks, retains XP, and does not occupy a rank number',()=>{
 const rows=rankLeaderboard([
  {alias:'Sepuh kedua',score:1500,sepuh:true,activeSeconds:200,hints:2,finishedAt:2},
  {alias:'Nomor satu',score:1500,sepuh:false,activeSeconds:10,hints:0,finishedAt:1},
  {alias:'Sepuh pertama',score:1500,sepuh:true,activeSeconds:100,hints:4,finishedAt:1},
  {alias:'Nomor dua',score:1500,sepuh:false,activeSeconds:20,hints:0,finishedAt:2}
 ]);
 expect(rows.map(r=>[r.alias,r.rank])).toEqual([['Sepuh pertama',null],['Sepuh kedua',null],['Nomor satu',1],['Nomor dua',2]]);
 expect(rows.every(r=>r.score===1500)).toBe(true);
});

test('fewer attempts break time and hint ties before completion time, without changing XP',()=>{
 const rows=rankLeaderboard([
  {alias:'More tries',activeSeconds:100,hints:0,attempts:20,finishedAt:1,score:1500},
  {alias:'Fewer tries',activeSeconds:100,hints:0,attempts:15,finishedAt:2,score:1500},
  {alias:'Same tries',activeSeconds:100,hints:0,attempts:15,finishedAt:2,score:1500},
  {alias:'Unknown tries',activeSeconds:100,hints:0,attempts:null,finishedAt:1,score:1500}
 ]);
 expect(rows.map(r=>[r.alias,r.rank])).toEqual([['Fewer tries',1],['Same tries',1],['More tries',3],['Unknown tries',4]]);
 expect(rows.every(r=>r.score===1500)).toBe(true);
 const data=sessions();delete data[0].attempts;
 expect(leaderboardStats(data).attempts).toBeNull();
});
