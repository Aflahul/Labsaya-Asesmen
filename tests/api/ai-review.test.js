import { test, expect, vi } from "vitest";
import { setup, loginSeededParticipant } from "./helpers.js";
import { MISSIONS, BOSS } from "../../src/shared/missions.js";
import { newSession } from "../../src/shared/assessment.js";
import { passwordHash } from "../../src/server/auth.js";
import { gradeWithGemini, validateAiGrade, aiFailureDetails } from "../../src/server/ai-grader.js";

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
    return { marks: { decision: 30, evidence: 30, reason: 25 }, feedback: "Kamu sudah memilih rancangan yang kuat. Lengkapi satu pengujian agar alasanmu makin jelas.", reasons: { decision: "Pilihan sesuai", evidence: "Satu kasus kurang", reason: "Alasan baik" }, model: "groq-test", provider: "groq" };
  } });
  const { session, headers } = await pending(app);
  const first = await app.inject({ method: "POST", url: `/api/sessions/${session.id}/grade`, headers });
  expect(first.statusCode).toBe(200);
  expect(first.json().data).toMatchObject({ status: "complete", firstAccuracy: 85, review: { source: "ai", provider: "groq", model: "groq-test", marks: { decision: 30, evidence: 30, reason: 25 } } });
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
  const prompt = JSON.parse(request.options.body).contents[0].parts[0].text;
  expect(prompt).toContain("guru bijak");
  expect(prompt).toContain("growth mindset");
  expect(prompt).toContain("maksimal 180 karakter");
  expect(request.options.headers["x-goog-api-key"]).toBe("test-key");
  expect(request.options.body).not.toContain("DewiAI");
  expect(() => validateAiGrade(mission, { ...result, marks: { ...result.marks, decision: 300 } })).toThrow();
});

test("long AI feedback keeps a complete sentence within 400 characters without discarding marks", () => {
  const firstSentence = "Kamu sudah menuliskan empat pengujian.";
  const result = validateAiGrade(mission, {
    marks: { decision: 0, evidence: 10, reason: 0 },
    reasons: { decision: "Pilihan salah", evidence: "Pengujian ditulis", reason: "Aturan terbalik" },
    feedback: firstSentence + " " + "Coba periksa kembali aturan keberangkatan ".repeat(10) + ".",
  });
  expect(result.feedback).toBe(firstSentence);
  expect(result.marks.evidence).toBe(10);
  const withoutSentence = validateAiGrade(mission, { ...result, feedback: "Periksa kembali ".repeat(30) });
  expect(Array.from(withoutSentence.feedback).length).toBeLessThanOrEqual(400);
  expect(withoutSentence.feedback).toMatch(/…$/);
});

test("grading tolerates a minute of provider latency but still aborts a stalled request", async () => {
  vi.useFakeTimers();
  const timeout = vi.spyOn(AbortSignal, "timeout").mockImplementation(ms => {
    const controller = new AbortController();
    setTimeout(() => controller.abort(new DOMException("Deadline exceeded", "TimeoutError")), ms);
    return controller.signal;
  });
  let aborted = false;
  try {
    const grading = gradeWithGemini(BOSS, {}, { apiKey: "test-key", fetchImpl: (_url, { signal }) => new Promise((_resolve, reject) => {
      signal.addEventListener("abort", () => { aborted = true; reject(signal.reason); }, { once: true });
    }) });
    const rejection = expect(grading).rejects.toMatchObject({ name: "TimeoutError" });
    await vi.advanceTimersByTimeAsync(60000);
    const abortedAfterMinute = aborted;
    await vi.advanceTimersByTimeAsync(60000);
    await rejection;
    expect(abortedAfterMinute).toBe(false);
    expect(aborted).toBe(true);
  } finally { timeout.mockRestore(); vi.useRealTimers(); }
});

test("a temporary Google 503 is retried once and the successful rubric is validated", async () => {
  vi.useFakeTimers();
  let calls = 0;
  const signals = [];
  try {
    const grading = gradeWithGemini(BOSS, {}, { apiKey: "test-key", fetchImpl: async (_url, options) => {
      signals.push(options.signal);
      calls++;
      if (calls === 1) return { ok: false, status: 503, json: async () => ({ error: {} }) };
      return { ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify({
        marks: { design: 0, solution: 0, tests: 0, reason: 0 },
        reasons: { design: "Data salah", solution: "Aturan salah", tests: "Hasil salah", reason: "Alasan salah" },
        feedback: "Kamu sudah menulis pengujian. Coba periksa kembali syarat keberangkatan.",
      }) }] } }] }) };
    } }).then(value => ({ value }), error => ({ error }));
    await vi.advanceTimersByTimeAsync(1000);
    const { value: result, error } = await grading;
    expect(error).toBeUndefined();
    expect(result.marks).toEqual({ design: 0, solution: 0, tests: 0, reason: 0 });
    expect(calls).toBe(2);
    expect(signals[1]).toBe(signals[0]);
  } finally { vi.useRealTimers(); }
});

