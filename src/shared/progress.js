import { upgradeScoring } from "./assessment.js";
import { MISSIONS, CORE_MISSIONS, ISLANDS } from "./missions.js";
const valid = new Set(MISSIONS.map((m) => m.id));
const competencyOf = (session) =>
  session.components?.K ?? session.firstAccuracy ?? session.score;
export function summarizeProgress({ sessions = [] }) {
  sessions = sessions.map(upgradeScoring);
  const latestByMission = {},
    bestByMission = {},
    gameBestByMission = {};
  for (const s of sessions) {
    const competency = competencyOf(s);
    if (
      !valid.has(s.missionId) ||
      s.status !== "complete" ||
      !Number.isFinite(s.score) ||
      s.score < 0 ||
      s.score > 100 ||
      !Number.isFinite(competency) ||
      competency < 0 ||
      competency > 100
    )
      continue;
    const old = latestByMission[s.missionId];
    if (!old || (s.completedAt || "") >= (old.completedAt || ""))
      latestByMission[s.missionId] = s;
    if (
      !gameBestByMission[s.missionId] ||
      s.score > gameBestByMission[s.missionId].score
    )
      gameBestByMission[s.missionId] = s;
    if (
      !bestByMission[s.missionId] ||
      competency > competencyOf(bestByMission[s.missionId]) ||
      (competency === competencyOf(bestByMission[s.missionId]) &&
        s.score > bestByMission[s.missionId].score)
    )
      bestByMission[s.missionId] = s;
  }
  // Count distinct starts, not sync copies. Older empty visits were auto-created
  // by the old UI, so only count those with actual assessment activity.
  const starts = {};
  for (const s of sessions) {
    if (!valid.has(s.missionId)) continue;
    if (!(
      s.countedSession ||
      ["complete", "pending_review"].includes(s.status) ||
      s.events?.some((e) =>
        ["action", "hint", "run", "submit", "reset"].includes(e.type),
      )
    ))
      continue;
    (starts[s.missionId] ??= new Set()).add(s.id ?? s);
  }
  const gameMissionGrades = Object.fromEntries(
    Object.entries(gameBestByMission).map(([id, s]) => {
      const replayCount = Math.max(0, (starts[id]?.size || 1) - 1);
      return [
        id,
        {
          bestScore: s.score,
          replayCount,
          replayPenalty: replayCount,
          score: Math.max(0, Math.round((s.score - replayCount) * 100) / 100),
        },
      ];
    }),
  );
  const missionGrades = Object.fromEntries(
    Object.entries(bestByMission).map(([id, s]) => [
      id,
      {
        bestScore: competencyOf(s),
        score: competencyOf(s),
        replayCount: gameMissionGrades[id]?.replayCount ?? 0,
        replayPenalty: 0,
      },
    ]),
  );
  const done = CORE_MISSIONS.filter((m) => bestByMission[m.id]);
  const mean = (rows) =>
    rows.length ? rows.reduce((n, s) => n + s.score, 0) / rows.length : null;
  const rawScore =
    done.length === CORE_MISSIONS.length
      ? mean(done.map((m) => missionGrades[m.id]))
      : null;
  const gameRawScore =
    done.length === CORE_MISSIONS.length
      ? mean(done.map((m) => gameMissionGrades[m.id]))
      : null;
  const islandGrades = (grades) =>
    ISLANDS.map((i) => {
      const ms = CORE_MISSIONS.filter((m) => m.island === i.id);
      const rows = ms.map((m) => grades[m.id]).filter(Boolean);
      return {
        name: i.name,
        complete: rows.length === 3,
        score: rows.length === 3 ? Math.round(mean(rows) * 100) / 100 : null,
      };
    });
  const totals = { activeMs: 0, attempts: 0, errors: 0, resets: 0, hints: 0 };
  for (const s of sessions.filter((s) => valid.has(s.missionId)))
    for (const k in totals) totals[k] += s[k] || 0;
  return {
    missionGrades,
    gameMissionGrades,
    latestByMission,
    bestByMission,
    gameBestByMission,
    completed: done.length,
    coreCount: CORE_MISSIONS.length,
    rawScore,
    score: rawScore === null ? null : Math.round(rawScore * 100) / 100,
    gameRawScore,
    gameScore:
      gameRawScore === null ? null : Math.round(gameRawScore * 100) / 100,
    scoringPolicy: "competency-v1",
    accuracy: done.length
      ? Math.round(mean(done.map((m) => missionGrades[m.id])) * 100) / 100
      : null,
    bossUnlocked: rawScore !== null && rawScore >= 90,
    pendingReview: sessions.filter(
      (s) => valid.has(s.missionId) && s.status === "pending_review",
    ).length,
    enrichmentCompleted: MISSIONS.filter(
      (m) => m.enrichment && bestByMission[m.id],
    ).length,
    legacyCount: sessions.filter((s) => !valid.has(s.missionId)).length,
    competencies: islandGrades(missionGrades),
    gameCompetencies: islandGrades(gameMissionGrades),
    totals,
  };
}
export function unlocked(m, summary) {
  if (m.missionVersion !== 2) return false;
  if (m.enrichment) return summary.bossUnlocked === true;
  return CORE_MISSIONS.filter((x) => x.island < m.island).every(
    (x) => summary.bestByMission[x.id],
  );
}
