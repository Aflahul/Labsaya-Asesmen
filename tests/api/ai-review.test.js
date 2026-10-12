import { test, expect } from "vitest";
import { setup, loginSeededParticipant } from "./helpers.js";
import { MISSIONS, BOSS } from "../../src/shared/missions.js";
import { newSession } from "../../src/shared/assessment.js";
import { passwordHash } from "../../src/server/auth.js";
import { gradeWithGemini, validateAiGrade } from "../../src/server/ai-grader.js";

const mission = MISSIONS.find((m) => m.bloom === "C5");
const profile = { realName: "Dewi", alias: "DewiAI", className: "X", attendance: 1 };

async function pending(app) {
  const login = await loginSeededParticipant(app, profile);
  const id = login.json().data.user.id;
  const session = newSession(mission, id);
  session.status = "pending_review";
  session.state.answers = { choice: "B", evidence: "A salah untuk 3 data; B memakai len(nilai)", reason: "B aman untuk daftar kosong" };
  await app.db.query("INSERT INTO mission_sessions(id,participant_id,mission_id,document) VALUES($1,$2,$3,$4)", [session.id, id, mission.id, JSON.stringify(session)]);
  return { session, headers: { cookie: login.headers["set-cookie"].split(";")[0], "x-csrf-token": login.json().data.csrf } };
}

test("AI grades submitted work with validated rubric and Nara feedback; repeated requests are idempotent", async () => {
  let calls = 0;
  const app = await setup({ aiGrader: async () => {
    calls++;
    return { marks: { decision: 30, evidence: 30, reason: 25 }, feedback: "Kamu sudah memilih rancangan yang kuat. Lengkapi satu pengujian agar alasanmu makin jelas.", reasons: { decision: "Pilihan sesuai", evidence: "Satu kasus kurang", reason: "Alasan baik" }, model: "gemini-test" };
  } });
  const { session, headers } = await pending(app);
  const first = await app.inject({ method: "POST", url: `/api/sessions/${session.id}/grade`, headers });
  expect(first.statusCode).toBe(200);
  expect(first.json().data).toMatchObject({ status: "complete", firstAccuracy: 85, review: { source: "ai", marks: { decision: 30, evidence: 30, reason: 25 } } });
  expect(first.json().data.feedback).toContain("Kamu sudah memilih");
  const second = await app.inject({ method: "POST", url: `/api/sessions/${session.id}/grade`, headers });
  expect(second.json().data.status).toBe("complete");
  expect(calls).toBe(1);
  await app.close();
});

test("submission itself runs AI grading after the answer is stored", async () => {
  const app = await setup({ aiGrader: async () => ({ marks: { decision: 30, evidence: 40, reason: 30 }, feedback: "Kamu membandingkan semua kasus dengan baik. Pertahankan alasan yang jelas ini.", reasons: { decision: "Sesuai", evidence: "Lengkap", reason: "Jelas" }, model: "gemini-test" }) });
  const login = await loginSeededParticipant(app, profile);
  const headers = { cookie: login.headers["set-cookie"].split(";")[0], "x-csrf-token": login.json().data.csrf };
  const session = newSession(mission, login.json().data.user.id);
  const id = session.id;
  await app.db.query("INSERT INTO mission_sessions(id,participant_id,mission_id,document) VALUES($1,$2,$3,$4)", [id, session.participantId, mission.id, JSON.stringify(session)]);
  const answers = { choice: "B", evidence: "A benar hanya pada lima data; B menghitung jumlah data.", reason: "B juga menangani daftar kosong." };
  const events = Object.entries(answers).map(([key, value], index) => ({ id: crypto.randomUUID(), sessionId: id, seq: index + 1, type: "action", payload: { op: "answer", key, value }, activeMs: 0 }));
  events.push({ id: crypto.randomUUID(), sessionId: id, seq: 4, type: "submit", payload: {}, activeMs: 0 });
  const response = await app.inject({ method: "POST", url: `/api/sessions/${id}/events`, headers, payload: { events } });
  expect(response.statusCode).toBe(200);
  expect(response.json().data.session).toMatchObject({ status: "complete", firstAccuracy: 100, review: { source: "ai" } });
  await app.close();
});

