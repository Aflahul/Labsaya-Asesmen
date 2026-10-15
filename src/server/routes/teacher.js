import {buildKnowledgeReport} from '../../shared/knowledge-report.js';
import {gradeEnrichmentSession,enrichmentCandidates} from '../enrichment-reward.js';
import {enrichmentXp,leaderboardStats,rankLeaderboard} from '../../shared/leaderboard.js';
import { getIndicatorRubric } from "../../shared/indicator-rubrics.js";
import { buildAssessmentEvidence,limitNaraFeedback } from "../../shared/indicator-assessment.js";
import { randomUUID, randomBytes } from "node:crypto";
import { normalize, passwordHash, requiredText } from "../auth.js";
import { upgradeScoring } from "../../shared/assessment.js";
import { CORE_MISSIONS, getMission } from "../../shared/missions.js";
import { gradeReview } from "../../shared/v2-evaluator.js";
import { summarizeProgress } from "../../shared/progress.js";
import { buildReport, toCsv, buildIndicatorClassReport, indicatorExportRows } from "../../shared/reports.js";
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
  const indicatorThreshold=(await db.query("SELECT value FROM settings WHERE name='indicator-threshold'")).rows[0]?.value || {threshold:3,version:1};
  const byId = new Map();
  for (const r of docs) {
    if (!byId.has(r.participant_id)) byId.set(r.participant_id, []);
    byId.get(r.participant_id).push(r.document);
  }
  return rows
    .map((p) => {
      const sessions = byId.get(p.id) || [];
      const report = includeMissionDetails
        ? buildReport({ sessions, indicatorThreshold })
        : summarizeProgress({ sessions, indicatorThreshold });
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
        ...(query.knowledge?{knowledge:buildKnowledgeReport(sessions)}:{}),
        ...(query.leaderboard?{leaderboard:leaderboardStats(sessions)}:{}),
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
export async function teacherRoutes(app, enrichmentGrader) {
  app.get("/api/teacher/enrichment",async req=>{
    app.requireRole(req,"teacher");return {data:await enrichmentCandidates(app.db)};
  });
  app.post("/api/teacher/enrichment/:id/grade",async req=>{
    app.requireRole(req,"teacher");
    const candidates=await enrichmentCandidates(app.db);
    if(!candidates.some(s=>s.id===req.params.id))fail(404,"Pengayaan tidak ditemukan");
    const session=await gradeEnrichmentSession(app.db,req.params.id,enrichmentGrader);
    return {data:{id:session?.id,status:session?.enrichmentReward?.status||"pending",xp:enrichmentXp(session)}};
  });
  app.get("/api/teacher/indicators", async req=>{
    app.requireRole(req,"teacher");
    const cfg=(await app.db.query("SELECT value FROM settings WHERE name='indicator-threshold'")).rows[0]?.value||{threshold:3,version:1};
    const report=buildIndicatorClassReport(await roster(app.db),{className:req.query.class||'',threshold:cfg.threshold,thresholdVersion:cfg.version});
    return {data:report};
  });
  app.get("/api/teacher/indicators/export",async(req,reply)=>{
    app.requireRole(req,"teacher");
    const cfg=(await app.db.query("SELECT value FROM settings WHERE name='indicator-threshold'")).rows[0]?.value||{threshold:3,version:1};
    const report=buildIndicatorClassReport(await roster(app.db),{className:req.query.class||'',threshold:cfg.threshold,thresholdVersion:cfg.version});
    reply.type('text/csv;charset=utf-8').header('Content-Disposition','attachment; filename="indikator-kelas.csv"');
    return toCsv(indicatorExportRows(report));
  });
  app.put("/api/teacher/indicator-config",async req=>{
    app.requireRole(req,"teacher");
    const threshold=req.body?.threshold;
    if(!Number.isInteger(threshold)||threshold<1||threshold>4)fail(400,'Ambang tingkat harus 1–4');
    const client=await app.db.connect();
    try{
      await client.query('BEGIN');
      const old=(await client.query("SELECT value FROM settings WHERE name='indicator-threshold' FOR UPDATE")).rows[0]?.value||{threshold:3,version:1};
      const value={threshold,version:old.version+1,at:new Date().toISOString()};
      await client.query("INSERT INTO settings(name,value) VALUES('indicator-threshold',$1) ON CONFLICT(name) DO UPDATE SET value=EXCLUDED.value",[JSON.stringify(value)]);
      await client.query('COMMIT');return {data:value};
    }catch(e){await client.query('ROLLBACK');throw e;}finally{client.release();}
  });
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
      if(old.assessmentPolicy==='indicator-v1') {
        if(!old.activityCompletedAt)fail(409,'Jawaban belum dikirim');
        const rubric=getIndicatorRubric(old.missionId),proposals=req.body?.indicators;
        if(!Array.isArray(proposals)||proposals.length!==rubric.indicators.length)fail(400,'Rubrik indikator belum lengkap');
        const indicators=rubric.indicators.map(i=>{
          const rows=proposals.filter(p=>p.id===i.id),p=rows[0];
          if(rows.length!==1|| !(p.level===null||Number.isInteger(p.level)&&p.level>=1&&p.level<=4)||typeof p.reason!=='string'||!p.reason.trim()||p.reason.length>1000)fail(400,'Nilai atau alasan indikator tidak valid');
          const keys=old.masteryCheck?['response']:i.fields;
          return {id:i.id,level:p.level,evidenceStatus:p.level===null?'insufficient':'present',reason:p.reason.trim(),references:keys.filter(k=>old.state.answers[k]).map(key=>({key,quote:Array.from(old.state.answers[key]).slice(0,300).join('')})),status:'teacher'};
        });
        if(typeof req.body.comment!=='string'||!req.body.comment.trim()||req.body.comment.length>3000)fail(400,'Tuliskan umpan balik guru');
        const graded={...old,indicatorHistory:[...(old.indicatorHistory||[]),old.indicatorAssessment],indicatorAssessment:{...old.indicatorAssessment,status:'teacher',source:'teacher',teacherId:teacher.user_id,at:new Date().toISOString(),leaseUntil:0,indicators,feedback:limitNaraFeedback(req.body.comment),evidenceMode:req.body.independent===true?'teacher_observation':buildAssessmentEvidence(getMission(old.missionId),old).mode},feedback:limitNaraFeedback(req.body.comment)};
        await client.query('UPDATE mission_sessions SET document=$1,updated_at=$2 WHERE id=$3',[JSON.stringify(graded),new Date(),old.id]);await client.query('COMMIT');return {data:graded};
      }
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
    const rows = await roster(app.db, {...req.query,knowledge:true});
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
        "XP inti": p.summary.xp,
        "Skor permainan arsip": p.summary.gameScore ?? "",
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
    const rows = await roster(app.db,{leaderboard:true});
    const excludedValue=(await app.db.query("SELECT value FROM settings WHERE name='leaderboard-excluded-participants'")).rows[0]?.value;
    const excluded=new Set(Array.isArray(excludedValue)?excludedValue:[]);
    const entries = rows
      .filter((p) => !excluded.has(p.id)&&p.summary.completed === CORE_MISSIONS.length)
      .map((p) => ({ alias: p.alias, score: p.summary.xp,...p.leaderboard }));
    return {data:rankLeaderboard(entries)};
  });
}
