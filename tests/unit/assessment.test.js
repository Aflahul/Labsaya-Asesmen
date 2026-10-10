import { test, expect } from "vitest";
import { MISSIONS } from "../../src/shared/legacy/missions.js";
test("weighted score and time boundaries", async () => {
  const { scoreSession, weightedScore } =
    await import("../../src/shared/assessment.js");
  expect(weightedScore({ K: 100, W: 80, P: 75, H: 60 })).toBe(84);
  expect(
    scoreSession(
      { firstAccuracy: 100, attempts: 1, resets: 0, hints: 0, activeMs: 0 },
      { elements: 3 },
    ).score,
  ).toBe(100);
  expect(
    scoreSession(
      {
        firstAccuracy: 100,
        attempts: 1,
        resets: 0,
        hints: 1,
        activeMs: 198000,
      },
      { elements: 3 },
    ),
  ).toMatchObject({ H: 60, W: 0 });
});
test("first accuracy and history preserved across reset", async () => {
  const { newSession, reduceSession } =
    await import("../../src/shared/assessment.js");
  let s = newSession(MISSIONS[0], "p");
  s = reduceSession(
    s,
    { id: "1", seq: 1, type: "submit", payload: {}, activeMs: 2000 },
    MISSIONS[0],
  );
  const accuracy = s.firstAccuracy;
  s = reduceSession(
    s,
    { id: "2", seq: 2, type: "reset", payload: {}, activeMs: 3000 },
    MISSIONS[0],
  );
  expect(s.firstAccuracy).toBe(accuracy);
  expect(s.attempts).toBe(1);
  expect(s.resets).toBe(1);
});
test("final score requires all 16 core missions", async () => {
  const { summarizeProgress } = await import("../../src/shared/legacy/progress.js");
  const sessions = MISSIONS.slice(0, 15).map((m) => ({
    missionId: m.id,
    status: "complete",
    score: 100,
    components: { K: 100 },
    activeMs: 0,
    attempts: 1,
    errors: 0,
    resets: 0,
    hints: 0,
  }));
  expect(summarizeProgress({ sessions }).score).toBe(null);
  sessions.push({ ...sessions[0], missionId: MISSIONS[15].id });
  expect(summarizeProgress({ sessions }).score).toBe(100);
});
test("first step accuracy cannot exceed 100 and best session remains independent", async () => {
  const { newSession, reduceSession } =
    await import("../../src/shared/assessment.js");
  const { summarizeProgress } = await import("../../src/shared/legacy/progress.js");
  const m = MISSIONS[7];
  let s = newSession(m, "p");
  s.correctSteps = 100;
  s = reduceSession(
    s,
    {
      id: "a",
      seq: 1,
      type: "action",
      payload: { op: "direction", value: "Kanan" },
      activeMs: 10,
    },
    m,
  );
  expect(s.firstAccuracy).toBeLessThanOrEqual(100);
  const p = {
    sessions: [
      {
        id: "best",
        missionId: m.id,
        status: "complete",
        score: 100,
        attempts: 1,
        errors: 0,
        components: { K: 100 },
      },
      {
        id: "latest",
        missionId: m.id,
        status: "complete",
        score: 70,
        attempts: 4,
        errors: 3,
        components: { K: 60 },
      },
    ],
  };
  const r = summarizeProgress(p);
  expect(r.bestByMission[m.id].id).toBe("best");
  expect(r.latestByMission[m.id].id).toBe("latest");
  expect(r.totals.attempts).toBe(5);
  expect(r.bestByMission[m.id].attempts).toBe(1);
});
test("failed submit freezes accuracy before later simulator mistake", async () => {
  const { newSession, reduceSession } =
    await import("../../src/shared/assessment.js");
  const m = MISSIONS[7];
  let s = newSession(m, "p");
  s = reduceSession(
    s,
    { id: "a", seq: 1, type: "submit", payload: {}, activeMs: 0 },
    m,
  );
  expect(s.firstAccuracy).toBe(0);
  s.correctSteps = 3;
  s = reduceSession(
    s,
    {
      id: "b",
      seq: 2,
      type: "action",
      payload: { op: "direction", value: "Kanan" },
      activeMs: 100,
    },
    m,
  );
  expect(s.firstAccuracy).toBe(0);
});
test("failed program run counts and freezes first accuracy", async () => {
  const { newSession, reduceSession } =
    await import("../../src/shared/assessment.js");
  const { solution } = await import("../fixtures/solutions.js");
  const m = MISSIONS[10];
  let s = newSession(m, "p");
  let n = 0;
  const send = (type, payload = {}) => {
    s = reduceSession(
      s,
      { id: String(++n), seq: n, type, payload, activeMs: 1000 },
      m,
    );
  };
  send("action", { op: "test" });
  expect(s.attempts).toBe(1);
  expect(s.errors).toBe(1);
  const first = s.firstAccuracy;
  for (const a of solution(m)) send("action", a);
  expect(s.status).toBe("complete");
  expect(s.attempts).toBe(2);
  expect(s.firstAccuracy).toBe(first);
  send("submit");
  expect(s.attempts).toBe(2);
});
