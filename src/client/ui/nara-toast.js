import { esc } from "./activities.js";
export function naraToast(m, state, message = "") {
  if (!state.open)
    return '<button id="nara-open" class="nara-launcher" aria-label="Buka panduan Nara"><img src="/game-assets/character-nara-idle.webp" alt=""><span>Nara</span></button>';
  const guide = m.guidance;
  const isGuide = state.mode === "guide";
  const content = !isGuide
    ? `<p>${esc(message || (m.written ? "Tulisanmu tersimpan. Lengkapi semua bagian sebelum mengirim karya." : "Jawabanmu berubah. Tekan Coba lagi untuk memeriksa hasil terbaru."))}</p>`
    : state.page === 0
      ? `<p>${esc(guide.goal)}</p>`
      : state.page === 1
        ? `<strong>Langkahmu</strong><ol>${guide.steps.map((s) => `<li>${esc(s)}</li>`).join("")}</ol>`
        : `<p>${esc(guide.help)}</p><p>${!m.id ? "" : m.written ? "Tekan Kirim setelah tulisanmu siap dinilai Nara. Guru dapat meninjau hasilnya." : "Tekan Coba untuk memeriksa jawabanmu. Kamu masih bisa memperbaikinya. Kalau sudah siap dinilai, tekan Kirim."}</p>`;
  return `<section id="nara-toast" class="nara-toast" role="region" aria-labelledby="nara-title"><div class="nara-bubble"><div class="nara-toast-header"><div><strong id="nara-title">Nara</strong><small>${state.mode === "hint" ? "Petunjuk untukmu" : state.mode === "feedback" ? "Kita periksa hasilnya" : "Teman perjalananmu"}</small></div><button id="nara-close" class="ghost" aria-label="Tutup panduan Nara">×</button></div><div class="nara-toast-message" aria-live="polite">${content}</div><div class="nara-toast-actions">${isGuide && state.page > 0 ? '<button id="nara-back" class="ghost small">← Kembali</button>' : ""}${isGuide && state.page < 2 ? `<button id="nara-next" class="small">${state.page === 0 ? "Panduan" : "Catatan"}</button>` : '<button id="nara-dismiss" class="primary small">Mengerti</button>'}${!isGuide ? '<button id="nara-guide" class="ghost small">Panduan</button>' : ""}</div></div><img class="nara-live" src="/game-assets/character-nara-${state.mode === "feedback" ? "idle" : "thinking"}.webp" alt=""></section>`;
}
