import { test, expect } from "vitest";
import { MISSIONS } from "../../src/shared/missions.js";
import {
  newSession,
  reduceSession,
  scoreSession,
} from "../../src/shared/assessment.js";
import { gradeReview } from "../../src/shared/v2-evaluator.js";
const m = MISSIONS[0];
function play({ hints = 0, badRuns = 0, activeMs = 1000 } = {}) {
  let s = newSession(m, "p"),
    seq = 0;
  const send = (type, payload = {}) => {
    s = reduceSession(
      s,
      { id: String(++seq), seq, type, payload, activeMs },
      m,
    );
  };
  for (let i = 0; i < hints; i++) send("hint");
  for (let i = 0; i < badRuns; i++) send("run");
  for (const [key, value] of Object.entries(m.rules.answers))
    send("action", { op: "answer", key, value });
  send("run");
  send("submit");
  return s;
}
test("a correct preview followed by unchanged submission counts once and earns 100", () => {
  const s = play();
  expect(s.attempts).toBe(1);
  expect(s.score).toBe(100);
});
test("first hint is free in new sessions while old scoring remains reproducible", () => {
  const first = play({ hints: 1 });
  const second = play({ hints: 2 });
  expect(first.scoringConfig.formulaVersion).toBe(4);
  expect(first.components.H).toBe(100);
  expect(first.score).toBe(100);
  expect(second.components.H).toBe(75);
  expect(second.score).toBe(97.5);
  const old = scoreSession(
    { ...first, scoringConfig: { ...first.scoringConfig, formulaVersion: 3 } },
    { ...first.scoringConfig, formulaVersion: 3 },
  );
  expect(old.score).toBe(97.5);
});
test("hints, failed attempts, errors and time contribute independently", () => {
  const clean = play();
  for (const options of [{ hints: 2 }, { badRuns: 1 }, { activeMs: 3600000 }]) {
    const s = play(options);
    expect(s.components.K).toBe(100);
    expect(s.score).toBeLessThan(clean.score);
    expect(scoreSession(s, s.scoringConfig).score).toBe(s.score);
  }
  const oneBadRun = play({ badRuns: 1 });
  expect(oneBadRun.attempts).toBe(2);
  expect(oneBadRun.errors).toBe(1);
  expect(oneBadRun.score).toBe(97);
  const s = play({ badRuns: 2 });
  expect(s.errors).toBe(2);
  expect(s.components.E).toBeLessThan(100);
  expect(s.components.P).toBeLessThan(100);
});
test("reviewed missions combine teacher accuracy with recorded process", () => {
  const m = MISSIONS.find((m) => m.bloom === "C5");
  const s = {
    ...newSession(m, "p"),
    status: "pending_review",
    hints: 2,
    attempts: 3,
    errors: 1,
    activeMs: 3600000,
  };
  const graded = gradeReview(
    s,
    m,
    Object.fromEntries(m.rubric.map(([key, , max]) => [key, max])),
    "Bagus",
    "teacher",
  );
  expect(graded.components.K).toBe(100);
  expect(graded.score).toBeLessThan(100);
  expect(scoreSession(graded, graded.scoringConfig).score).toBe(graded.score);
});
test("existing completed sessions are recalculated from their event evidence once", async () => {
  const { upgradeScoring } = await import("../../src/shared/assessment.js");
  const original = play({ hints: 2, badRuns: 1 });
  const old = {
    ...original,
    scoringConfig: { baselineMultiplier: 1, elements: m.elements },
    score: 100,
    components: { K: 100 },
  };
  const upgraded = upgradeScoring(old);
  const legacy = scoreSession(
    {
      ...original,
      scoringConfig: { ...original.scoringConfig, formulaVersion: 3 },
    },
    { ...original.scoringConfig, formulaVersion: 3 },
  );
  expect(upgraded.score).toBe(legacy.score);
  expect(upgraded.components).toMatchObject({
    K: legacy.K,
    H: legacy.H,
    P: legacy.P,
    E: legacy.E,
    W: legacy.W,
  });
  expect(upgraded.events).toEqual(old.events);
  expect(upgraded.completedAt).toBe(old.completedAt);
  expect(upgradeScoring(upgraded)).toBe(upgraded);
  expect(old.score).toBe(100);
});

test("each mission has a task-specific time target with decreasing overtime points", async () => {
  const { MISSIONS } = await import("../../src/shared/missions.js");
  const { scoreMission } = await import("../../src/shared/mission-scoring.js");
  for (const mission of MISSIONS) {
    expect(mission.timeBudgetSeconds).toBeGreaterThan(0);
    expect(mission.timeBudgetReason.length).toBeGreaterThan(20);
    const s = newSession(mission, "timing-test");
    const points = (multiple) =>
      scoreMission(
        { ...s, activeMs: mission.timeBudgetSeconds * multiple * 1000 },
        100,
      ).W;
    expect(points(1)).toBe(100);
    expect(points(1.5)).toBe(75);
    expect(points(2)).toBe(50);
    expect(points(2.5)).toBe(25);
    expect(points(3)).toBe(0);
    expect(points(4)).toBe(0);
  }
});

test("a saved session keeps its original time allowance", async () => {
  const { upgradeScoring } = await import("../../src/shared/assessment.js");
  const old = play();
  old.scoringConfig.timeBudgetSeconds = 300;
  old.activeMs = 180000;
  expect(scoreSession(upgradeScoring(old), old.scoringConfig).W).toBe(100);
  expect(
    scoreSession(
      {
        ...old,
        scoringConfig: { ...old.scoringConfig, timeBudgetSeconds: 90 },
      },
      { timeBudgetSeconds: 90 },
    ).W,
  ).toBe(50);
});

test("Coba and Bersihkan each have one free use then cost one point", () => {
  const s = {
    ...newSession(m, "p"),
    firstAccuracy: 100,
    components: { K: 100 },
  };
  const score = (attempts, resets) =>
    scoreSession({ ...s, attempts, resets }, s.scoringConfig).score;
  expect(score(1, 0)).toBe(100);
  expect(score(1, 1)).toBe(100);
  expect(score(2, 0)).toBe(99);
  expect(score(1, 2)).toBe(99);
  expect(score(2, 2)).toBe(98);
  expect(score(100, 100)).toBe(90);
});

test("version 2 history receives the new attempt rule without changing its time budget", async () => {
  const { upgradeScoring } = await import("../../src/shared/assessment.js");
  const old = play({ badRuns: 1 });
  old.scoringConfig = {
    ...old.scoringConfig,
    formulaVersion: 2,
    timeBudgetSeconds: 300,
  };
  old.score = 96;
  old.components.P = 80;
  const updated = upgradeScoring(old);
  expect(updated.scoringConfig.formulaVersion).toBe(3);
  expect(updated.scoringConfig.timeBudgetSeconds).toBe(300);
  expect(updated.score).toBe(97);
  expect(updated.events).toEqual(old.events);
  expect(upgradeScoring(updated)).toBe(updated);
  expect(old.score).toBe(96);
});
