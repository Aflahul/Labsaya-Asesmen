import pg from "pg";
let pool;
export function getPool() {
  if (!process.env.DATABASE_URL)
    throw Object.assign(new Error("DATABASE_URL belum dikonfigurasi"), {
      statusCode: 503,
    });
  return (pool ??= new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    max: 2,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000,
  }));
}
