import { summarizeProgress } from "../../shared/progress.js";
import { toCsv } from "../../shared/reports.js";
import { loadProgress } from "./progress.js";
import { fail } from "../auth.js";
async function roster(db, query = {}) {
  const { rows } = await db.query(
    "SELECT * FROM participants ORDER BY class_name, attendance",
  );
  const docs = (
    await db.query(
      "SELECT participant_id, document FROM mission_sessions ORDER BY updated_at",
    )
  ).rows;
  const byId = new Map();
  for (const r of docs) {
    if (!byId.has(r.participant_id)) byId.set(r.participant_id, []);
    byId.get(r.participant_id).push(r.document);
  }
  return rows
    .map((p) => {
      const { latestByMission, bestByMission, ...summary } = summarizeProgress({
        sessions: byId.get(p.id) || [],
      });
      return { ...p, summary };
    })
    .filter(
      (p) =>
        (!query.class || p.class_name === query.class) &&
        (!query.query ||
          `${p.real_name} ${p.alias}`
            .toLowerCase()
            .includes(query.query.toLowerCase())) &&
        (query.complete !== "true" || p.summary.score !== null),
    );
}
export async function teacherRoutes(app) {
  app.get("/api/teacher/participants", async (req) => {
    app.requireRole(req, "teacher");
    const rows = await roster(app.db, req.query);
    if (req.query.page) {
      const page = Number(req.query.page);
      if (!Number.isInteger(page) || page < 1) fail(400, "Halaman tidak valid");
      return {
        data: rows.slice((page - 1) * 50, page * 50),
        total: rows.length,
      };
    }
    return { data: rows };
  });
  app.get("/api/teacher/export", async (req, reply) => {
    app.requireRole(req, "teacher");
    const rows = await roster(app.db, req.query);
    reply
      .type("text/csv;charset=utf-8")
      .header("Content-Disposition", 'attachment; filename="rekap-kelas.csv"');
    return toCsv(
      rows.map((p) => ({
        "Nama asli": p.real_name,
        "Nama samaran": p.alias,
        Kelas: p.class_name,
        Absen: p.attendance,
        "Misi inti": p.summary.completed,
        "Nilai inti": p.summary.score ?? "Belum lengkap",
        Ketepatan: p.summary.accuracy ?? "",
      })),
    );
  });
  app.get("/api/teacher/participants/:id/report", async (req) => {
    app.requireRole(req, "teacher");
    const { rows } = await app.db.query(
      "SELECT * FROM participants WHERE id=$1",
      [req.params.id],
    );
    if (!rows[0]) fail(404, "Peserta tidak ditemukan");
    return {
      data: {
        participant: rows[0],
        ...(await loadProgress(app.db, req.params.id)),
      },
    };
  });
  app.put("/api/teacher/scoring-config", async (req) => {
    app.requireRole(req, "teacher");
    const x = req.body?.baselineMultiplier;
    if (!Number.isFinite(x) || x < 0.5 || x > 3)
      fail(400, "Kalibrasi harus 0,5–3");
    await app.db.query(
      "INSERT INTO settings(name,value) VALUES('scoring',$1) ON CONFLICT(name) DO UPDATE SET value=EXCLUDED.value",
      [JSON.stringify({ baselineMultiplier: x })],
    );
    return { data: { baselineMultiplier: x } };
  });
  app.get("/api/leaderboard", async () => {
    const rows = await roster(app.db);
    const entries = rows
      .filter((p) => p.summary.score !== null)
      .map((p) => ({ alias: p.alias, score: p.summary.score }))
      .sort((a, b) => b.score - a.score || a.alias.localeCompare(b.alias));
    let rank = 0,
      prev;
    return {
      data: entries.map((x, i) => {
        if (x.score !== prev) rank = i + 1;
        prev = x.score;
        return { ...x, rank };
      }),
    };
  });
}
