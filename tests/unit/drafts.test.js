import { test, expect } from "vitest";
import { MISSIONS } from "../../src/shared/missions.js";
import { newSession, reduceSession } from "../../src/shared/assessment.js";
import { updateDraft, drainDrafts } from "../../src/client/drafts.js";
import { syncProgress } from "../../src/client/sync.js";
import { validateImport } from "../../src/client/import.js";
test("5000 keystrokes persist the newest draft without growing assessment history", () => {
  const m = MISSIONS.find((m) => m.bloom === "C5"),
    s = newSession(m, "p");
  for (let i = 1; i <= 5000; i++) updateDraft(s, m, "evidence", "x".repeat(i));
  expect(s.events).toHaveLength(0);
  expect(s.draftAnswers.evidence).toHaveLength(5000);
  expect(JSON.stringify(s).length).toBeLessThan(12000);
  const actions = drainDrafts(s);
  expect(actions).toEqual([
    { op: "answer", key: "evidence", value: "x".repeat(5000) },
  ]);
  expect(s.draftAnswers).toBeUndefined();
  const replay = reduceSession(
    s,
    {
      id: crypto.randomUUID(),
      seq: 1,
      type: "action",
      payload: actions[0],
      activeMs: 0,
    },
    m,
  );
  expect(replay.state.answers.evidence).toHaveLength(5000);
});
test("server reconciliation preserves active draft and import validates then restores it", async () => {
  const m = MISSIONS.find((m) => m.bloom === "C5"),
    s = newSession(m, "p");
  s.serverCreated = true;
  s.syncedCount = 0;
  const remote = structuredClone(s);
  updateDraft(s, m, "reason", "Alasan belum dikirim");
  await syncProgress({
    progress: { sessions: [s] },
    api: async () => ({ sessions: [remote] }),
  });
  expect(s.draftAnswers.reason).toBe("Alasan belum dikirim");
  const restored = validateImport(
    { schemaVersion: 1, participantId: "p", sessions: [s] },
    "p",
  );
  expect(restored.sessions[0].draftAnswers.reason).toBe("Alasan belum dikirim");
  expect(() => updateDraft(s, m, "fake", "invalid")).toThrow();
  expect(() => updateDraft(s, m, "reason", "x".repeat(5001))).toThrow();
});
