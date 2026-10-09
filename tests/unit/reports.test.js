import { test, expect } from "vitest";
test("CSV quotes commas and prevents formula injection", async () => {
  const { toCsv } = await import("../../src/shared/reports.js");
  const csv = toCsv([{ Nama: "=SUM(1,1)", Kelas: 'X,"A"' }]);
  expect(csv).toContain("'=SUM(1,1)");
  expect(csv).toContain('X,""A""');
});
