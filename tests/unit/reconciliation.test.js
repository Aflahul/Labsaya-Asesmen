import { test, expect } from "vitest";
import { newSession } from "../../src/shared/assessment.js";
import { MISSIONS } from "../../src/shared/missions.js";
import { summarizeProgress } from "../../src/shared/progress.js";
import { syncProgress } from "../../src/client/sync.js";
test("same-session remote completion replaces stale synced prefix", async () => {
  const local = newSession(MISSIONS[0], "p");
  local.serverCreated = true;
  local.syncedCount = 0;
  const remote = {
    ...structuredClone(local),
    status: "complete",
    events: [{ id: "r" }],
    score: 100,
  };
  const p = { sessions: [local] };
  await syncProgress({
    progress: p,
    api: async () => ({ sessions: [remote] }),
  });
  expect(p.sessions[0].status).toBe("complete");
  expect(p.sessions[0].events).toHaveLength(1);
});
test("divergent pending evidence remains archived and warning visible", async () => {
  const local = newSession(MISSIONS[0], "p");
  local.events = [{ id: "local", seq: 1 }];
  local.syncedCount = 0;
  local.serverCreated = true;
  const remote = {
    ...structuredClone(local),
    events: [{ id: "remote", seq: 1 }],
  };
  const p = { sessions: [local] };
  let status;
  await syncProgress({
    progress: p,
    api: async (path) => {
      if (path === "/progress") return { sessions: [remote] };
      throw Error("Must reconcile before sending conflicting events");
    },
    onStatus: (s) => (status = s),
  });
  expect(p.conflicts[0].session.events[0].id).toBe("local");
  expect(p.sessions[0].events[0].id).toBe("remote");
  expect(status).toContain("Konflik");
});
test("latest score independent of shuffled session array", () => {
  const a = {
      id: "a",
      missionId: "v2p01m01",
      status: "complete",
      score: 100,
      components: { K: 100 },
      completedAt: "2026-10-09T01:00:00Z",
    },
    b = { ...a, id: "b", score: 94, completedAt: "2026-10-09T02:00:00Z" };
  expect(
    summarizeProgress({ sessions: [b, a] }).latestByMission.v2p01m01.id,
  ).toBe("b");
});

test('server cleanup removes cached attempts before any upload and preserves other sessions',async()=>{
 const removed={id:'removed',events:[],serverCreated:false};const retained={id:'retained',events:[],serverCreated:true,syncedCount:0};
 const progress={sessions:[removed,retained],conflicts:[{session:removed},{session:retained}]};const calls=[];
 await syncProgress({progress,api:async(path,body)=>{calls.push({path,body});return {sessions:[],removedSessionIds:['removed']};}});
 expect(progress.sessions.map(s=>s.id)).toEqual(['retained']);expect(progress.conflicts.map(c=>c.session.id)).toEqual(['retained']);
 expect(calls.every(c=>!c.body)).toBe(true);
});
