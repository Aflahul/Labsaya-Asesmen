import { test, expect } from "vitest";
import { setup } from "./helpers.js";
import { passwordHash } from "../../src/server/auth.js";
test("teacher access, CSRF protection and calibration", async () => {
  const app = await setup();
  await app.db.query(
    "INSERT INTO teachers(id,username,password_hash) VALUES($1,$2,$3)",
    ["t", "guru", passwordHash("password-for-test")],
  );
  const r = await app.inject({
    method: "POST",
    url: "/api/teacher/login",
    payload: { username: "guru", password: "password-for-test" },
  });
  expect(r.statusCode).toBe(200);
  const cookie = r.headers["set-cookie"].split(";")[0],
    csrf = r.json().data.csrf;
  expect(
    (
      await app.inject({
        method: "GET",
        url: "/api/teacher/participants",
        headers: { cookie },
      })
    ).statusCode,
  ).toBe(200);
  expect(
    (
      await app.inject({
        method: "PUT",
        url: "/api/teacher/scoring-config",
        headers: { cookie },
        payload: { baselineMultiplier: 2 },
      })
    ).statusCode,
  ).toBe(403);
  expect(
    (
      await app.inject({
        method: "PUT",
        url: "/api/teacher/scoring-config",
        headers: { cookie, "x-csrf-token": csrf },
        payload: { baselineMultiplier: 2 },
      })
    ).statusCode,
  ).toBe(200);
  expect(
    (
      await app.inject({
        method: "POST",
        url: "/api/register",
        headers: { origin: "https://evil.example", host: "localhost" },
        payload: {},
      })
    ).statusCode,
  ).toBe(403);
  await app.close();
});
test("filtered teacher export and leaderboard expose correct fields", async () => {
  const app = await setup();
  for (const [i, cls] of [
    [1, "X A"],
    [2, "X B"],
  ])
    await app.db.query(
      "INSERT INTO participants(id,real_name,alias,alias_key,class_name,attendance) VALUES($1,$2,$3,$4,$5,$6)",
      ["p" + i, "Private " + i, "Alias" + i, "alias" + i, cls, i],
    );
  await app.db.query(
    "INSERT INTO mission_sessions(id,participant_id,mission_id,document) VALUES($1,$2,$3,$4)",
    [
      "s1",
      "p1",
      "v2p01m01",
      JSON.stringify({
        id: "s1",
        missionId: "v2p01m01",
        missionVersion: 2,
        status: "complete",
        score: 82,
        components: { K: 70 },
        scoringConfig: { formulaVersion: 3, timeBudgetSeconds: 90 },
      }),
    ],
  );
  await app.db.query(
    "INSERT INTO teachers(id,username,password_hash) VALUES($1,$2,$3)",
    ["t", "guru", passwordHash("password-for-test")],
  );
  const login = await app.inject({
    method: "POST",
    url: "/api/teacher/login",
    payload: { username: "guru", password: "password-for-test" },
  });
  const headers = { cookie: login.headers["set-cookie"].split(";")[0] };
  const r = await app.inject({
    method: "GET",
    url: "/api/teacher/export?class=X%20A",
    headers,
  });
  expect(r.statusCode).toBe(200);
  expect(r.body).toContain("Private 1");
  expect(r.body).not.toContain("Private 2");
  expect(r.body).toContain('"Nama lengkap"');
  expect(r.body).toContain('"Nilai misi: Daftarkan Kargo"');
  expect(r.body).toContain('"Kebijakan nilai"');
  expect(r.body).toContain('"competency-v1"');
  expect(r.body).toContain('"Nilai kompetensi akhir"');
  expect(r.body).toContain('"Skor permainan"');
  expect(r.body).toContain('"Skor game: Daftarkan Kargo"');
  expect(r.body).toContain('"Ketepatan: Daftarkan Kargo"');
  expect(r.body).toContain('"70","82","70"');
  expect(
    (await app.inject({ method: "GET", url: "/api/leaderboard" })).body,
  ).not.toContain("Private");
  await app.close();
});
