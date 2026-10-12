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
const app = await buildApp({ db, aiGrader, authRateLimitMax: 1000 });
await app.listen({ host: "127.0.0.1", port: 3000 });
