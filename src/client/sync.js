import { canonicalJson } from "../shared/contracts.js";
import { scoreSession } from "../shared/assessment.js";
function adopt(local, remote) {
  Object.assign(local, structuredClone(remote), {
    serverCreated: true,
    syncedCount: remote.events.length,
  });
}
export async function syncProgress({ progress, api, onStatus = () => {} }) {
  onStatus("Menyinkronkan…");
  const remote = await api("/progress");
  for (const server of remote.sessions) {
    const local = progress.sessions.find((s) => s.id === server.id);
    if (!local) {
      progress.sessions.push({
        ...server,
        serverCreated: true,
        syncedCount: server.events.length,
      });
      continue;
    }
    if (local.draftAnswers && server.status !== "active") {
      progress.conflicts ??= [];
      progress.conflicts.push({
        recordedAt: new Date().toISOString(),
        reason: "Draf lokal saat sesi sudah dikirim di perangkat lain",
        session: structuredClone(local),
      });
      delete local.draftAnswers;
    }
    const common = Math.min(local.events.length, server.events.length);
    const prefix = Array.from(
      { length: common },
      (_, i) =>
        canonicalJson(local.events[i]) === canonicalJson(server.events[i]),
    ).every(Boolean);
    if (!prefix) {
      progress.conflicts ??= [];
      if (
        !progress.conflicts.some(
          (c) =>
            c.session.id === local.id &&
            canonicalJson(c.session.events) === canonicalJson(local.events),
        )
      )
        progress.conflicts.push({
          recordedAt: new Date().toISOString(),
          reason: "Tindakan berbeda pada sesi yang sama di perangkat lain",
          session: structuredClone(local),
        });
      delete local.draftAnswers;
      adopt(local, server);
      continue;
    }
    if (server.events.length >= local.events.length) adopt(local, server);
    else {
      local.syncedCount = server.events.length;
      local.serverCreated = true;
      local.scoringConfig = server.scoringConfig;
    }
  }
  for (const s of progress.sessions) {
    if (s.syncedCount === s.events.length && s.serverCreated) continue;
    if (!s.serverCreated) {
      const created = await api("/sessions", {
        id: s.id,
        missionId: s.missionId,
        source: s.source || "offline",
        masteryCheck: Boolean(s.masteryCheck),
      });
      s.serverCreated = true;
      s.scoringConfig = created.scoringConfig;
      s.countedSession = created.countedSession;
      if (s.status === "complete") {
        const { score, ...components } = scoreSession(s, s.scoringConfig);
        s.score = score;
        s.components = components;
      }
    }
    const pending = s.events.slice(s.syncedCount || 0);
    for (let start = 0; start < pending.length; start += 100) {
      const batch = pending.slice(start, start + 100);
      const response = await api(`/sessions/${s.id}/events`, { events: batch });
      s.syncedCount = (s.syncedCount || 0) + batch.length;
      if (s.syncedCount === s.events.length) adopt(s, response.session);
    }
  }
  const pending = progress.sessions.some(
    (s) => !s.serverCreated || s.syncedCount !== s.events.length,
  );
  onStatus(
    progress.conflicts?.length
      ? "Konflik perangkat — bukti lokal dicadangkan di JSON"
      : pending
        ? "Belum tersinkron — ada tindakan baru"
        : progress.sessions.some(
              (s) => s.draftAnswers && Object.keys(s.draftAnswers).length,
            )
          ? "Draf tersimpan di perangkat ini — selesai mengetik untuk sinkronisasi"
          : "Tersinkron ke Neon",
  );
  return progress;
}
