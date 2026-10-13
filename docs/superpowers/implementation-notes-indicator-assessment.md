# Implementasi asesmen indikator

Branch: feat/indicator-assessment. Rancangan dan rencana 14 Oktober 2026 disetujui pengguna; implementasi inline dengan satu review independen.

- Semua 16 misi memiliki indikator, deskriptor dan soal transfer. Tiga provider menilai setiap submission baru secara independen; hasil disagreed/partial tidak diklaim sepakat.
- Jawaban/kutipan/hasil deterministik divalidasi. Tidak tahu tidak mendapat tingkat kemampuan buatan atau pujian palsu. Nara maksimal 400 karakter Unicode, dengan pesan konkret atau fallback yang dikurasi.
- Aktivitas/XP/asesmen terpisah. 100 XP sekali per misi, tanpa penalti ulang/hint/waktu/error. Misi berikutnya dan bos mengikuti penyelesaian aktivitas, bukan nilai tinggi.
- Bukti mandiri terbaru dipilih berdasarkan waktu pengiriman. Percobaan kasus yang sama setelah paparan dicatat latihan. Acuan jawaban transfer hanya di modul server; tidak masuk sesi murid/client bundle.
- Rapor guru memuat kelompok per indikator misi dan agregat indikator TP, denominator seluruh kelas, bantuan, hasil ketiga model dan koreksi/history. Ambang berlaku konsisten untuk kelas, roster dan rapor individu.
- Data lama tetap arsip; nilai indikator tidak direkayasa dari nilai total lama.

Review independen menemukan kebocoran guide transfer, urutan berdasarkan waktu grading, dan ambang yang tidak konsisten; ketiganya direproduksi RED dan diperbaiki GREEN. Riwayat koreksi juga dibuat terlihat. Pengujian draft transfer menemukan pemilihan misi berikutnya mengabaikan latihan aktif; kini latihan aktif diprioritaskan saat kembali dari peta.

Batas yang diketahui: satu kasus transfer terkurasi per misi/version. Pengulangan kasus yang sudah dilihat bukan bukti mandiri baru; guru dapat memberi kasus lain dan mengonfirmasi observasi. Korpus kalibrasi adalah referensi pengembang, belum dinilai guru. Credential Groq/OpenRouter/Google tidak tersedia di workspace; pengujian tiga-provider memakai fixture sintetis, tidak membuktikan akurasi/kuota model production.

Belum dipush, dimerge atau dipublikasikan; tidak ada perubahan database produksi.
