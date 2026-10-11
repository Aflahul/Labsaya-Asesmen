import { upgradeScoring } from "./assessment.js";
import { MISSIONS, CORE_MISSIONS, ISLANDS } from "./missions.js";
const valid = new Set(MISSIONS.map((m) => m.id));
export function summarizeProgress({ sessions = [] }) {
  sessions = sessions.map(upgradeScoring);
  const latestByMission = {},
    bestByMission = {};
  for (const s of sessions) {
    if (
      !valid.has(s.missionId) ||
      s.status !== "complete" ||
      !Number.isFinite(s.score) ||
      s.score < 0 ||
      s.score > 100
    )
      continue;
    const old = latestByMission[s.missionId];
    if (!old || (s.completedAt || "") >= (old.completedAt || ""))
      latestByMission[s.missionId] = s;
    if (
      !bestByMission[s.missionId] ||
      s.score > bestByMission[s.missionId].score
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
  const missionGrades = Object.fromEntries(
    Object.entries(bestByMission).map(([id, s]) => {
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
  const done = CORE_MISSIONS.filter((m) => bestByMission[m.id]);
  const mean = (rows) =>
    rows.length ? rows.reduce((n, s) => n + s.score, 0) / rows.length : null;
  const rawScore =
    done.length === CORE_MISSIONS.length
      ? mean(done.map((m) => missionGrades[m.id]))
      : null;
  const totals = { activeMs: 0, attempts: 0, errors: 0, resets: 0, hints: 0 };
  for (const s of sessions.filter((s) => valid.has(s.missionId)))
    for (const k in totals) totals[k] += s[k] || 0;
  return {
    missionGrades,
    latestByMission,
    bestByMission,
    completed: done.length,
    coreCount: CORE_MISSIONS.length,
    rawScore,
    score: rawScore === null ? null : Math.round(rawScore * 100) / 100,
    accuracy: done.length
      ? Math.round(
          (done.reduce(
            (sum, m) =>
              sum +
              (bestByMission[m.id].components?.K ??
                bestByMission[m.id].firstAccuracy ??
                bestByMission[m.id].score),
            0,
          ) /
            done.length) *
            100,
        ) / 100
      : null,
    bossUnlocked: rawScore !== null && rawScore >= 90,
    pendingReview: sessions.filter(
      (s) => valid.has(s.missionId) && s.status === "pending_review",
    ).length,
    enrichmentCompleted: MISSIONS.filter(
      (m) => m.enrichment && bestByMission[m.id],
    ).length,
    legacyCount: sessions.filter((s) => !valid.has(s.missionId)).length,
    competencies: ISLANDS.map((i) => {
      const ms = CORE_MISSIONS.filter((m) => m.island === i.id),
        rows = ms.map((m) => missionGrades[m.id]).filter(Boolean);
      return {
        name: i.name,
        complete: rows.length === 3,
        score: rows.length === 3 ? Math.round(mean(rows) * 100) / 100 : null,
      };
    }),
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
