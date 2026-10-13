import { updateDraft } from "./drafts.js";
import { getMission } from "../shared/missions.js";
import { newSession, reduceSession } from "../shared/assessment.js";
import { validateEvent } from "../shared/contracts.js";
const uuid = (s) => typeof s === "string" && /^[a-f0-9-]{36}$/i.test(s);
export function validateImport(raw, participantId) {
  if (
    raw?.schemaVersion !== 1 ||
    raw.participantId !== participantId ||
    !Array.isArray(raw.sessions) ||
    raw.sessions.length > 1000
  )
    throw Error("Cadangan tidak cocok dengan akun ini");
  const ids = new Set();
  const sessions = raw.sessions.map((input) => {
    const m = getMission(input.missionId);
    if (
      input.participantId !== participantId ||
      !uuid(input.id) ||
      ids.has(input.id) ||
      !Array.isArray(input.events) ||
      input.events.length > 10000 ||
      input.missionVersion !== m.missionVersion ||
      !Number.isFinite(input.scoringConfig?.baselineMultiplier) ||
      input.scoringConfig.baselineMultiplier < 0.5 ||
      input.scoringConfig.baselineMultiplier > 3
    )
      throw Error("Sesi cadangan tidak valid");
    ids.add(input.id);
    let s = newSession(m, participantId, {
      baselineMultiplier: input.scoringConfig.baselineMultiplier,
      ...(input.assessmentPolicy === "indicator-v1" ? {assessmentPolicy: "indicator-v1", masteryCheck: Boolean(input.masteryCheck)} : {}),
    });
    s.id = input.id;
    s.source = input.source === "offline" ? "offline" : "online";
    const eventIds = new Set();
    for (const e of input.events) {
      validateEvent(e);
      if (
        !uuid(e.id) ||
        eventIds.has(e.id) ||
        e.sessionId !== s.id ||
        e.seq !== s.events.length + 1 ||
        e.activeMs < s.activeMs ||
        e.activeMs > 86400000 ||
        s.status !== "active"
      )
        throw Error("Jejak cadangan tidak valid");
      eventIds.add(e.id);
      s = reduceSession(s, e, m);
    }
    if (input.startedAt && Number.isFinite(Date.parse(input.startedAt)))
      s.startedAt = input.startedAt;
    if (
      s.status === "complete" &&
      input.completedAt &&
      Number.isFinite(Date.parse(input.completedAt))
    )
      s.completedAt = input.completedAt;
    if (input.draftAnswers !== undefined) {
      if (
        !input.draftAnswers ||
        typeof input.draftAnswers !== "object" ||
        Array.isArray(input.draftAnswers)
      )
        throw Error("Draf cadangan tidak valid");
      for (const [key, value] of Object.entries(input.draftAnswers))
        updateDraft(s, m, key, value);
    }
    s.serverCreated = false;
    s.syncedCount = 0;
    return s;
  });
  const conflicts = [];
  if (raw.conflicts !== undefined) {
    if (!Array.isArray(raw.conflicts) || raw.conflicts.length > 1000)
      throw Error("Arsip konflik tidak valid");
    for (const conflict of raw.conflicts) {
      const restored = validateImport(
        { schemaVersion: 1, participantId, sessions: [conflict.session] },
        participantId,
      );
      conflicts.push({
        recordedAt: conflict.recordedAt,
        reason: "Konflik perangkat dari cadangan",
        session: restored.sessions[0],
      });
    }
  }
  return {
    participantId,
    sessions,
    ...(conflicts.length ? { conflicts } : {}),
  };
}
