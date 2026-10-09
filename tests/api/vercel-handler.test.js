import { test, expect } from "vitest";
import { createServer } from "node:http";
import { setup } from "./helpers.js";
test("Vercel Node handler responds JSON on API routes", async () => {
  const { createVercelHandler } = await import("../../api/[...path].js");
  const app = await setup();
  const server = createServer(createVercelHandler(() => Promise.resolve(app)));
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  try {
    const origin = `http://127.0.0.1:${server.address().port}`;
    const me = await fetch(origin + "/api/me");
    expect(me.status).toBe(401);
    expect(me.headers.get("content-type")).toContain("application/json");
    expect((await fetch(origin + "/api/unknown")).status).toBe(404);
  } finally {
    await new Promise((r) => server.close(r));
    await app.close();
  }
});
test("missing deployment config gives sanitized 503", async () => {
  const { createVercelHandler } = await import("../../api/[...path].js");
  const server = createServer(
    createVercelHandler(() =>
      Promise.reject(Error("secret-connection-string")),
    ),
  );
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  try {
    const r = await fetch(`http://127.0.0.1:${server.address().port}/api/me`);
    expect(r.status).toBe(503);
    expect(await r.text()).not.toContain("secret-connection-string");
  } finally {
    await new Promise((r) => server.close(r));
  }
});
