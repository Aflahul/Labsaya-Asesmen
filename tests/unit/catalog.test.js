import { test, expect } from "vitest";
const load = () => import("../../src/shared/missions.js");
test("catalog has 16 core and 2 enrichment missions", async () => {
  const { MISSIONS } = await load();
  expect(MISSIONS).toHaveLength(18);
  expect(MISSIONS.filter((m) => !m.enrichment)).toHaveLength(16);
  expect(new Set(MISSIONS.map((m) => m.id)).size).toBe(18);
  for (let i = 1; i <= 9; i++)
    expect(MISSIONS.filter((m) => m.island === i)).toHaveLength(2);
  for (const m of MISSIONS) {
    expect(m.instructions.length).toBeGreaterThan(10);
    expect(m.indicators.length).toBeGreaterThan(0);
  }
});
test("event rejects invalid time and unknown type", async () => {
  const { validateEvent } = await import("../../src/shared/contracts.js");
  for (const activeMs of [NaN, -1, Infinity])
    expect(() =>
      validateEvent({
        id: "x",
        sessionId: "s",
        seq: 1,
        type: "submit",
        activeMs,
        payload: {},
      }),
    ).toThrow();
  expect(() =>
    validateEvent({
      id: "x",
      sessionId: "s",
      seq: 1,
      type: "hack",
      activeMs: 0,
      payload: {},
    }),
  ).toThrow();
});
test("bubble canonical steps count comparisons, not number of values", async () => {
  const { MISSIONS } = await load();
  for (const m of MISSIONS.filter((m) => m.kind === "bubble"))
    expect(m.canonicalSteps).toBe(6);
});
