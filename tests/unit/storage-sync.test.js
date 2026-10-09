import { test, expect } from "vitest";
test("cache isolated per participant and failed writes visible", async () => {
  const { createProgressStore } = await import("../../src/client/storage.js");
  const map = new Map(),
    storage = {
      getItem: (k) => map.get(k) || null,
      setItem: (k, v) => map.set(k, v),
    };
  const a = createProgressStore(storage, "a"),
    b = createProgressStore(storage, "b");
  a.save({ sessions: [{ id: "s" }] });
  expect(b.load().sessions).toEqual([]);
  expect(a.load().sessions[0].id).toBe("s");
  const bad = createProgressStore(
    {
      getItem: () => null,
      setItem: () => {
        throw Error("quota");
      },
    },
    "a",
  );
  expect(() => bad.save({ sessions: [] })).toThrow();
});
