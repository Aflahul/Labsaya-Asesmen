import { test, expect } from "vitest";
import { setup, loginSeededParticipant } from "./helpers.js";
import { passwordHash } from "../../src/server/auth.js";
import { MISSIONS } from "../../src/shared/missions.js";
import { newSession } from "../../src/shared/assessment.js";
test("only authenticated teacher grades pending work and unlocks boss from reviewed core", async () => {
  const app = await setup();
  const reg = await loginSeededParticipant(app, {
    realName: "Review Test",
    alias: "Review",
    className: "X",
    attendance: 1,
  });
  const p = reg.json().data.user.id;
  const ph = {
    cookie: reg.headers["set-cookie"].split(";")[0],
    "x-csrf-token": reg.json().data.csrf,
  };
  const m = MISSIONS.find((m) => m.bloom === "C5"),
    s = { ...newSession(m, p), status: "pending_review" };
  await app.db.query(
    "INSERT INTO mission_sessions(id,participant_id,mission_id,document) VALUES($1,$2,$3,$4)",
    [s.id, p, m.id, JSON.stringify(s)],
  );
  const payload = {
    marks: { decision: 30, evidence: 40, reason: 30 },
    comment: "Perbandingan dan bukti tepat.",
  };
  expect(
    (
      await app.inject({
        method: "POST",
        url: `/api/teacher/sessions/${s.id}/review`,
        headers: ph,
        payload,
      })
    ).statusCode,
  ).toBe(403);
  await app.db.query(
    "INSERT INTO teachers(id,username,password_hash) VALUES($1,$2,$3)",
    ["t", "guru", passwordHash("test-password")],
  );
  const login = await app.inject({
    method: "POST",
    url: "/api/teacher/login",
    payload: { username: "guru", password: "test-password" },
  });
  const th = {
    cookie: login.headers["set-cookie"].split(";")[0],
    "x-csrf-token": login.json().data.csrf,
  };
  expect(
    (
      await app.inject({
        method: "POST",
        url: `/api/teacher/sessions/${s.id}/review`,
        headers: th,
        payload: {
          ...payload,
          marks: { decision: 300, evidence: 40, reason: 30 },
        },
      })
    ).statusCode,
  ).toBe(400);
  const r = await app.inject({
    method: "POST",
    url: `/api/teacher/sessions/${s.id}/review`,
    headers: th,
    payload,
  });
  expect(r.statusCode).toBe(200);
  expect(r.json().data).toMatchObject({
    status: "complete",
    score: 100,
    review: { teacherId: "t" },
  });
  expect(
    (
      await app.inject({
        method: "POST",
        url: `/api/teacher/sessions/${s.id}/review`,
        headers: th,
        payload,
      })
    ).statusCode,
  ).toBe(409);
  await app.close();
});
