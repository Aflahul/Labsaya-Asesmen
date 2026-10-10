import { test, expect } from "vitest";
import { setup } from "./helpers.js";
import { CORE_MISSIONS, BOSS } from "../../src/shared/missions.js";
import { newSession } from "../../src/shared/assessment.js";
test("server rejects exactly95 and pending review, allows raw >95, ignores boss score in leaderboard", async () => {
  const app = await setup();
  const reg = await app.inject({
    method: "POST",
    url: "/api/register",
    payload: {
      realName: "Bos Uji",
      alias: "Bos",
      className: "X",
      attendance: 1,
    },
  });
  const account = reg.json().data,
    p = account.user.id,
    headers = {
      cookie: reg.headers["set-cookie"].split(";")[0],
      "x-csrf-token": account.csrf,
    };
  const sessions = CORE_MISSIONS.map((m) => ({
    ...newSession(m, p),
    status: "complete",
    score: 95,
    completedAt: new Date().toISOString(),
  }));
  for (const s of sessions)
    await app.db.query(
      "INSERT INTO mission_sessions(id,participant_id,mission_id,document) VALUES($1,$2,$3,$4)",
      [s.id, p, s.missionId, JSON.stringify(s)],
    );
  const createBoss = () =>
    app.inject({
      method: "POST",
      url: "/api/sessions",
      headers,
      payload: { id: crypto.randomUUID(), missionId: BOSS.id },
    });
  expect((await createBoss()).statusCode).toBe(403);
  const s = sessions.at(-1);
  s.score = 100;
  s.status = "pending_review";
  const update = () =>
    app.db.query("UPDATE mission_sessions SET document=$1 WHERE id=$2", [
      JSON.stringify(s),
      s.id,
    ]);
  await update();
  expect((await createBoss()).statusCode).toBe(403);
  s.status = "complete";
  s.score = 95.5;
  await update();
  const boss = await createBoss();
  expect(boss.statusCode).toBe(201);
  const before = (
    await app.inject({ method: "GET", url: "/api/leaderboard" })
  ).json().data;
  const b = {
    ...boss.json().data,
    status: "complete",
    score: 0,
    completedAt: new Date().toISOString(),
  };
  await app.db.query("UPDATE mission_sessions SET document=$1 WHERE id=$2", [
    JSON.stringify(b),
    b.id,
  ]);
  const after = (
    await app.inject({ method: "GET", url: "/api/leaderboard" })
  ).json().data;
  expect(after).toEqual(before);
  expect(after[0].score).toBeCloseTo(95.03);
  await app.close();
});
