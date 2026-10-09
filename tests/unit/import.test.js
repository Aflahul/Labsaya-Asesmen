import { test, expect } from "vitest";
import { MISSIONS } from "../../src/shared/missions.js";
import { newSession } from "../../src/shared/assessment.js";
test("import validates all events before producing replacement and recomputes score", async () => {
  const { validateImport } = await import("../../src/client/import.js");
  const s = newSession(MISSIONS[0], "p");
  const raw = { schemaVersion: 1, participantId: "p", sessions: [s] };
  expect(validateImport(raw, "p").sessions[0].score).toBe(null);
  expect(() =>
    validateImport(
      {
        ...raw,
        sessions: [
          { id: "x", participantId: "p", missionId: "p01m01", events: [] },
        ],
      },
      "p",
    ),
  ).toThrow();
  expect(() =>
    validateImport(
      { ...raw, sessions: [{ ...s, events: [{ id: "x", type: "hack" }] }] },
      "p",
    ),
  ).toThrow();
});
