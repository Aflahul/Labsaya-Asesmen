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
