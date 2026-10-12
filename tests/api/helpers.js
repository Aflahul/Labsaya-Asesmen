import { newDb } from "pg-mem";
import fs from "node:fs";
export async function setup(options = {}) {
  const db = newDb();
  db.public.none(fs.readFileSync("migrations/001_accounts.sql", "utf8"));
  db.public.none(fs.readFileSync("migrations/002_assessment.sql", "utf8"));
  db.public.none(
    fs.readFileSync("migrations/003_participant_passwords.sql", "utf8"),
  );
  const { Pool } = db.adapters.createPg();
  const { buildApp } = await import("../../src/server/app.js");
  return buildApp({ db: new Pool(), ...options });
}

export async function loginSeededParticipant(app, profile) {
  const { randomUUID } = await import("node:crypto");
  const { normalize, passwordHash } = await import("../../src/server/auth.js");
  const password = "student-password-for-test-only";
  await app.db.query(
    "INSERT INTO participants(id,real_name,alias,alias_key,class_name,attendance,password_hash) VALUES($1,$2,$3,$4,$5,$6,$7)",
    [
      randomUUID(),
      profile.realName,
      profile.alias,
      normalize(profile.alias),
      profile.className,
      profile.attendance,
      passwordHash(password),
    ],
  );
  return app.inject({
    method: "POST",
    url: "/api/login",
    payload: { alias: profile.alias, password },
  });
}
