import { gradeWithConsensus } from "../src/server/ai-consensus.js";
import { getIndicatorRubric } from "../src/shared/indicator-rubrics.js";
import { newDb } from "pg-mem";
import fs from "node:fs";
import { buildApp } from "../src/server/app.js";
import { passwordHash } from "../src/server/auth.js";
const memory = newDb();
for (const p of [
  "001_accounts.sql",
  "002_assessment.sql",
  "003_participant_passwords.sql",
  "004_recovery_code.sql",
])
  memory.public.none(fs.readFileSync(`migrations/${p}`, "utf8"));
const { Pool } = memory.adapters.createPg(),
  db = new Pool();
await db.query(
  "INSERT INTO teachers(id,username,password_hash) VALUES($1,$2,$3)",
  ["teacher-test", "guru", passwordHash("test-password-only")],
);
const aiGrader = process.env.TEST_AI_GRADER === "1"
  ? async (mission) => ({
      marks: Object.fromEntries(mission.rubric.map(([key, , max]) => [key, max])),
      reasons: Object.fromEntries(mission.rubric.map(([key]) => [key, "Bukti sesuai rubrik."])),
      feedback: "Kamu sudah menunjukkan bukti yang jelas. Pertahankan cara menjelaskan alasan dan pengujianmu.",
      model: "gemini-mock",
    })
  : undefined;
const indicatorGrader=async(m,e,options)=>gradeWithConsensus(m,e,{...options,providerGrader:async provider=>{
 if(process.env.TEST_INDICATOR_GRADER !== '1' && process.env.TEST_AI_GRADER !== '1')throw Error('TEST_PROVIDER_UNAVAILABLE');
 return {model:provider+'-mock',indicators:getIndicatorRubric(m.id).indicators.map(i=>{
  const key=e.check?'response':i.fields[0];
  return {id:i.id,level:e.check?4:3,evidenceStatus:'present',references:[{key,quote:e.answers[key]||''}],reason:'Bukti jawaban diperiksa pada fixture pengujian.'};
 }),feedback:'Kamu sudah menuliskan jawaban untuk kasus ini. Coba satu kasus baru agar kita bisa memeriksa apakah langkah yang sama tetap sesuai. Mulai dari data yang dibutuhkan, lanjutkan dengan aturan yang harus dipenuhi, lalu jelaskan keputusanmu. Kamu boleh memakai kalimat sendiri. Jika belum yakin, pilih satu bagian dahulu dan perbaiki setelah membandingkan hasilnya.'};
}});
const app = await buildApp({ db, aiGrader, indicatorGrader, authRateLimitMax: 1000 });
await app.listen({ host: "127.0.0.1", port: 3000 });
