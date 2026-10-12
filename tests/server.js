import { newDb } from "pg-mem";
import fs from "node:fs";
import { buildApp } from "../src/server/app.js";
import { passwordHash } from "../src/server/auth.js";
const memory = newDb();
for (const p of [
  "001_accounts.sql",
  "002_assessment.sql",
  "003_participant_passwords.sql",
])
  memory.public.none(fs.readFileSync(`migrations/${p}`, "utf8"));
const { Pool } = memory.adapters.createPg(),
  db = new Pool();
await db.query(
  "INSERT INTO teachers(id,username,password_hash) VALUES($1,$2,$3)",
  ["teacher-test", "guru", passwordHash("test-password-only")],
);
const app = await buildApp({ db });
await app.listen({ host: "127.0.0.1", port: 3000 });
