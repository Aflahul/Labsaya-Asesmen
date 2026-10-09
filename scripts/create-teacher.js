import readline from "node:readline/promises";
import { randomUUID } from "node:crypto";
import { getPool } from "../src/server/db.js";
import { passwordHash, normalize } from "../src/server/auth.js";
try {
  process.loadEnvFile();
} catch {}
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
const username = (await rl.question("Username guru: ")).trim();
rl.close();
if (!process.stdin.isTTY)
  throw Error("Gunakan terminal interaktif untuk password tersembunyi");
process.stdout.write("Password guru (minimal 10 karakter): ");
process.stdin.setRawMode(true);
process.stdin.resume();
let password = "";
await new Promise((resolve) => {
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", function read(chunk) {
    for (const c of chunk) {
      if (c === "\u0003") process.exit(1);
      if (c === "\r" || c === "\n") {
        process.stdin.off("data", read);
        resolve();
        return;
      }
      if (c === "\u007f") password = password.slice(0, -1);
      else password += c;
    }
  });
});
process.stdin.setRawMode(false);
process.stdin.pause();
process.stdout.write("\n");
if (!username || password.length < 10)
  throw Error("Username/password tidak memenuhi ketentuan");
const db = getPool();
try {
  await db.query(
    "INSERT INTO teachers(id,username,password_hash) VALUES($1,$2,$3)",
    [randomUUID(), normalize(username), passwordHash(password)],
  );
  console.log("Akun guru dibuat.");
} catch {
  console.error("Gagal membuat akun. Periksa koneksi atau username duplikat.");
  process.exitCode = 1;
} finally {
  await db.end();
}
