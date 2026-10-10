import { esc } from "./activities.js";
const chip = (label, value) =>
  `<div class="machine-cell"><small>${esc(label)}</small><strong>${esc(value ?? "…")}</strong></div>`;
function simulation(m, a) {
  if (m.kind === "list") {
    const list = [...m.initial];
    if (a.set) {
      list[Number(a.set.match(/\[(\d)\]/)?.[1])] = "Air";
    }
    if (a.remove) list.splice(Number(a.remove.match(/\((\d)\)/)?.[1]), 1);
    if (a.append === 'rak.append("Obat")') list.push("Obat");
    else if (a.append === 'rak[0] = "Obat"') list[0] = "Obat";
    else if (a.append) list.splice(2, 1);
    return `<div class="sim-caption">Rak setelah operasi pilihanmu</div><div class="machine-row">${list.map((v, i) => chip("indeks " + i, v)).join("")}</div>`;
  }
  if (["flow", "flow-trace", "boundary"].includes(m.kind))
    return `<div class="flow-preview" aria-label="Pratinjau diagram alur"><span>Mulai</span><b>↓</b><span class="flow-input ${a.symbol === "Belah ketupat" ? "shape-diamond" : a.symbol === "Persegi panjang" ? "shape-rectangle" : m.kind === "flow" && !a.symbol ? "shape-unselected" : "shape-input"}">${esc(a.first || (m.kind === "flow" ? "Pilih langkah pertama" : "Input stok, pesanan"))}</span><b>↓</b><span class="decision">${esc(a.condition || (m.kind === "flow" ? "Pilih kondisi" : "stok " + (a.operator || (m.kind === "boundary" ? ">" : "≥")) + " pesanan"))}?</span><div class="flow-branches"><span>YA → ${esc(a.yes || (m.kind === "flow" ? "Pilih keluaran" : "Terima"))}</span><span>TIDAK → ${esc(a.no || (m.kind === "flow" ? "Pilih keluaran" : "Tunda"))}</span></div><b>↓</b><span>Selesai</span></div>`;
  if (m.kind === "cpu")
    return `<div class="machine-path">Data masuk → Disimpan → Instruksi diatur → Dihitung → Hasil ditampilkan</div>`;
  if (["memory", "memory-debug"].includes(m.kind))
    return `<div class="sim-caption">Data awal RAM · kotak hasil mengikuti pilihanmu</div><div class="machine-row">${chip("RAM [10]", 12)}${chip("RAM [11]", 8)}${chip("Akumulator", a.add || a.load || 0)}${chip("RAM [12]", a.store || "kosong")}</div><div class="machine-path">INPUT → RAM ↔ CU / ALU → OUTPUT ${esc(a.out || "")}</div>`;
  if (m.kind === "pseudocode" && !m.snippet)
    return `<pre class="trace">${esc([a.one || "① Pilih input", a.two || "② Pilih proses", a.three || "③ Pilih output"].join("\n"))}</pre>`;
  return "";
}
export function v2ActivityHtml(m, state) {
  const a = state.answers || {};
  return `${simulation(m, a)}${m.snippet ? `<pre class="trace">${esc(m.snippet.replace("[pilih kondisi]", a.condition || "[pilih kondisi]"))}</pre>` : ""}${m.reference ? `<p class="notice">${esc(m.reference)}</p>` : ""}<div class="answer-grid">${m.rules.fields.map((f) => `<label for="answer-${f.key}">${esc(f.label)}<select id="answer-${f.key}" data-answer="${f.key}"><option value="" disabled ${a[f.key] === undefined ? "selected" : ""}>Pilih jawaban…</option>${f.options.map((o) => `<option value="${esc(o)}" ${a[f.key] === o ? "selected" : ""}>${esc(o === "Output terjadi sebelum assignment energi" ? "Hasil ditampilkan sebelum energi diberi nilai" : o)}</option>`).join("")}</select></label>`).join("")}</div>${m.code ? `<label for="code">Editor program <span class="notice">· Ubah kode di bawah, lalu tekan Coba.</span></label><textarea id="code" data-answer="code" class="code-editor" rows="7" spellcheck="false" maxlength="6000">${esc(a.code || "")}</textarea>` : ""}${m.written ? `<p class="notice">Guru menilai ketepatan gagasan dan bukti, bukan panjang tulisan. Draf tersimpan saat kamu mengetik.</p>${m.written.map(([key, label]) => `<label for="answer-${key}">${esc(label)}</label><textarea id="answer-${key}" data-answer="${key}" rows="5" maxlength="5000">${esc(a[key] || "")}</textarea>`).join("")}<details><summary>Rubrik penilaian</summary><ul>${m.rubric.map(([, label, max]) => `<li>${esc(label)}: maksimal ${max} poin</li>`).join("")}</ul></details>` : ""}${state.trace?.length ? `<section class="run-results" aria-label="Hasil pengujian"><h3>Jejak uji program</h3>${state.trace.map((r, i) => `<details open><summary>Uji ${i + 1} · ${r.ok && (m.kind !== "python" || r.outputs.length === 1) && JSON.stringify(r.outputs.at(-1)) === JSON.stringify(r.expected) ? "Sesuai" : "Periksa kembali"}</summary><pre class="trace">Input: ${esc(JSON.stringify(r.input))}\nTarget: ${esc(JSON.stringify(r.expected))}\nOutput: ${esc(r.outputs?.length ? r.outputs.map((v) => (typeof v === "string" ? v : JSON.stringify(v))).join("\n") : "Belum ada keluaran")}${r.error ? "\n" + esc(r.error) : ""}</pre></details>`).join("")}</section>` : ""}`;
}
export function reviewHtml(p) {
  return p.sessions
    .filter((s) => s.status === "pending_review")
    .map((s) => {
      // Imported lazily by caller through mission metadata attached below.
      const m = s.mission;
      return `<form class="review-form" data-review="${esc(s.id)}"><h3>${esc(m.title)} ${m.enrichment ? "· Pengayaan" : ""}</h3>${m.written.map(([key, label]) => `<h4>${esc(label)}</h4><pre class="written-answer">${esc(s.state.answers[key])}</pre>`).join("")}<details><summary>Panduan penilai</summary><p>${esc(m.teacherGuide)}</p></details><div class="answer-grid">${m.rubric.map(([key, label, max]) => `<label>${esc(label)} (0–${max})<input name="${key}" type="number" min="0" max="${max}" step="0.5" required></label>`).join("")}</div><label>Umpan balik untuk murid<textarea name="comment" required maxlength="3000" rows="3"></textarea></label><button class="primary" type="submit">Simpan</button><p role="status"></p></form>`;
    })
    .join("");
}
