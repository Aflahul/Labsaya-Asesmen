// Keep the solution reference out of shared mission metadata and the client bundle.
export const BOSS_GRADING_GUIDE = `
Contoh solusi berikut bukan satu-satunya jawaban benar. Nilai berdasarkan aturan kasus, bukti pengujian, dan konsistensi alasan; bukan nama variabel, susunan kata, panjang tulisan, atau kemiripan dengan contoh. Bahasa sehari-hari, pseudocode, dan Python bernilai setara. Jangan mensyaratkan fitur di luar soal, seperti antarmuka, perulangan, atau penanganan input teks. Jangan mengeksekusi jawaban murid.

Contoh pseudocode:
INPUT paket, berat, energi, disetujui
IF paket < 0 OR berat < 0 OR energi < 0 THEN
  OUTPUT "Data tidak valid"
ELSE
  kebutuhan = paket * 2
  OUTPUT kebutuhan
  IF berat <= 10 AND energi >= kebutuhan AND disetujui THEN
    OUTPUT "Berangkat"
  ELSE
    OUTPUT "Tunda" dan alasan syarat yang gagal

Acuan pengujian:
A: kebutuhan 12; Berangkat. Berat 10 dan energi 12 tepat memenuhi batas.
B: kebutuhan 12; Tunda karena energi tersedia 10 kurang dari 12.
C: kebutuhan 8; Tunda karena berat 11 melebihi 10 dan pengiriman belum disetujui. Terima semua alasan atau satu alasan utama yang benar. Jangan mewajibkan daftar semua alasan.
D: Data tidak valid karena jumlah paket -2. Tidak menghitung kebutuhan energi atau menentukan Berangkat/Tunda.
Nilai nol bukan negatif. Solusi harus dapat dipakai untuk masukan valid lain, bukan hanya mencetak jawaban tetap untuk A–D.

Indikator penilaian (jumlah 100):
design (30): empat masukan dengan tipe yang sesuai (20; masing-masing 5), keluaran kebutuhan energi, keputusan, alasan penundaan, dan pesan data tidak valid (10; masing-masing 2,5). Jumlah paket integer; berat boleh float/integer; energi boleh integer/float; persetujuan Boolean atau representasi setara dengan pemetaan yang jelas. Tidak wajib menuliskan tipe keluaran. Jika ditulis, tipe kebutuhan energi harus konsisten dengan perhitungannya. Terima nama variabel dan rancangan data alternatif yang memenuhi kebutuhan.
solution (35): 15 + 10 + 10. Validasi ketiga masukan numerik negatif sebelum perhitungan/keputusan (15; masing-masing 5); hitung paket × 2 dan tampilkan kebutuhan (10; masing-masing 5); keputusan memenuhi ketiga syarat, batas inklusif, dan alasan penundaan yang benar (10). Untuk bagian terakhir, beri 2 masing-masing untuk berat <= 10, energi >= kebutuhan, persetujuan, ketiga syarat harus terpenuhi, dan alasan penundaan. Beri nilai sebagian untuk logika yang benar. Percabangan bertahap, kondisi gabungan, atau cara lain yang setara boleh memperoleh nilai penuh.
tests (25): A maksimal 7 (kebutuhan benar 3, keputusan benar 4; penjelasan batas dinilai pada bagian reason, tidak diwajibkan lagi di bagian tests); B maksimal 6 (kebutuhan 2, keputusan 2, alasan energi kurang 2); C maksimal 6 (kebutuhan 2, keputusan 2, satu atau semua alasan yang benar 2); D maksimal 6 (pesan tidak valid 3, tidak melanjutkan perhitungan/keputusan 3). Jawaban 'Data tidak valid' saja pada D cukup memenuhi keduanya sesuai petunjuk soal. Beri nilai sebagian jika bukti belum lengkap.
reason (10): alasan urutan validasi/perhitungan/keputusan yang konsisten (3), penjelasan berat tepat 10 dan energi tepat cukup (4; masing-masing 2), pilihan cara menampilkan alasan saat beberapa syarat gagal serta alasan manfaatnya (3). Terima semua alasan atau satu alasan utama, termasuk prioritas berbeda, jika benar dan dijelaskan secara masuk akal. Nilai argumen dari logikanya, bukan kesamaan dengan alasan acuan. Jangan memberi nilai pada klaim yang tidak didukung jawaban.

Feedback untuk murid kelas X: gunakan kalimat pendek dan bahasa sederhana. Sebut satu bukti yang sudah benar dan satu langkah perbaikan yang dapat dilakukan. Jangan membocorkan contoh pseudocode atau seluruh jawaban pengujian dalam feedback.
`;
