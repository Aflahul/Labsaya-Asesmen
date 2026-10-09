export async function syncProgress({ progress, api, onStatus = () => {} }) {
  onStatus("Menyinkronkan…");
  for (const s of progress.sessions) {
    if (s.syncedCount === s.events.length && s.serverCreated) continue;
    if (!s.serverCreated) {
      await api("/sessions", {
        id: s.id,
        missionId: s.missionId,
        source: s.source || "offline",
      });
      s.serverCreated = true;
    }
    const pending = s.events.slice(s.syncedCount || 0);
    for (let start = 0; start < pending.length; start += 100) {
      const batch = pending.slice(start, start + 100);
      const r = await api(`/sessions/${s.id}/events`, { events: batch });
      s.syncedCount = (s.syncedCount || 0) + batch.length;
      if (s.syncedCount === s.events.length) {
        Object.assign(s, r.session, {
          serverCreated: true,
          syncedCount: s.syncedCount,
        });
      }
    }
  }
  const remote = await api("/progress");
  for (const s of remote.sessions) {
    const local = progress.sessions.find((x) => x.id === s.id);
    if (!local)
      progress.sessions.push({
        ...s,
        serverCreated: true,
        syncedCount: s.events.length,
      });
  }
  onStatus("Tersinkron ke Neon");
  return progress;
}
