import { test, expect } from "vitest";
import { MISSIONS, getMission } from "../../src/shared/missions.js";
import { summarizeProgress, unlocked } from "../../src/shared/progress.js";
import { newSession, reduceSession } from "../../src/shared/assessment.js";
import { evaluateV2 } from "../../src/shared/v2-evaluator.js";
const complete = (score = 100) =>
  MISSIONS.filter((m) => !m.enrichment).map((m) => ({
    id: m.id,
    missionId: m.id,
    status: "complete",
    score,
    components: { K: score },
  }));
test("five islands cover 15 core and one optional C6, with L2 majority", () => {
  const core = MISSIONS.filter((m) => !m.enrichment);
  expect(core).toHaveLength(15);
  expect(MISSIONS).toHaveLength(16);
  expect(new Set(MISSIONS.map((m) => m.island)).size).toBe(5);
  expect(core.filter((m) => m.bloom === "C3")).toHaveLength(10);
  expect(core.filter((m) => m.bloom === "C4")).toHaveLength(4);
  expect(core.filter((m) => m.bloom === "C5")).toHaveLength(1);
  expect(MISSIONS.at(-1)).toMatchObject({
    bloom: "C6",
    enrichment: true,
    island: 5,
  });
});
test("boss requires all assessed scores and raw mean at least 90", () => {
  const boss = MISSIONS.at(-1);
  const sessions = complete(89.99);
  expect(unlocked(boss, summarizeProgress({ sessions }))).toBe(false);
  sessions.forEach((s) => {
    s.score = 90;
    s.components.K = 90;
  });
  expect(unlocked(boss, summarizeProgress({ sessions }))).toBe(true);
  sessions[14].status = "pending_review";
  expect(unlocked(boss, summarizeProgress({ sessions }))).toBe(false);
});
test("boss poor result never reduces main score; archived scores do not count", () => {
  const sessions = complete(96);
  const before = summarizeProgress({ sessions });
  sessions.push({
    id: "b",
    missionId: MISSIONS.at(-1).id,
    status: "complete",
    score: 0,
  });
  expect(summarizeProgress({ sessions }).score).toBe(before.score);
  expect(
    summarizeProgress({
      sessions: [{ missionId: "p01m01", status: "complete", score: 100 }],
    }).completed,
  ).toBe(0);
  expect(getMission("p01m01").missionVersion).toBe(1);
});
test("objective assessment includes time and hints; run is not final", () => {
  const m = MISSIONS[0];
  let s = newSession(m, "p");
  let n = 0;
  const send = (type, payload = {}) =>
    (s = reduceSession(
      s,
      { id: String(++n), seq: n, type, payload, activeMs: 500000 },
      m,
    ));
  for (const [key, value] of Object.entries(m.rules.answers))
    send("action", { op: "answer", key, value });
  send("hint");
  send("run");
  expect(s.status).toBe("active");
  send("submit");
  expect(s.status).toBe("complete");
  expect(s.components.K).toBe(100);
  expect(s.score).toBeLessThan(100);
});
test("C5 waits for teacher; student cannot forge a review event", () => {
  const m = MISSIONS.find((m) => m.bloom === "C5");
  let s = newSession(m, "p");
  let n = 0;
  const send = (type, payload = {}) =>
    (s = reduceSession(
      s,
      { id: String(++n), seq: n, type, payload, activeMs: 0 },
      m,
    ));
  for (const [key] of m.written)
    send("action", { op: "answer", key, value: "Bukti jawaban siswa" });
  send("submit");
  expect(s.status).toBe("pending_review");
  expect(s.score).toBe(null);
  send("action", { op: "grade", score: 100 });
  expect(s.score).toBe(null);
});
test("Python mean must generalize beyond visible data", () => {
  const m = MISSIONS.find((m) => m.kind === "python");
  let s = newSession(m, "p");
  let n = 0;
  const send = (type, payload = {}) =>
    (s = reduceSession(
      s,
      { id: String(++n), seq: n, type, payload, activeMs: 0 },
      m,
    ));
  send("action", { op: "answer", key: "code", value: "print(80)" });
  send("submit");
  expect(s.score).toBeLessThan(100);
  let good = newSession(m, "p");
  good = reduceSession(
    good,
    {
      id: "a",
      seq: 1,
      type: "action",
      payload: {
        op: "answer",
        key: "code",
        value:
          "nilai = [70,80,90,60,100]\ntotal = sum(nilai)\nrata = total / len(nilai)\nprint(rata)",
      },
      activeMs: 0,
    },
    m,
  );
  good = reduceSession(
    good,
    { id: "b", seq: 2, type: "submit", payload: {}, activeMs: 0 },
    m,
  );
  expect(good.score).toBe(100);
});
test("new mean assessment catches fixed divisor without regrading an existing session", () => {
  const m = MISSIONS.find((m) => m.kind === "python");
  const answer =
    "nilai = [70,80,90,60,100]\ntotal = sum(nilai)\nrata = total / 5\nprint(rata)";
  const submit = (revision) => {
    let s = { ...newSession(m, "p"), assessmentRevision: revision };
    s = reduceSession(
      s,
      {
        id: "a",
        type: "action",
        payload: { op: "answer", key: "code", value: answer },
        activeMs: 0,
      },
      m,
    );
    return reduceSession(
      s,
      { id: "b", type: "submit", payload: {}, activeMs: 0 },
      m,
    );
  };
  expect(submit(1).components.K).toBe(100);
  expect(submit(2).components.K).toBeLessThan(100);
  expect(newSession(m, "p").assessmentRevision).toBe(2);
});
test("new list debugging assessment checks that extra cargo remains", () => {
  const m = MISSIONS.find((m) => m.kind === "python-debug");
  const state = {
    answers: {
      ...m.rules.answers,
      code: 'kargo = ["Pangan", "Kayu", "Batu"]\nkargo = [kargo[0], "Air", "Obat"]\nprint(kargo)',
    },
  };
  expect(evaluateV2(m, state, 1).accuracy).toBe(100);
  expect(evaluateV2(m, state, 2).accuracy).toBeLessThan(100);
});
