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
test("competency keeps the best evidence; replays only deduct gameplay points", () => {
  const sessions = [
    session("first", 83),
    session("second"),
    session("third", 96.75),
  ];
  const r = summarizeProgress({ sessions });
  expect(r.bestByMission[CORE_MISSIONS[0].id].score).toBe(100);
  expect(r.gameMissionGrades[CORE_MISSIONS[0].id]).toMatchObject({
    bestScore: 100,
    replayCount: 2,
    replayPenalty: 2,
    score: 98,
  });
  expect(r.missionGrades[CORE_MISSIONS[0].id].score).toBe(100);
  expect(buildReport({ sessions }).rows[0]).toMatchObject({
    Nilai: 100,
    SkorGame: 98,
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
  expect(r.missionGrades[first.missionId].score).toBe(100);
  expect(r.gameMissionGrades[first.missionId].score).toBe(99);
});
test("competency determines islands, final mean and boss; game score remains separate", () => {
  const sessions = CORE_MISSIONS.map((m) => session(m.id, 90, m.id));
  expect(summarizeProgress({ sessions }).bossUnlocked).toBe(true);
  sessions.push(session("replay", 80));
  const r = summarizeProgress({ sessions });
  expect(r.competencies[0].score).toBe(100);
  expect(r.score).toBe(100);
  expect(r.gameCompetencies[0].score).toBe(89.67);
  expect(r.gameScore).toBe(89.93);
  expect(r.bossUnlocked).toBe(true);
});
test("replay penalty cannot produce a negative grade", () => {
  const r = summarizeProgress({ sessions: [session("a", 0), session("b", 0)] });
  expect(r.gameMissionGrades[CORE_MISSIONS[0].id].score).toBe(0);
});

test("best accuracy wins even when a faster attempt has a higher gameplay score", () => {
  const sessions = [
    {
      ...session("accurate", 80),
      components: { K: 95, H: 0, P: 0, E: 0, W: 0 },
    },
    {
      ...session("fast", 90),
      components: { K: 90, H: 100, P: 100, E: 100, W: 100 },
    },
  ];
  const r = summarizeProgress({ sessions });
  expect(r.missionGrades[CORE_MISSIONS[0].id].score).toBe(95);
  expect(r.bestByMission[CORE_MISSIONS[0].id].id).toBe("accurate");
  expect(r.gameMissionGrades[CORE_MISSIONS[0].id].score).toBe(89);
});
