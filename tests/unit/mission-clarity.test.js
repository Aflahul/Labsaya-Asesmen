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
test("rak is revealed only after Coba or Kirim", () => {
  const m = getMission("v2p01m02");
  const answers = { set: 'rak[1] = "Air"', remove: "rak.pop(2)", append: 'rak.append("Obat")' };
  const before = v2ActivityHtml(m, { answers, tested: false });
  expect(before).not.toContain("Isi rak saat ini");
  expect(before).not.toContain('<strong>Obat</strong>');
  const after = v2ActivityHtml(m, { answers, tested: true });
  expect(after).toContain("Isi rak saat ini");
  expect(after).toContain('<strong>Obat</strong>');
});
test("flowchart repair contrasts equality-only with inclusive comparison", () => {
  const m = getMission("v2p02m03");
  expect(m.instructions).toContain("usulan");
  expect(m.rules.fields.find((f) => f.key === "a").label).toContain("usulan ==");
  expect(m.rules.fields.find((f) => f.key === "b").label).toContain("usulan ==");
  expect(m.rules.fields.find((f) => f.key === "c").label).toContain("usulan >=");
  expect(m.rules.answers.a).toBe("Tunda");
});

test("boss displays separate rules and test inputs before the four answer sections", () => {
  const html = v2ActivityHtml(getMission("v2p05m04"), { answers: {} });
  expect(html).toContain("Aturan keberangkatan");
  expect(html).toContain('<caption>Data untuk pengujian</caption>');
  expect(html.match(/scope="row"/g)).toHaveLength(4);
  expect(html).toContain('<th scope="col">Berat (kg)</th>');
  expect(html).toContain('<td>6</td><td>10</td><td>12</td><td>Ya</td>');
  expect(html).toContain('<td>-2</td><td>5</td><td>10</td><td>Ya</td>');
  expect(html.indexOf("Data untuk pengujian")).toBeLessThan(html.indexOf('id="answer-design"'));
  for (const key of ["design", "solution", "tests", "reason"])
    expect(html).toContain(`id="answer-${key}"`);
  expect(html).not.toContain("OUTPUT kebutuhan");
});
