import { test, expect } from "vitest";
import { MISSIONS } from "../../src/shared/missions.js";
for (const m of MISSIONS)
  test(`${m.id} wrong then correct action sequence`, async () => {
    const { initialState, applyAction, evaluate } =
      await import("../../src/shared/evaluators/index.js");
    const { solution } = await import("../fixtures/solutions.js");
    let state = initialState(m);
    expect(evaluate(m, state).complete).toBe(false);
    for (const action of solution(m)) {
      const r = applyAction(m, state, action);
      expect(r.errors).toEqual([]);
      state = r.state;
    }
    expect(evaluate(m, state).complete).toBe(true);
  });
test("invalid array index and robot wall are rejected", async () => {
  const { initialState, applyAction } =
    await import("../../src/shared/evaluators/index.js");
  const arr = MISSIONS[14],
    robot = MISSIONS[7];
  expect(
    applyAction(arr, initialState(arr), { op: "set", index: 99, value: "A" })
      .errors.length,
  ).toBeGreaterThan(0);
  expect(
    applyAction(robot, initialState(robot), { op: "direction", value: "Kanan" })
      .errors.length,
  ).toBeGreaterThan(0);
});
test("bubble sort rejects swap when already ordered", async () => {
  const { initialState, applyAction } =
    await import("../../src/shared/evaluators/index.js");
  const m = MISSIONS[16];
  let s = initialState(m);
  s = applyAction(m, s, { op: "compare", swap: true }).state;
  expect(
    applyAction(m, s, { op: "compare", swap: false }).errors.length,
  ).toBeGreaterThan(0);
});
test("unrelated operations cannot inflate traced steps", async () => {
  const { initialState, applyAction } =
    await import("../../src/shared/evaluators/index.js");
  const m = MISSIONS[13];
  expect(
    applyAction(m, initialState(m), { op: "test" }).errors.length,
  ).toBeGreaterThan(0);
});
