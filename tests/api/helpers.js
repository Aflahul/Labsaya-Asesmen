import { newDb } from "pg-mem";
import fs from "node:fs";
export async function setup() {
  const db = newDb();
  db.public.none(fs.readFileSync("migrations/001_accounts.sql", "utf8"));
  db.public.none(fs.readFileSync("migrations/002_assessment.sql", "utf8"));
  const { Pool } = db.adapters.createPg();
  const { buildApp } = await import("../../src/server/app.js");
  return buildApp({ db: new Pool() });
}
