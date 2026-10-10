import { test, expect } from "vitest";
import { setup } from "./helpers.js";
import { MISSIONS } from "../../src/shared/missions.js";
import { solution } from "../fixtures/solutions.js";
test("server recalculates completion and handles duplicate events", async () => {
  const app = await setup();
  const r = await app.inject({
    method: "POST",
    url: "/api/register",
    payload: { realName: "Budi", alias: "Api", className: "X", attendance: 2 },
  });
  const { csrf } = r.json().data;
  const cookie = r.headers["set-cookie"].split(";")[0];
  const headers = { cookie, "x-csrf-token": csrf };
  const id = crypto.randomUUID();
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
  const events = [
    ...solution(MISSIONS[0]).map((payload) => ({ type: "action", payload })),
    { type: "submit", payload: { score: 999 } },
  ].map((e, i) => ({
    ...e,
    id: crypto.randomUUID(),
    sessionId: id,
    seq: i + 1,
    activeMs: 1000,
  }));
  const request = {
    method: "POST",
    url: `/api/sessions/${id}/events`,
    headers,
    payload: { events },
  };
  const first = await app.inject(request);
  expect(first.statusCode).toBe(200);
  expect(first.json().data.session.score).toBe(100);
  expect((await app.inject(request)).json().data.session.attempts).toBe(1);
  expect(
    (
      await app.inject({
        method: "GET",
        url: "/api/teacher/participants",
        headers,
      })
    ).statusCode,
  ).toBe(403);
  await app.close();
});
test("participant cannot read or write another participant session", async () => {
  const app = await setup();
  const reg = async (alias) => {
    const r = await app.inject({
      method: "POST",
      url: "/api/register",
      payload: { realName: "Nama Sama", alias, className: "X", attendance: 1 },
    });
    return {
      cookie: r.headers["set-cookie"].split(";")[0],
      "x-csrf-token": r.json().data.csrf,
    };
  };
  const a = await reg("A"),
    b = await reg("B"),
    id = crypto.randomUUID();
  await app.inject({
    method: "POST",
    url: "/api/sessions",
    headers: a,
    payload: { id, missionId: "v2p01m01" },
  });
  expect(
    (
      await app.inject({
        method: "POST",
        url: `/api/sessions/${id}/events`,
        headers: b,
        payload: { events: [] },
      })
    ).statusCode,
  ).toBe(403);
  expect(
    (
      await app.inject({ method: "GET", url: "/api/progress", headers: b })
    ).json().data.sessions,
  ).toEqual([]);
  await app.close();
});