test("Gemini request sends only task evidence and rejects invalid rubric output", async () => {
  let request;
  const result = await gradeWithGemini(mission, { choice: "B", evidence: "Tiga pengujian", reason: "Fleksibel" }, {
    apiKey: "test-key",
    fetchImpl: async (url, options) => {
      request = { url, options };
      return { ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify({ marks: { decision: 30, evidence: 40, reason: 30 }, reasons: { decision: "Sesuai", evidence: "Lengkap", reason: "Jelas" }, feedback: "Kamu teliti. Pertahankan alasanmu." }) }] } }] }) };
    },
  });
  expect(result.marks.decision).toBe(30);
  expect(request.options.headers["x-goog-api-key"]).toBe("test-key");
  expect(request.options.body).not.toContain("DewiAI");
  expect(() => validateAiGrade(mission, { ...result, marks: { ...result.marks, decision: 300 } })).toThrow();
});

test("boss grading sends the displayed case and a server-only, non-exclusive solution guide", async () => {
  let prompt;
  await gradeWithGemini(BOSS, { solution: "Periksa setiap syarat satu per satu." }, {
    apiKey: "test-key",
    fetchImpl: async (_url, options) => {
      prompt = JSON.parse(options.body).contents[0].parts[0].text;
      return { ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify({
        marks: { design: 0, solution: 0, tests: 0, reason: 0 },
        reasons: { design: "Belum ada data", solution: "Belum lengkap", tests: "Belum ada bukti", reason: "Belum dijelaskan" },
        feedback: "Kamu mulai menyusun langkah. Lengkapi aturan dan pengujianmu.",
      }) }] } }] }) };
    },
  });
  const task = JSON.parse(prompt.split("\n\n").at(-1));
  expect(task.mission.caseRules).toEqual(BOSS.caseRules);
  expect(task.mission.testCases).toEqual(BOSS.testCases);
  expect(task.mission.teacherGuide).toContain("OUTPUT kebutuhan");
  expect(task.mission.teacherGuide).toContain("A: kebutuhan 12");
  expect(task.mission.teacherGuide).toContain("bukan satu-satunya jawaban benar");
  expect(task.mission.teacherGuide).toContain("semua alasan atau satu alasan utama");
  expect(task.mission.teacherGuide).toContain("15 + 10 + 10");
  expect(JSON.stringify(BOSS)).not.toContain("OUTPUT kebutuhan");
});

test("AI failure leaves written work pending for teacher review", async () => {
  const app = await setup({ aiGrader: async () => { throw Error("provider unavailable"); } });
  const { session, headers } = await pending(app);
  const response = await app.inject({ method: "POST", url: `/api/sessions/${session.id}/grade`, headers });
  expect(response.statusCode).toBe(200);
  expect(response.json().data).toMatchObject({ status: "pending_review", aiGrade: { status: "unavailable" } });
  expect(JSON.stringify(response.json())).not.toContain("provider unavailable");
  await app.close();
});

test("teacher can correct an AI grade and the previous decision remains auditable", async () => {
  const app = await setup({ aiGrader: async () => ({ marks: { decision: 30, evidence: 30, reason: 25 }, feedback: "Teruskan analisismu.", reasons: { decision: "Sesuai", evidence: "Sebagian", reason: "Cukup" }, model: "gemini-test" }) });
  const { session, headers } = await pending(app);
  await app.inject({ method: "POST", url: `/api/sessions/${session.id}/grade`, headers });
  await app.db.query("INSERT INTO teachers(id,username,password_hash) VALUES($1,$2,$3)", ["t", "guru", passwordHash("test-password")]);
  const login = await app.inject({ method: "POST", url: "/api/teacher/login", payload: { username: "guru", password: "test-password" } });
  const teacherHeaders = { cookie: login.headers["set-cookie"].split(";")[0], "x-csrf-token": login.json().data.csrf };
  const response = await app.inject({ method: "POST", url: `/api/teacher/sessions/${session.id}/review`, headers: teacherHeaders, payload: { marks: { decision: 30, evidence: 40, reason: 30 }, comment: "Semua kriteria terbukti." } });
  expect(response.statusCode).toBe(200);
  expect(response.json().data).toMatchObject({ firstAccuracy: 100, review: { source: "teacher", teacherId: "t" } });
  expect(response.json().data.reviewHistory[0].source).toBe("ai");
  await app.close();
});
