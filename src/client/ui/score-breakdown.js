const secondsLabel = (ms) =>
  `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, "0")}`;

export function scoreBreakdown(s, competencyGrade, gameGrade) {
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
  return `<section class="score-breakdown" aria-label="Rincian nilai misi"><h3>Nilai kompetensi misi: ${competencyGrade?.score ?? c.K ?? "—"}</h3><p class="notice">Nilai kompetensi berasal dari ketepatan jawaban atau rubrik guru terbaik. Petunjuk, percobaan, kesalahan, waktu, dan Ulang tidak menguranginya.</p><h4>Skor permainan sesi: ${s.score}</h4>${gameGrade ? `<p class="notice">Skor permainan terbaik ${gameGrade.bestScore} − ${gameGrade.replayPenalty} poin (${gameGrade.replayCount} kali Ulang) = ${gameGrade.score}. Rincian di bawah adalah sesi yang sedang dibuka.</p>` : ""}<dl>${rows.map(([label, key, weight, note]) => `<div><dt>${label} <small>${weight}% · ${note}</small></dt><dd>${c[key] ?? "—"}<small>${c[key] === undefined ? "—" : ((c[key] * weight) / 100).toFixed(2)} poin</small></dd></div>`).join("")}</dl><p class="notice">Bobot 60% + 10% + 10% + 10% + 10% hanya untuk skor permainan sebagai informasi proses. Nilai akhir kompetensi adalah rata-rata nilai 15 misi. Bos pengayaan terbuka mulai 90.</p></section>`;
}
