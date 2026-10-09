import fs from "node:fs/promises";
import { getPool } from "../src/server/db.js";
try {
  process.loadEnvFile();
} catch {}
const db = getPool();
try {
  await db.query(
    "CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, applied_at timestamptz DEFAULT now())",
  );
  for (const name of (await fs.readdir("migrations"))
    .filter((n) => n.endsWith(".sql"))
    .sort()) {
    if (
      (
        await db.query("SELECT name FROM schema_migrations WHERE name=$1", [
          name,
        ])
      ).rows.length
    )
      continue;
    const client = await db.connect();
    try {
      await client.query("BEGIN");
      await client.query(await fs.readFile(`migrations/${name}`, "utf8"));
      await client.query("INSERT INTO schema_migrations(name) VALUES($1)", [
        name,
      ]);
      await client.query("COMMIT");
      console.log("Migrasi diterapkan:", name);
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  }
} catch {
  console.error("Migrasi gagal. Periksa koneksi, izin, dan target database.");
  process.exitCode = 1;
} finally {
  await db.end();
}
