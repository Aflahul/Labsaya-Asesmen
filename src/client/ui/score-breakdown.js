export function scoreBreakdown(s, competencyGrade, gameGrade) {
  if (!s.components) return "";
  return `<section class="score-breakdown" aria-label="Hasil misi"><p class="notice">Arsip hasil sebelumnya. Mulai Ulang untuk penilaian per indikator tanpa penalti XP.</p><p><strong>Nilai kompetensi misi: ${competencyGrade?.score ?? s.components.K}</strong></p><p>Skor permainan misi: ${gameGrade?.score ?? s.score}</p><p class="notice">Lihat cara penilaian di Tanya Jawab pada Rapor.</p></section>`;
}
