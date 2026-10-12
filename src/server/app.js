import Fastify from "fastify";
import cookie from "@fastify/cookie";
import rateLimit from "@fastify/rate-limit";
import { getPool } from "./db.js";
import { hash, fail } from "./auth.js";
import { authRoutes } from "./routes/auth.js";
import { progressRoutes } from "./routes/progress.js";
import { teacherRoutes } from "./routes/teacher.js";
export async function buildApp({ db } = {}) {
  const app = Fastify({ logger: false, bodyLimit: 1024 * 1024 });
  app.decorate("db", db || getPool());
  await app.register(cookie);
  await app.register(rateLimit, { global: false });
  app.addHook("onRequest", async (req, reply) => {
    reply.header("Cache-Control", "no-store");
    reply.header("X-Content-Type-Options", "nosniff");
    if (!req.url.startsWith("/api/")) return;
    if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
      const origin = req.headers.origin;
      if (origin) {
        let host;
        try {
          host = new URL(origin).host;
        } catch {
          fail(403, "Origin tidak valid");
        }
        if (host !== req.headers.host) fail(403, "Origin tidak diizinkan");
      }
    }
    const token = req.cookies.pulau_session;
    if (token) {
      const { rows } = await app.db.query(
        `SELECT a.* FROM auth_sessions a
         LEFT JOIN participants p ON p.id=a.user_id AND a.role='participant'
         WHERE a.token_hash=$1 AND a.expires_at > $2
           AND (a.role<>'participant' OR p.password_hash IS NOT NULL)`,
        [hash(token), new Date()],
      );
      req.auth = rows[0];
    }
    if (
      req.auth &&
      !["GET", "HEAD"].includes(req.method) &&
      !["/api/login", "/api/register", "/api/teacher/login"].includes(
        req.url,
      ) &&
      req.headers["x-csrf-token"] !== req.auth.csrf
    )
      fail(403, "Sesi perlu diperbarui", "CSRF");
  });
  app.decorate("requireRole", (req, role) => {
    if (!req.auth) fail(401, "Silakan masuk terlebih dahulu");
    if (req.auth.role !== role) fail(403, "Akses tidak diizinkan");
    return req.auth;
  });
  app.setErrorHandler((e, req, reply) =>
    reply.code(e.statusCode || 500).send({
      error: {
        code: e.code || "INTERNAL",
        message:
          e.statusCode && e.statusCode < 500
            ? e.message
            : "Layanan belum tersedia. Periksa konfigurasi server.",
      },
    }),
  );
  app.setNotFoundHandler((req, reply) =>
    reply
      .code(404)
      .send({ error: { code: "NOT_FOUND", message: "Tidak ditemukan" } }),
  );
  await authRoutes(app);
  await progressRoutes(app);
  await teacherRoutes(app);
  return app;
}
