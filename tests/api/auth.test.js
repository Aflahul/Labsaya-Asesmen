import { test, expect } from "vitest";
import { setup } from "./helpers.js";
test("registration normalized alias and private teacher routes", async () => {
  const app = await setup();
  const payload = {
    realName: "Ayu Putri",
    alias: "Awan",
    className: "X RPL 1",
    attendance: 1,
  };
  const r = await app.inject({ method: "POST", url: "/api/register", payload });
  expect(r.statusCode).toBe(201);
  expect(
    (
      await app.inject({
        method: "POST",
        url: "/api/register",
        payload: { ...payload, alias: " AWAN " },
      })
    ).statusCode,
  ).toBe(409);
  expect(
    (
      await app.inject({
        method: "POST",
        url: "/api/login",
        payload: { realName: "Salah", alias: "Awan" },
      })
    ).statusCode,
  ).toBe(401);
  expect(
    (await app.inject({ method: "GET", url: "/api/teacher/participants" }))
      .statusCode,
  ).toBe(401);
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
