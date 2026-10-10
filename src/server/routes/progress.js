import {
  summarizeProgress as legacySummary,
  unlocked as legacyUnlocked,
} from "../../shared/legacy/progress.js";
import { getMission } from "../../shared/missions.js";
import { newSession, reduceSession } from "../../shared/assessment.js";
import { summarizeProgress, unlocked } from "../../shared/progress.js";
import { validateEvent, canonicalJson } from "../../shared/contracts.js";
import { fail } from "../auth.js";
export async function loadProgress(db, id) {
  const { rows } = await db.query(
    "SELECT document FROM mission_sessions WHERE participant_id=$1 ORDER BY updated_at",
    [id],
  );
  return { participantId: id, sessions: rows.map((r) => r.document) };
}
export async function progressRoutes(app) {
  app.get("/api/progress", async (req) => {
    const a = app.requireRole(req, "participant");
    return { data: await loadProgress(app.db, a.user_id) };
  });
  app.post("/api/sessions", async (req, reply) => {
    const a = app.requireRole(req, "participant");
    const b = req.body || {};
    if (typeof b.id !== "string" || !/^[a-f0-9-]{36}$/i.test(b.id))
      fail(400, "ID sesi tidak valid");
    let m;
    try {
      m = getMission(b.missionId);
    } catch {
      fail(400, "Misi tidak valid");
    }
    const existing = await app.db.query(
      "SELECT document,participant_id FROM mission_sessions WHERE id=$1",
      [b.id],
    );
    if (existing.rows[0]) {
      if (existing.rows[0].participant_id !== a.user_id)
        fail(403, "Sesi bukan milik Anda");
      return { data: existing.rows[0].document };
    }
    const progress = await loadProgress(app.db, a.user_id);
    if (
      !(m.missionVersion === 1
        ? legacyUnlocked(m, legacySummary(progress))
        : unlocked(m, summarizeProgress(progress)))
    )
      fail(403, "Pulau masih terkunci");
    const config = (
      await app.db.query("SELECT value FROM settings WHERE name='scoring'")
    ).rows[0]?.value || { baselineMultiplier: 1 };
    const s = newSession(m, a.user_id, config);
    s.id = b.id;
    s.source = b.source === "offline" ? "offline" : "online";
    await app.db.query(
      "INSERT INTO mission_sessions(id,participant_id,mission_id,document) VALUES($1,$2,$3,$4)",
      [s.id, a.user_id, m.id, JSON.stringify(s)],
    );
    reply.code(201);
    return { data: s };
  });
  app.post("/api/sessions/:id/events", async (req) => {
    const a = app.requireRole(req, "participant");
    const events = req.body?.events;
    if (!Array.isArray(events) || events.length > 200)
      fail(400, "Batch event tidak valid");
    const client = await app.db.connect();
    try {
      await client.query("BEGIN");
      const { rows } = await client.query(
        "SELECT document,participant_id FROM mission_sessions WHERE id=$1 FOR UPDATE",
        [req.params.id],
      );
      if (!rows[0]) fail(404, "Sesi tidak ditemukan");
      if (rows[0].participant_id !== a.user_id)
        fail(403, "Sesi bukan milik Anda");
      let s = rows[0].document;
      const m = getMission(s.missionId);
      let changed = false;
      for (const e of events) {
        try {
          validateEvent(e);
        } catch {
          fail(400, "Event tidak valid");
        }
        if (e.sessionId !== s.id) fail(400, "ID sesi tidak cocok");
        const duplicate = s.events.find((x) => x.id === e.id);
        if (duplicate) {
          if (canonicalJson(duplicate) !== canonicalJson(e))
            fail(409, "Isi event duplikat berbeda");
          continue;
        }
        if (s.status !== "active") fail(409, "Sesi sudah dikirim atau selesai");
        if (
          e.seq !== s.events.length + 1 ||
          e.activeMs < s.activeMs ||
          e.activeMs > 86400000
        )
          fail(409, "Urutan/waktu event tidak valid");
        s = reduceSession(s, e, m);
        changed = true;
      }
      if (changed)
        await client.query(
          "UPDATE mission_sessions SET document=$1,updated_at=$2 WHERE id=$3",
          [JSON.stringify(s), new Date(), s.id],
        );
      await client.query("COMMIT");
      return { data: { session: s, accepted: events.map((e) => e.id) } };
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  });
}
