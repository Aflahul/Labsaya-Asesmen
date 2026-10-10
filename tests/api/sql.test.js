import { test, expect } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import fs from "node:fs/promises";
import { buildApp } from "../../src/server/app.js";
import { MISSIONS } from "../../src/shared/missions.js";
import { solution } from "../fixtures/solutions.js";
test("real PostgreSQL SQL validates transaction rollback and JSON evidence", async () => {
  const sql = new PGlite();
  for (const file of ["001_accounts.sql", "002_assessment.sql"])
    await sql.exec(await fs.readFile("migrations/" + file, "utf8"));
  const db = {
    query: (q, p) => sql.query(q, p),
    connect: async () => ({ query: (q, p) => sql.query(q, p), release() {} }),
  };
  const app = await buildApp({ db });
  const reg = await app.inject({
    method: "POST",
    url: "/api/register",
    payload: {
      realName: "Postgres Uji",
      alias: "SQL",
      className: "X",
      attendance: 1,
    },
  });
  expect(reg.statusCode).toBe(201);
  const headers = {
      cookie: reg.headers["set-cookie"].split(";")[0],
      "x-csrf-token": reg.json().data.csrf,
    },
    id = crypto.randomUUID();
  expect(
    (
      await app.inject({
        method: "POST",
        url: "/api/sessions",
        headers,
        payload: { id, missionId: "v2p01m01" },
      })
    ).statusCode,
  ).toBe(201);
  const ev = (payload, seq, type = "action") => ({
    id: crypto.randomUUID(),
    sessionId: id,
    seq,
    type,
    payload,
    activeMs: 1000,
  });
  const bad = await app.inject({
    method: "POST",
    url: `/api/sessions/${id}/events`,
    headers,
    payload: { events: [ev(solution(MISSIONS[0])[0], 1), ev({}, 3, "submit")] },
  });
  expect(bad.statusCode).toBe(409);
  const p = (
    await app.inject({ method: "GET", url: "/api/progress", headers })
  ).json().data;
  expect(p.sessions[0].events).toHaveLength(0);
  const events = [
    ...solution(MISSIONS[0]).map((a, i) => ev(a, i + 1)),
    ev({}, 5, "submit"),
  ];
  const done = await app.inject({
    method: "POST",
    url: `/api/sessions/${id}/events`,
    headers,
    payload: { events },
  });
  expect(done.statusCode).toBe(200);
  expect(done.json().data.session.score).toBe(100);
  const retry = await app.inject({
    method: "POST",
    url: `/api/sessions/${id}/events`,
    headers,
    payload: { events },
  });
  expect(retry.statusCode).toBe(200);
  const reordered = events.map((e) => ({
    payload: e.payload,
    activeMs: e.activeMs,
    type: e.type,
    seq: e.seq,
    sessionId: e.sessionId,
    id: e.id,
  }));
  expect(
    (
      await app.inject({
        method: "POST",
        url: `/api/sessions/${id}/events`,
        headers,
        payload: { events: reordered },
      })
    ).statusCode,
  ).toBe(200);
  const changed = [{ ...events[0], payload: { op: "toggle", index: 99 } }];
  expect(
    (
      await app.inject({
        method: "POST",
        url: `/api/sessions/${id}/events`,
        headers,
        payload: { events: changed },
      })
    ).statusCode,
  ).toBe(409);
  await app.close();
  await sql.close();
}, 30000);
