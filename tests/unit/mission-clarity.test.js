import { test, expect } from "vitest";
import { getMission } from "../../src/shared/missions.js";
import { v2ActivityHtml } from "../../src/client/ui/v2-activities.js";
import { evaluateV2 } from "../../src/shared/v2-evaluator.js";
test("unanswered flowchart preview does not supply the five assessed answers", () => {
  const html = v2ActivityHtml(getMission("v2p02m01"), { answers: {} }).split(
    '<div class="answer-grid">',
  )[0];
  expect(html).not.toContain("stok ≥ pesanan");
  expect(html).not.toContain("YA → Terima");
  expect(html).not.toContain("Input stok, pesanan");
});
test("boundary preview starts with the faulty operator and follows the repair", () => {
  const m = getMission("v2p02m03");
  expect(
    v2ActivityHtml(m, { answers: {} }).split('<div class="answer-grid">')[0],
  ).toContain("stok &gt; pesanan");
  expect(
    v2ActivityHtml(m, { answers: { operator: ">=" } }).split(
      '<div class="answer-grid">',
    )[0],
  ).toContain("stok &gt;= pesanan");
});
test("incomplete response identifies the missing field without giving its answer", () => {
  const m = getMission("v2p01m01");
  expect(evaluateV2(m, { answers: {} }).feedback).toContain(
    m.rules.fields[0].label,
  );
});
