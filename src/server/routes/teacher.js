import { randomUUID, randomBytes } from "node:crypto";
import { normalize, passwordHash, requiredText } from "../auth.js";
import { upgradeScoring } from "../../shared/assessment.js";
import { CORE_MISSIONS, getMission } from "../../shared/missions.js";
import { gradeReview } from "../../shared/v2-evaluator.js";
import { summarizeProgress } from "../../shared/progress.js";
import { buildReport, toCsv } from "../../shared/reports.js";
import { loadProgress } from "./progress.js";
import { fail } from "../auth.js";
const freshPassword = () => randomBytes(18).toString("base64url");
async function roster(db, query = {}, includeMissionDetails = false) {
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
      const sessions = byId.get(p.id) || [];
      const report = includeMissionDetails
        ? buildReport({ sessions })
        : summarizeProgress({ sessions });
      const {
        latestByMission,
        bestByMission,
        rows: missionRows,
        ...summary
      } = report;
      const { password_hash, recovery_code_hash, ...publicParticipant } = p;
      return {
        ...publicParticipant,
        hasPassword: Boolean(password_hash),
        summary,
        ...(includeMissionDetails ? { missionRows } : {}),
      };
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
  app.post("/api/teacher/participants", async (req, reply) => {
    app.requireRole(req, "teacher");
    const b = req.body || {};
    const real = requiredText(b.realName);
    const alias = requiredText(b.alias);
    const cls = requiredText(b.className, 50);
    if (
      !Number.isInteger(b.attendance) ||
      b.attendance < 1 ||
      b.attendance > 999
    )
      fail(400, "Nomor absen harus 1–999");
    const password = freshPassword();
    let rows;
    try {
      ({ rows } = await app.db.query(
        "INSERT INTO participants(id,real_name,alias,alias_key,class_name,attendance,password_hash) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id,real_name,alias,class_name,attendance",
        [
          randomUUID(),
          real,
          alias,
          normalize(alias),
          cls,
          b.attendance,
          passwordHash(password),
        ],
      ));
    } catch (e) {
      if (e.code === "23505") fail(409, "Nama samaran sudah digunakan");
      throw e;
    }
    reply.code(201);
    return { data: { participant: rows[0], password } };
  });
  app.post("/api/teacher/participants/:id/reset-password", async (req) => {
    app.requireRole(req, "teacher");
    const password = freshPassword();
    const client = await app.db.connect();
    try {
      await client.query("BEGIN");
      const { rows } = await client.query(
        "UPDATE participants SET password_hash=$1,recovery_code_hash=NULL WHERE id=$2 RETURNING id,real_name,alias,class_name,attendance",
        [passwordHash(password), req.params.id],
      );
      if (!rows[0]) fail(404, "Murid tidak ditemukan");
      await client.query(
        "DELETE FROM auth_sessions WHERE user_id=$1 AND role='participant'",
        [req.params.id],
      );
      await client.query("COMMIT");
      return { data: { participant: rows[0], password } };
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  });

  app.post("/api/teacher/sessions/:id/review", async (req) => {
    const teacher = app.requireRole(req, "teacher");
    const client = await app.db.connect();
    try {
      await client.query("BEGIN");
      const { rows } = await client.query(
        "SELECT document FROM mission_sessions WHERE id=$1 FOR UPDATE",
        [req.params.id],
      );
      if (!rows[0]) fail(404, "Sesi tidak ditemukan");
      const old = rows[0].document;
      if (
        old.status !== "pending_review" &&
        !(old.status === "complete" && old.review?.source === "ai")
      )
        fail(409, "Karya sudah dinilai atau belum dikirim");
      let graded;
      try {
        graded = gradeReview(
          upgradeScoring(old),
          getMission(old.missionId),
          req.body?.marks,
          req.body?.comment,
          teacher.user_id,
        );
      } catch (e) {
        fail(400, e.message);
      }
      await client.query(
        "UPDATE mission_sessions SET document=$1,updated_at=$2 WHERE id=$3",
        [JSON.stringify(graded), new Date(), old.id],
      );
      await client.query("COMMIT");
      return { data: graded };
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  });
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
    const rows = await roster(app.db, req.query, true);
    reply
      .type("text/csv;charset=utf-8")
      .header("Content-Disposition", 'attachment; filename="rekap-kelas.csv"');
    return toCsv(
      rows.map((p) => ({
        "Nama lengkap": p.real_name,
        "Nama samaran": p.alias,
        Kelas: p.class_name,
        Absen: p.attendance,
        "Misi inti": p.summary.completed,
        "Kebijakan nilai": p.summary.scoringPolicy,
        "Nilai kompetensi akhir": p.summary.score ?? "Belum lengkap",
        "Skor permainan": p.summary.gameScore ?? "Belum lengkap",
        Ketepatan: p.summary.accuracy ?? "",
        ...Object.fromEntries(
          CORE_MISSIONS.flatMap((m, index) => [
            [`Nilai misi: ${m.title}`, p.missionRows[index]?.Nilai ?? ""],
            [`Revisi uji: ${m.title}`, p.missionRows[index]?.RevisiUji ?? ""],
            [`Skor game: ${m.title}`, p.missionRows[index]?.SkorGame ?? ""],
            [`Ketepatan: ${m.title}`, p.missionRows[index]?.K ?? ""],
          ]),
        ),
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
        participant: (({ password_hash, recovery_code_hash, ...participant }) =>
          participant)(rows[0]),
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
