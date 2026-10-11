import { test, expect } from "vitest";
import { CORE_MISSIONS } from "../../src/shared/missions.js";
import { summarizeProgress } from "../../src/shared/progress.js";
import { buildReport } from "../../src/shared/reports.js";
const session = (id, score = 100, missionId = CORE_MISSIONS[0].id) => ({
  id,
  missionId,
  status: "complete",
  score,
  components: { K: 100 },
});
test("best session stays intact; every distinct replay deducts one mission point", () => {
  const sessions = [
    session("first", 83),
    session("second"),
    session("third", 96.75),
  ];
  const r = summarizeProgress({ sessions });
  expect(r.bestByMission[CORE_MISSIONS[0].id].score).toBe(100);
  expect(r.missionGrades[CORE_MISSIONS[0].id]).toMatchObject({
    bestScore: 100,
    replayCount: 2,
    replayPenalty: 2,
    score: 98,
  });
  expect(buildReport({ sessions }).rows[0]).toMatchObject({
    Nilai: 98,
    NilaiSesiTerbaik: 100,
    Pengulangan: 2,
    PotonganUlang: 2,
  });
  expect(sessions[1].score).toBe(100);
});
test("new replay counts immediately, duplicate sync and old empty visits do not", () => {
  const first = session("first");
  const replay = {
    ...session("second"),
    status: "active",
    score: null,
    countedSession: true,
  };
  const emptyVisit = {
    ...session("old-empty"),
    status: "active",
    score: null,
    events: [],
  };
  const r = summarizeProgress({
    sessions: [first, replay, replay, emptyVisit],
  });
  expect(r.missionGrades[first.missionId].score).toBe(99);
});
test("adjusted mission grades determine islands, final mean and boss gate", () => {
  const sessions = CORE_MISSIONS.map((m) => session(m.id, 90, m.id));
  expect(summarizeProgress({ sessions }).bossUnlocked).toBe(true);
  sessions.push(session("replay", 80));
  const r = summarizeProgress({ sessions });
  expect(r.competencies[0].score).toBe(89.67);
  expect(r.score).toBe(89.93);
  expect(r.bossUnlocked).toBe(false);
});
test("replay penalty cannot produce a negative grade", () => {
  const r = summarizeProgress({ sessions: [session("a", 0), session("b", 0)] });
  expect(r.missionGrades[CORE_MISSIONS[0].id].score).toBe(0);
});
