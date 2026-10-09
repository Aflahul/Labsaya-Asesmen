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
test("corrupt raw cache survives subsequent saves", async () => {
  const { createProgressStore } = await import("../../src/client/storage.js");
  let raw = "{broken";
  const storage = {
    getItem: () => raw,
    setItem: (k, v) => {
      raw = v;
    },
  };
  const store = createProgressStore(storage, "p");
  expect(() => store.load()).toThrow();
  expect(() => store.save({ sessions: [] })).toThrow();
  expect(raw).toBe("{broken");
});
test("external cache change cannot be overwritten by delayed synchronization", async () => {
  const { createProgressStore } = await import("../../src/client/storage.js");
  let raw = JSON.stringify({ participantId: "p", sessions: [] });
  const storage = {
    getItem: () => raw,
    setItem: (k, v) => {
      raw = v;
    },
  };
  const store = createProgressStore(storage, "p");
  store.load();
  raw = "{external-corruption";
  expect(() => store.save({ sessions: [] })).toThrow();
  expect(raw).toBe("{external-corruption");
});
