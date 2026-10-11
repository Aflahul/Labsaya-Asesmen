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
test("hints, failed attempts, errors and time contribute independently", () => {
  const clean = play();
  for (const options of [{ hints: 1 }, { badRuns: 1 }, { activeMs: 3600000 }]) {
    const s = play(options);
    expect(s.components.K).toBe(100);
    expect(s.score).toBeLessThan(clean.score);
    expect(scoreSession(s, s.scoringConfig).score).toBe(s.score);
  }
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
  expect(upgraded.score).toBe(original.score);
  expect(upgraded.components).toEqual(original.components);
  expect(upgraded.events).toEqual(old.events);
  expect(upgraded.completedAt).toBe(old.completedAt);
  expect(upgradeScoring(upgraded)).toBe(upgraded);
  expect(old.score).toBe(100);
});
