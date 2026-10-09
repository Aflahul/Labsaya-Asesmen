import {
  randomBytes,
  createHash,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
export const normalize = (s) =>
  s.normalize("NFC").trim().replace(/\s+/g, " ").toLocaleLowerCase("id");
export const hash = (s) => createHash("sha256").update(s).digest("hex");
export const passwordHash = (password) => {
  const salt = randomBytes(16).toString("hex");
  return salt + ":" + scryptSync(password, salt, 64).toString("hex");
};
export function verifyPassword(password, stored) {
  if (typeof stored !== "string") return false;
  const [salt, key] = stored.split(":");
  const a = scryptSync(password, salt, 64),
    b = Buffer.from(key || "", "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}
export async function issueSession(app, user, role, reply) {
  const token = randomBytes(32).toString("hex"),
    csrf = randomBytes(24).toString("hex");
  await app.db.query(
    "INSERT INTO auth_sessions(token_hash,user_id,role,csrf,expires_at) VALUES($1,$2,$3,$4,$5)",
    [hash(token), user.id, role, csrf, new Date(Date.now() + 7 * 86400000)],
  );
  reply.setCookie("pulau_session", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 7 * 86400,
  });
  return csrf;
}
export function fail(statusCode, message, code = "REQUEST_FAILED") {
  throw Object.assign(new Error(message), { statusCode, code });
}
export function requiredText(value, max = 100) {
  if (typeof value !== "string" || !value.trim() || value.trim().length > max)
    fail(400, "Isian tidak valid");
  return value.normalize("NFC").trim().replace(/\s+/g, " ");
}
