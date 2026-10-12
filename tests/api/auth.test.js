import { test, expect } from "vitest";
import { setup } from "./helpers.js";
test("only a teacher creates student accounts; student login requires the issued password", async () => {
  const app = await setup();
  const payload = {
    realName: "Ayu Putri",
    alias: "Awan",
    className: "X RPL 1",
    attendance: 1,
  };
  expect(
    (await app.inject({ method: "POST", url: "/api/register", payload }))
      .statusCode,
  ).toBe(403);
  expect(
    (
      await app.inject({
        method: "POST",
        url: "/api/teacher/participants",
        payload,
      })
    ).statusCode,
  ).toBe(401);
  const { passwordHash } = await import("../../src/server/auth.js");
  await app.db.query(
    "INSERT INTO teachers(id,username,password_hash) VALUES($1,$2,$3)",
    ["teacher", "guru", passwordHash("test-password-only")],
  );
  const t = await app.inject({
    method: "POST",
    url: "/api/teacher/login",
    payload: { username: "guru", password: "test-password-only" },
  });
  const headers = {
    cookie: t.headers["set-cookie"].split(";")[0],
    "x-csrf-token": t.json().data.csrf,
  };
  expect(
    (
      await app.inject({
        method: "POST",
        url: "/api/teacher/participants",
        headers: { cookie: headers.cookie },
        payload,
      })
    ).statusCode,
  ).toBe(403);
  const created = await app.inject({
    method: "POST",
    url: "/api/teacher/participants",
    headers,
    payload,
  });
  expect(created.statusCode).toBe(201);
  const { participant, password } = created.json().data;
  expect(password.length).toBeGreaterThanOrEqual(20);
  expect(created.body).not.toContain("password_hash");
  expect(
    (
      await app.inject({
        method: "POST",
        url: "/api/teacher/participants",
        headers,
        payload: { ...payload, alias: " AWAN " },
      })
    ).statusCode,
  ).toBe(409);
  expect(
    (
      await app.inject({
        method: "POST",
        url: "/api/login",
        payload: { alias: "Awan", realName: "Ayu Putri" },
      })
    ).statusCode,
  ).toBe(400);
  expect(
    (
      await app.inject({
        method: "POST",
        url: "/api/login",
        payload: { alias: "Awan", password: "Ayu Putri" },
      })
    ).statusCode,
  ).toBe(401);
  const login = await app.inject({
    method: "POST",
    url: "/api/login",
    payload: { alias: "Awan", password },
  });
  expect(login.statusCode).toBe(200);
  expect(login.json().data.user.id).toBe(participant.id);
  const roster = await app.inject({
    method: "GET",
    url: "/api/teacher/participants",
    headers,
  });
  expect(roster.body).not.toContain(password);
  expect(roster.body).not.toContain("password_hash");
  expect(roster.json().data[0].hasPassword).toBe(true);
  const report = await app.inject({
    method: "GET",
    url: `/api/teacher/participants/${participant.id}/report`,
    headers,
  });
  expect(report.statusCode).toBe(200);
  expect(report.body).not.toContain("password_hash");
  expect(
    (
      await app.inject({
        method: "GET",
        url: "/api/teacher/participants",
        headers: { cookie: login.headers["set-cookie"].split(";")[0] },
      })
    ).statusCode,
  ).toBe(403);
  await app.close();
});
test("teacher resets an existing student password and revokes previous sessions", async () => {
  const app = await setup();
  const { passwordHash, hash } = await import("../../src/server/auth.js");
  await app.db.query(
    "INSERT INTO participants(id,real_name,alias,alias_key,class_name,attendance) VALUES($1,$2,$3,$4,$5,$6)",
    ["old", "Murid Lama", "lama", "lama", "X", 1],
  );
  await app.db.query(
    "INSERT INTO auth_sessions(token_hash,user_id,role,csrf,expires_at) VALUES($1,$2,$3,$4,$5)",
    [
      hash("legacy-cookie"),
      "old",
      "participant",
      "legacy-csrf",
      new Date(Date.now() + 86400000),
    ],
  );
  expect(
    (
      await app.inject({
        method: "GET",
        url: "/api/me",
        headers: { cookie: "pulau_session=legacy-cookie" },
      })
    ).statusCode,
  ).toBe(401);
  await app.db.query(
    "INSERT INTO teachers(id,username,password_hash) VALUES($1,$2,$3)",
    ["teacher", "guru", passwordHash("test-password-only")],
  );
  const t = await app.inject({
    method: "POST",
    url: "/api/teacher/login",
    payload: { username: "guru", password: "test-password-only" },
  });
  const headers = {
    cookie: t.headers["set-cookie"].split(";")[0],
    "x-csrf-token": t.json().data.csrf,
  };
  expect(
    (
      await app.inject({
        method: "POST",
        url: "/api/login",
        payload: { alias: "lama", password: "Murid Lama" },
      })
    ).statusCode,
  ).toBe(401);
  const reset = await app.inject({
    method: "POST",
    url: "/api/teacher/participants/old/reset-password",
    headers,
    payload: {},
  });
  expect(reset.statusCode).toBe(200);
  const firstPassword = reset.json().data.password;
  const student = await app.inject({
    method: "POST",
    url: "/api/login",
    payload: { alias: "lama", password: firstPassword },
  });
  expect(student.statusCode).toBe(200);
  const second = await app.inject({
    method: "POST",
    url: "/api/teacher/participants/old/reset-password",
    headers,
    payload: {},
  });
  expect(second.statusCode).toBe(200);
  expect(second.json().data.password).not.toBe(firstPassword);
  expect(
    (
      await app.inject({
        method: "GET",
        url: "/api/me",
        headers: { cookie: student.headers["set-cookie"].split(";")[0] },
      })
    ).statusCode,
  ).toBe(401);
  expect(
    (
      await app.inject({
        method: "POST",
        url: "/api/login",
        payload: { alias: "lama", password: firstPassword },
      })
    ).statusCode,
  ).toBe(401);
  expect(
    (
      await app.inject({
        method: "POST",
        url: "/api/login",
        payload: { alias: "lama", password: second.json().data.password },
      })
    ).statusCode,
  ).toBe(200);
  await app.close();
});
test("teacher password bytes preserved", async () => {
  const { passwordHash } = await import("../../src/server/auth.js");
  const app = await setup();
  for (const [i, password] of [
    " leading pass",
    "two  spaces",
    "trail pass ",
    "e\u0301 password",
  ].entries()) {
    await app.db.query(
      "INSERT INTO teachers(id,username,password_hash) VALUES($1,$2,$3)",
      ["t" + i, "g" + i, passwordHash(password)],
    );
    const r = await app.inject({
      method: "POST",
      url: "/api/teacher/login",
      payload: { username: "g" + i, password },
    });
    expect(r.statusCode).toBe(200);
  }
  await app.close();
});
