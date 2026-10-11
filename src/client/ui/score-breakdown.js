const secondsLabel = (ms) =>
  `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, "0")}`;

export function scoreBreakdown(s) {
  const c = s.components;
  if (!c) return "";
  const rows = [
    ["Ketepatan", "K", 60, "Jawaban / rubrik guru"],
    ["Petunjuk", "H", 10, `${s.hints} petunjuk`],
    ["Percobaan", "P", 10, `${s.attempts} percobaan · ${s.resets} bersihkan`],
    ["Kesalahan", "E", 10, `${s.errors} kesalahan`],
    [
      "Waktu aktif",
      "W",
      10,
      `${secondsLabel(s.activeMs)} · acuan ${secondsLabel((s.scoringConfig?.timeBudgetSeconds || 300) * 1000)}`,
    ],
  ];
  return `<section class="score-breakdown" aria-label="Rincian nilai akhir"><h3>Nilai akhir: ${s.score}</h3><dl>${rows.map(([label, key, weight, note]) => `<div><dt>${label} <small>${weight}% · ${note}</small></dt><dd>${c[key] ?? "—"}<small>${c[key] === undefined ? "—" : ((c[key] * weight) / 100).toFixed(2)} poin</small></dd></div>`).join("")}</dl><p class="notice">Ketepatan 60%; petunjuk, percobaan, kesalahan, dan waktu masing-masing 10%. Nilai terbaik tiap misi masuk rata-rata 15 misi inti. Bos pengayaan terbuka mulai 90.</p></section>`;
}
