export const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const cmd = (a) => `data-action="${esc(JSON.stringify(a))}"`;
const button = (label, a, cls = "") =>
  `<button class="${cls}" ${cmd(a)}>${esc(label)}</button>`;
const opts = (values, value) =>
  `<option value="">Pilih…</option>` +
  values
    .map(
      (v, i) =>
        `<option value="${esc(v)}" ${v === value ? "selected" : ""}>${esc(v)}</option>`,
    )
    .join("");
export function activityHtml(m, s) {
  const r = m.rules;
  let out = "";
  switch (m.kind) {
    case "selection":
      return `<div class="card-grid">${r.items.map((v, i) => `<button class="object ${s.selected.includes(i) ? "selected" : ""}" aria-pressed="${s.selected.includes(i)}" ${cmd({ op: "toggle", index: i })}><span class="symbol">${s.selected.includes(i) ? "✓" : "◇"}</span>${esc(v)}</button>`).join("")}</div>`;
    case "grouping":
      return r.items
        .map(
          (v, i) =>
            `<div class="group-row"><span>${esc(v)}</span><select aria-label="Kategori ${esc(v)}" data-select="place" data-index="${i}"><option value="">Pilih kelompok…</option>${r.groups.map((g, j) => `<option value="${j}" ${s.placements[i] === j ? "selected" : ""}>${esc(g)}</option>`).join("")}</select></div>`,
        )
        .join("");
    case "pattern":
      out = `<div class="sequence">${r.prefix.map((v) => `<span class="block">${esc(v)}</span>`).join("")}<span class="block">?</span></div>`;
      break;
    case "robot":
      return `<div class="robot-grid">${Array.from(
        { length: r.size * r.size },
        (_, i) => {
          const x = i % r.size,
            y = Math.floor(i / r.size),
            wall = r.walls.some((w) => w[0] === x && w[1] === y),
            goal = r.goal[0] === x && r.goal[1] === y;
          return `<div class="cell ${wall ? "wall" : goal ? "goal" : ""}" aria-label="${x},${y}">${s.pos[0] === x && s.pos[1] === y ? "♟" : wall ? "▰" : goal ? "✧" : ""}</div>`;
        },
      ).join(
        "",
      )}</div><div class="actions">${["Atas", "Bawah", "Kiri", "Kanan"].map((v) => button(v, { op: "direction", value: v })).join("")}</div><p class="notice">Jejak: ${esc(s.sequence.join(" → ") || "Robot belum bergerak")}</p>`;
    case "cpu":
      return `<div class="cpu-grid"><div class="cpu-unit"><small>Program counter (PC)</small><strong>${s.pc}</strong></div><div class="cpu-unit"><small>Instruction register (IR)</small><strong>${esc(s.ir || "—")}</strong></div><div class="cpu-unit"><small>Accumulator / ALU</small><strong>${s.acc}</strong></div></div><div class="sequence">${r.program.map((v, i) => `<span class="block">[${i}] ${esc(v)}</span>`).join("")}</div><div class="actions">${["Fetch", "Decode", "Execute"].map((value) => button(value, { op: "phase", value })).join("")}</div><p class="notice">Output: ${s.output ?? "—"} · Langkah ${s.step}/9</p>`;
    case "array":
      return `<div class="array-row">${s.array.map((v, i) => `<div class="array-cell">${esc(v)}<small>indeks ${i}</small></div>`).join("")}</div><div class="inline-form"><label>Indeks<input id="array-index" type="number" min="0" value="0"></label><label>Isi elemen<input id="array-value" maxlength="100" placeholder="Misalnya: Air"></label></div><div class="actions">${r.operations.map((op) => `<button data-array="${op}">${{ set: "Ubah elemen", delete: "Hapus elemen", append: "Tambah di akhir", read: "Baca indeks" }[op]}</button>`).join("")}</div><p class="notice">${s.read ? `Bacaan indeks ${s.read.index}: ${esc(s.read.value)}` : "Pilih operasi sesuai tujuan manifest."}</p>`;
    case "bubble":
      return `<div class="array-row">${s.array.map((v, i) => `<div class="array-cell ${s.pass < s.array.length - 1 && (i === s.pair || i === s.pair + 1) ? "active" : ""}"><strong>${v}</strong><small>indeks ${i}</small></div>`).join("")}</div><p>Lintasan ${Math.min(s.pass + 1, s.array.length - 1)} dari ${s.array.length - 1}. ${s.pass < s.array.length - 1 ? `Bandingkan indeks ${s.pair} dan ${s.pair + 1}.` : "Seluruh pasangan selesai diperiksa."}</p><div class="actions">${button("Bandingkan & tukar", { op: "compare", swap: true })}${button("Bandingkan, tetap", { op: "compare", swap: false })}</div>`;
  }
  out += `<p class="eyebrow">${m.kind === "pattern" ? "Sinyal tersedia" : "Blok tersedia"}</p><div class="actions">${(r.items || r.options || []).map((v, i) => button(v, { op: "add", value: r.items ? i : v })).join("")}</div><div class="sequence">${s.sequence.length ? s.sequence.map((v, i) => `<div class="block"><span>${esc(r.items ? r.items[v] : v)}</span>${i ? button("↑", { op: "move", index: i, delta: -1 }, "small") : ""}${i < s.sequence.length - 1 ? button("↓", { op: "move", index: i, delta: 1 }, "small") : ""}${button("×", { op: "remove", index: i }, "small")}</div>`).join("") : '<div class="empty">Pilih objek untuk menyusun urutan di sini.</div>'}</div>`;
  if (m.kind === "flowchart") {
    out += `<p class="eyebrow">Simbol setiap blok</p>${r.items.map((v, i) => `<div class="group-row"><span>${esc(v)}</span><select aria-label="Simbol ${esc(v)}" data-select="symbol" data-index="${i}">${opts(["Terminator", "Input/output", "Decision", "Process"], s.symbols[i])}</select></div>`).join("")}<div class="group-row"><label for="branch-yes">Cabang Ya (n ≥ 10)</label><select id="branch-yes" data-select="branch" data-branch="yes">${opts(["Besar", "Kecil"], s.yes)}</select></div><div class="group-row"><label for="branch-no">Cabang Tidak</label><select id="branch-no" data-select="branch" data-branch="no">${opts(["Besar", "Kecil"], s.no)}</select></div><div class="actions">${button("Uji diagram: 5 & 12", { op: "test" })}</div>${s.tested ? `<p class="notice">n=5 → ${esc(s.no || "belum terhubung")} · n=12 → ${esc(s.yes || "belum terhubung")}</p>` : ""}`;
  }
  if (m.kind === "pseudocode") {
    if (r.boundary)
      out += `<label class="notice">Batas keputusan<input type="number" aria-label="Batas keputusan" data-select="boundary" value="${s.boundary}"></label>`;
    out += `<div class="actions">${button("Jalankan tes program", { op: "test" })}</div>${
      s.tested
        ? `<div class="notice">${r.tests
            .map((t) => {
              const order =
                s.sequence.length === r.answer.length &&
                r.answer.every((x, i) => s.sequence[i] === x);
              const output = order
                ? r.operation === "double"
                  ? t.input * 2
                  : t.input >= s.boundary
                    ? "Besar"
                    : "Kecil"
                : "Program belum tersusun";
              return `Input ${t.input} → ${esc(output)} (target ${esc(t.output)})`;
            })
            .join("<br>")}</div>`
        : ""
    }`;
  }
  return out;
}
