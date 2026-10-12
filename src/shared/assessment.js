import { getMission } from "./missions.js";
import { scoreMission } from "./mission-scoring.js";
import { initialV2, reduceV2 } from "./v2-evaluator.js";
import { initialState, applyAction, evaluate } from "./evaluators/index.js";
const clamp = (x) => Math.max(0, Math.min(100, Math.round(x)));
export const weightedScore = ({ K, W, P, H }) =>
  Math.round(0.4 * K + 0.25 * W + 0.2 * P + 0.15 * H);
export function scoreSession(m, c) {
  if (m.missionVersion === 2)
    return scoreMission(
      m,
      m.components?.K ?? m.firstAccuracy ?? m.score ?? 0,
      c,
    );
  const baseline =
    Math.max(45, 30 + 12 * c.elements) * (c.baselineMultiplier || 1);
  const K = clamp(0.6 * (m.firstAccuracy ?? 0) + 40),
    W = clamp(
      100 * (1 - Math.max(0, m.activeMs / 1000 - baseline) / (2 * baseline)),
    ),
    P = clamp(100 - 25 * Math.max(0, m.attempts - 1) - 12 * m.resets),
    H = clamp(100 - 40 * m.hints);
  return { K, W, P, H, score: weightedScore({ K, W, P, H }) };
}
export function newSession(
  m,
  participantId,
  config = { baselineMultiplier: 1 },
) {
  return {
    id: crypto.randomUUID(),
    participantId,
    missionId: m.id,
    missionVersion: m.missionVersion,
    assessmentRevision: m.missionVersion === 2 ? 2 : 1,
    countedSession: m.missionVersion === 2,
    scoringConfig: {
      ...config,
      elements: m.elements,
      ...(m.missionVersion === 2
        ? { timeBudgetSeconds: m.timeBudgetSeconds, formulaVersion: 3 }
        : {}),
    },
    events: [],
    state: m.missionVersion === 2 ? initialV2(m) : initialState(m),
    firstAccuracy: null,
    attempts: 0,
    errors: 0,
    resets: 0,
    hints: 0,
    activeMs: 0,
    status: "active",
    startedAt: new Date().toISOString(),
    completedAt: null,
    components: null,
    score: null,
    source: "online",
    correctSteps: 0,
    stepAccuracyFrozen: false,
    feedback: "",
  };
}
export function reduceSession(old, e, m) {
  if (m.missionVersion === 2) return reduceV2(old, e, m);
  if (old.events.some((x) => x.id === e.id) || old.status === "complete")
    return old;
  const s = structuredClone(old);
  s.activeMs = Math.max(s.activeMs, e.activeMs);
  s.events.push(e);
  s.feedback = "";
  if (e.type === "action") {
    const r = applyAction(m, s.state, e.payload);
    s.state = r.state;
    if (r.errors.length) {
      s.errors++;
      s.feedback = r.errors.join(" ");
      if (
        ["robot", "cpu", "bubble"].includes(m.kind) &&
        !s.stepAccuracyFrozen &&
        s.firstAccuracy === null
      ) {
        s.firstAccuracy = clamp(
          (100 * s.correctSteps) / Math.max(1, m.canonicalSteps),
        );
        s.stepAccuracyFrozen = true;
      }
    } else {
      s.correctSteps++;
    }
  }
  if (e.type === "hint") s.hints++;
  if (e.type === "reset") {
    s.resets++;
    s.state = initialState(m);
  }
  if (
    ["submit", "run"].includes(e.type) ||
    (e.type === "action" && e.payload.op === "test")
  ) {
    s.attempts++;
    const r = evaluate(m, s.state);
    if (s.firstAccuracy === null) s.firstAccuracy = r.accuracy;
    s.feedback = r.feedback;
    if (r.complete) {
      s.status = "complete";
      s.completedAt = new Date().toISOString();
      const { score, ...components } = scoreSession(s, s.scoringConfig);
      s.score = score;
      s.components = components;
    } else s.errors++;
  }
  return s;
}

// Upgrade only recorded v2 sessions; preserve original evidence and timestamps.
export function upgradeScoring(session) {
  if (
    session.missionVersion !== 2 ||
    session.scoringConfig?.formulaVersion === 3 ||
    !session.events?.length
  )
    return session;
  const m = getMission(session.missionId);
  let replay = newSession(m, session.participantId);
  replay.scoringConfig = {
    ...replay.scoringConfig,
    ...session.scoringConfig,
    formulaVersion: 3,
  };
  for (const event of session.events) replay = reduceV2(replay, event, m);
  const result = {
    ...session,
    scoringConfig: replay.scoringConfig,
    attempts: replay.attempts,
    errors: replay.errors,
    resets: replay.resets,
    hints: replay.hints,
    activeMs: replay.activeMs,
  };
  if (session.status === "complete") {
    const accuracy = m.written
      ? (session.components?.K ?? session.firstAccuracy ?? session.score)
      : (replay.components?.K ?? session.firstAccuracy ?? session.score);
    const { score, ...components } = scoreMission(result, accuracy);
    Object.assign(result, { score, components, firstAccuracy: accuracy });
  }
  return result;
}
