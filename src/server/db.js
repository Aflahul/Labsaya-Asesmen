import pg from "pg";
let pool;
export function getPool() {
  if (!process.env.DATABASE_URL)
    throw Object.assign(new Error("DATABASE_URL belum dikonfigurasi"), {
      statusCode: 503,
    });
  return (pool ??= new pg.Pool({
    // Keep pg's existing certificate and hostname verification explicit.
    connectionString: process.env.DATABASE_URL.replace(
      /([?&]sslmode=)(prefer|require|verify-ca)(?=&|$)/g,
      "$1verify-full",
    ),
    max: 2,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000,
  }));
}
