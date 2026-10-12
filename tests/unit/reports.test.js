import { test, expect } from "vitest";
test("CSV quotes commas and prevents formula injection", async () => {
  const { toCsv } = await import("../../src/shared/reports.js");
  const csv = toCsv([{ Nama: "=SUM(1,1)", Kelas: 'X,"A"' }]);
  expect(csv).toContain("'=SUM(1,1)");
  expect(csv).toContain('X,""A""');
});

test("every core mission names the evidence its task checks", async () => {
  const { CORE_MISSIONS } = await import("../../src/shared/missions.js");
  const { MISSION_EVIDENCE } =
    await import("../../src/shared/mission-evidence.js");
  const { buildReport } = await import("../../src/shared/reports.js");
  const rows = buildReport({ sessions: [] }).rows;
  for (const m of CORE_MISSIONS) {
    expect(MISSION_EVIDENCE[m.id]?.length).toBeGreaterThan(30);
    expect(rows.find((r) => r.Misi === m.title)["Bukti yang diperiksa"]).toBe(
      MISSION_EVIDENCE[m.id],
    );
  }
});