test.each([[503, 2], [429, 1], [403, 1]])("Google %s never causes unbounded or inappropriate retries", async (status, expectedCalls) => {
  vi.useFakeTimers();
  let calls = 0;
  try {
    const grading = gradeWithGemini(BOSS, {}, { apiKey: "test-key", fetchImpl: async () => {
      calls++;
      return { ok: false, status, json: async () => ({ error: {} }) };
    } }).catch(error => error);
    await vi.advanceTimersByTimeAsync(1000);
    expect(aiFailureDetails(await grading)).toEqual({ code: `GOOGLE_HTTP_${status}` });
    expect(calls).toBe(expectedCalls);
  } finally { vi.useRealTimers(); }
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

test("Gemini defaults to the current Flash alias when no model override is configured", async () => {
  vi.stubEnv("GOOGLE_AI_MODEL", "");
  try {
    await gradeWithGemini(mission, {}, { apiKey: "test-key", fetchImpl: async (url) => {
      expect(url).toBe("https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent");
      return { ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify({
        marks: { decision: 0, evidence: 0, reason: 0 },
        reasons: { decision: "Belum ada pilihan", evidence: "Belum ada bukti", reason: "Belum ada alasan" },
        feedback: "Lengkapi jawabanmu dengan bukti dan alasan.",
      }) }] } }] }) };
    } });
  } finally { vi.unstubAllEnvs(); }
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

test("Google failure diagnostics preserve only an allowlisted reason and HTTP status", async () => {
  let error;
  try {
    await gradeWithGemini(mission, {}, {
      apiKey: "private-test-key",
      fetchImpl: async () => ({ ok: false, status: 400, json: async () => ({ error: {
        message: "private-test-key and student answer must not be logged",
        details: [{ reason: "API_KEY_INVALID" }],
      } }) }),
    });
  } catch (caught) { error = caught; }
  expect(aiFailureDetails(error)).toEqual({ code: "GOOGLE_HTTP_400", reason: "API_KEY_INVALID" });
  expect(JSON.stringify(error)).not.toContain("private-test-key");
  expect(aiFailureDetails(Object.assign(Error("private-test-key"), { providerReason: "private-test-key" }))).toEqual({ code: "AI_ERROR" });
  expect(aiFailureDetails(Error("Kunci Google AI belum dikonfigurasi"))).toEqual({ code: "KEY_MISSING" });
  expect(aiFailureDetails(new DOMException("secret details", "TimeoutError"))).toEqual({ code: "TIMEOUT" });
});

test.each([
  ["standard-test-key", "", "standard-test-key"],
  ["standard-test-key", "legacy-test-key", "standard-test-key"],
  ["", "legacy-test-key", "legacy-test-key"],
])("Gemini reads GOOGLE_API_KEY first and supports the legacy binding (%s)", async (standard, legacy, expected) => {
  vi.stubEnv("GOOGLE_API_KEY", standard);
  vi.stubEnv("GOOGLE_AI_API_KEY", legacy);
  let sentKey;
  try {
    await gradeWithGemini(mission, {}, { fetchImpl: async (_url, options) => {
      sentKey = options.headers["x-goog-api-key"];
      return { ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify({
        marks: { decision: 0, evidence: 0, reason: 0 },
        reasons: { decision: "Belum ada pilihan", evidence: "Belum ada bukti", reason: "Belum ada alasan" },
        feedback: "Lengkapi jawabanmu dengan bukti dan alasan.",
      }) }] } }] }) };
    } });
    expect(sentKey).toBe(expected);
  } finally { vi.unstubAllEnvs(); }
});

test("grading failures log safe diagnostics without returning provider details to students", async () => {
  const log = vi.spyOn(console, "error").mockImplementation(() => {});
  const app = await setup({ aiGrader: async () => { throw Error("Google AI gagal (429)"); } });
  try {
    const { session, headers } = await pending(app);
    const response = await app.inject({ method: "POST", url: `/api/sessions/${session.id}/grade`, headers });
    expect(log).toHaveBeenCalledWith("[AI_GRADING_FAILURE]", { missionId: mission.id, code: "GOOGLE_HTTP_429" });
    expect(response.json().data.aiGrade.status).toBe("unavailable");
    expect(response.body).not.toContain("GOOGLE_HTTP_429");
    expect(response.json().data.state.answers).toEqual(session.state.answers);
  } finally { await app.close(); log.mockRestore(); }
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
test('Nara preserves a needed explanation of 350 characters for archived pending work too',()=>{
 const feedback='Mulai dari contoh kecil. '.padEnd(350,'a');
 const r=validateAiGrade(mission,{marks:{decision:0,evidence:0,reason:0},reasons:{decision:'Belum ada bukti',evidence:'Belum ada bukti',reason:'Belum ada bukti'},feedback});
 expect(r.feedback).toBe(feedback);
});
