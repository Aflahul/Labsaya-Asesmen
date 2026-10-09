import { randomUUID } from "node:crypto";
import {
  normalize,
  requiredText,
  verifyPassword,
  passwordHash,
  issueSession,
  hash,
  fail,
} from "../auth.js";
const pub = (r) => ({
  id: r.id,
  realName: r.real_name,
  alias: r.alias,
  className: r.class_name,
  attendance: r.attendance,
});
export async function authRoutes(app) {
  const limited = {
    config: { rateLimit: { max: 10, timeWindow: "1 minute" } },
  };
  app.post("/api/register", limited, async (req, reply) => {
    const b = req.body || {},
      real = requiredText(b.realName),
      alias = requiredText(b.alias),
      cls = requiredText(b.className, 50);
    if (
      !Number.isInteger(b.attendance) ||
      b.attendance < 1 ||
      b.attendance > 999
    )
      fail(400, "Nomor absen harus 1–999");
    let rows;
    try {
      ({ rows } = await app.db.query(
        "INSERT INTO participants(id,real_name,alias,alias_key,class_name,attendance) VALUES($1,$2,$3,$4,$5,$6) RETURNING *",
        [randomUUID(), real, alias, normalize(alias), cls, b.attendance],
      ));
    } catch (e) {
      if (e.code === "23505") fail(409, "Nama samaran sudah digunakan");
      throw e;
    }
    const csrf = await issueSession(app, rows[0], "participant", reply);
    reply.code(201);
    return { data: { user: pub(rows[0]), role: "participant", csrf } };
  });
  app.post("/api/login", limited, async (req, reply) => {
    const b = req.body || {},
      alias = requiredText(b.alias),
      real = requiredText(b.realName);
    const { rows } = await app.db.query(
      "SELECT * FROM participants WHERE alias_key=$1",
      [normalize(alias)],
    );
    if (!rows[0] || normalize(rows[0].real_name) !== normalize(real))
      fail(401, "Nama asli atau nama samaran tidak cocok");
    const csrf = await issueSession(app, rows[0], "participant", reply);
    return { data: { user: pub(rows[0]), role: "participant", csrf } };
  });
  app.post("/api/teacher/login", limited, async (req, reply) => {
    const b = req.body || {},
      username = requiredText(b.username),
      password = b.password;
    if (
      typeof password !== "string" ||
      !password.length ||
      password.length > 200
    )
      fail(400, "Kata sandi tidak valid");
    const { rows } = await app.db.query(
      "SELECT * FROM teachers WHERE username=$1",
      [normalize(username)],
    );
    const fallback = passwordHash("invalid-login-timing");
    if (
      !verifyPassword(password, rows[0]?.password_hash || fallback) ||
      !rows[0]
    )
      fail(401, "Username atau kata sandi tidak cocok");
    const csrf = await issueSession(app, rows[0], "teacher", reply);
    return {
      data: {
        user: { id: rows[0].id, username: rows[0].username },
        role: "teacher",
        csrf,
      },
    };
  });
  app.get("/api/me", async (req) => {
    if (!req.auth) fail(401, "Silakan masuk");
    const teacher = req.auth.role === "teacher";
    const { rows } = await app.db.query(
      `SELECT * FROM ${teacher ? "teachers" : "participants"} WHERE id=$1`,
      [req.auth.user_id],
    );
    if (!rows[0]) fail(401, "Akun tidak ditemukan");
    return {
      data: {
        role: req.auth.role,
        csrf: req.auth.csrf,
        user: teacher
          ? { id: rows[0].id, username: rows[0].username }
          : pub(rows[0]),
      },
    };
  });
  app.post("/api/logout", async (req, reply) => {
    if (req.cookies.pulau_session)
      await app.db.query("DELETE FROM auth_sessions WHERE token_hash=$1", [
        hash(req.cookies.pulau_session),
      ]);
    reply.clearCookie("pulau_session", { path: "/" });
    return { data: { ok: true } };
  });
}
