import { MISSIONS } from "../../shared/missions.js";

const question = (title, answer) =>
  `<details class="report-question"><summary>${title}</summary><div class="report-answer">${answer}</div></details>`;

export function reportHelp(report, teacher = false) {
  const status = report.bossUnlocked
    ? "Bos pengayaan terbuka"
    : report.completed < 15
      ? `Bos terkunci · ${report.completed}/15 misi dinilai`
      : "Bos terkunci · nilai kompetensi belum mencapai 90";
  return `<div class="report-guidance">
    <p class="report-boss">${status}</p>
    <details class="report-help">
      <summary><span class="help-mark" aria-hidden="true">?</span> Cara membaca rapor</summary>
      <div class="report-questions">
        ${question("Materi apa yang dinilai?", `<p>15 misi inti memeriksa variabel dan tipe data, list, flowchart dan percabangan, pseudocode dan pengujian, komponen komputer (RAM, CU, ALU), serta dasar Python. Pengurutan dan sistem operasi tidak termasuk dalam penilaian ini.</p><p>Kaitan indikator pada rapor guru menunjukkan bukti yang relevan, bukan keputusan ketercapaian TP.</p>`)}
        ${question("Bagaimana nilai akhir kompetensi dihitung?", `<ol><li><strong>Nilai misi:</strong> ketepatan jawaban terbaik atau hasil rubrik untuk karya tertulis, skala 0–100.</li><li><strong>Nilai pulau:</strong> rata-rata nilai kompetensi tiga misi.</li><li><strong>Nilai akhir:</strong> rata-rata lima nilai pulau setelah semua 15 misi dinilai.</li></ol><p>Misi 15 dan bos dinilai Nara (AI) saat layanan tersedia; guru dapat meninjau atau mengoreksi. Petunjuk, percobaan, kesalahan, waktu, dan Ulang tidak memotong nilai kompetensi. Nilai bos tidak masuk rata-rata.</p>`)}
        ${question("Apa itu skor permainan?", `<p>Skor permainan tersedia sebagai informasi proses. Skor sesi = ketepatan × 60% + petunjuk × 10% + percobaan × 10% + kesalahan × 10% + waktu × 10%. Skor permainan misi memakai sesi dengan skor permainan tertinggi. Ulang pertama gratis; mulai Ulang kedua, setiap Ulang mengurangi 1 poin, minimal 0.</p><p>Skor ini tidak menentukan nilai akhir kompetensi, peringkat, atau akses bos. Data petunjuk, percobaan, kesalahan, dan waktu membantu guru memahami cara murid bekerja.</p>`)}
        ${question("Bagaimana membaca rincian skor sesi?", `<p>Setiap komponen berskala 0–100. Ketepatan menyumbang maksimal <strong>60 poin</strong>; petunjuk, percobaan, kesalahan, dan waktu aktif masing-masing maksimal <strong>10 poin</strong>. Jumlahnya adalah skor permainan sesi.</p><p>Contoh: ketepatan 100, petunjuk 100, percobaan 100, kesalahan 100, dan waktu 100 menghasilkan 60 + 10 + 10 + 10 + 10 = 100. Sesi permainan terbaik dapat berbeda dari sesi dengan bukti kompetensi terbaik.</p><p>Ketepatan berasal dari jawaban atau rubrik guru. Petunjuk pertama, Coba pertama, Bersihkan pertama, dan Ulang pertama gratis. Untuk waktu, setiap misi punya acuan tersendiri; durasi yang melebihi acuan menurunkan poin waktu secara bertahap. Semua komponen proses ini hanya memengaruhi skor permainan.</p>`)}
        ${question("Bagaimana petunjuk dihitung?", `<p>Untuk sesi baru, petunjuk pertama gratis. Petunjuk kedua dan berikutnya masing-masing mengurangi <strong>1 poin skor permainan</strong>. Nilai kompetensi tidak berkurang. Sesi lama tetap memakai aturan skor saat sesi itu dibuat.</p>`)}
        ${question("Apa bedanya Ulang, Coba, dan Bersihkan?", `<ul><li><strong>Ulang:</strong> memulai sesi baru. Pengulangan pertama gratis. Mulai pengulangan kedua, skor permainan misi berkurang 1 poin per Ulang; nilai kompetensi tetap memakai bukti terbaik. Contoh: skor permainan sesi terbaik 100, mengulang 2 kali → skor permainan misi 99.</li><li><strong>Coba:</strong> memeriksa jawaban pada sesi yang sama. Pemeriksaan pertama gratis untuk skor permainan; pemeriksaan berikutnya dapat mengurangi komponen percobaan.</li><li><strong>Bersihkan:</strong> mengosongkan jawaban. Penggunaan pertama gratis untuk skor permainan; penggunaan berikutnya dapat mengurangi komponen percobaan.</li></ul><p>Coba dengan jawaban salah atau belum lengkap juga tercatat sebagai kesalahan proses. Membuka kembali hasil tidak dihitung sebagai Ulang.</p>`)}
        ${question("Bagaimana waktu dicatat?", `<p>Waktu aktif menjadi statistik proses dan komponen skor permainan, bukan nilai kompetensi. Skor permainan memberi 10 poin waktu penuh sampai acuan tiap misi; setelahnya turun bertahap hingga 0 pada tiga kali acuan. Misi tetap bisa diselesaikan.</p><p>Acuan berikut sesuai perkiraan beban tugas dan belum dikalibrasi dengan data kelas. Sesi yang sudah dimulai memakai acuan saat dibuat.</p><ul>${MISSIONS.map((m) => `<li><strong>${m.title}: ${m.timeBudgetSeconds} detik.</strong> ${m.timeBudgetReason}</li>`).join("")}</ul>`)}
        ${question("Kapan bos pengayaan terbuka?", `<p>Setelah semua <strong>15 misi dinilai</strong> dan <strong>nilai akhir kompetensi minimal 90</strong>. Syarat memakai rata-rata sebelum pembulatan. Nilai bos tidak mengubah nilai kompetensi.</p>`)}
        ${question("Apakah nilai ini berarti semua TP tercapai?", `<p>Belum tentu. KKTP sekolah menetapkan ketercapaian dari setiap indikator esensial. Nilai tinggi pada satu misi tidak menutup indikator lain yang belum terbukti.</p><p>${teacher ? "Kolom TP terkait, indikator terkait, dan batas bukti menunjukkan dukungan dari game. Tetapkan status TP dari seluruh bukti relevan, termasuk praktik atau verifikasi individual bila diperlukan." : "Guru memeriksa bukti misi bersama tugas atau praktik lain sebelum menetapkan ketercapaian TP."}</p>`)}
        ${question(
          "Bagaimana membaca tabel rincian?",
          teacher
            ? `<p><strong>Nilai</strong> adalah nilai kompetensi misi. <strong>SkorGame</strong> adalah skor permainan setelah potongan Ulang. <strong>NilaiSesiTerbaik</strong> dan <strong>PotonganUlang</strong> menjelaskan skor permainan itu. K adalah ketepatan/rubrik dari sesi kompetensi terbaik; H, P, E, dan W berasal dari sesi permainan terbaik. ID kedua sesi ditampilkan karena keduanya bisa berbeda.</p>`
            : `<p><strong>Nilai misi</strong> adalah ketepatan/rubrik terbaik. <strong>Skor permainan</strong> menampilkan aturan lama sebagai informasi proses. Petunjuk, percobaan, kesalahan, dan waktu tidak mengurangi nilai misi.</p>`,
        )}
        ${question("Untuk apa Rekap, Cadangan, dan Pulihkan?", `<ul><li><strong>Rekap:</strong> unduh nilai kompetensi, skor permainan, dan bukti per misi sebagai CSV.</li><li><strong>Cadangan:</strong> unduh salinan jawaban dan progres sebagai JSON.</li>${teacher ? "" : "<li><strong>Pulihkan:</strong> muat kembali file cadangan JSON yang pernah disimpan.</li>"}</ul>`)}
      </div>
    </details>
  </div>`;
}
