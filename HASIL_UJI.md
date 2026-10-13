# Hasil Uji — Ekspedisi Lima Pulau

10 Oktober 2026. Pengujian lokal Node.js 24, Chromium headless, Vite/Fastify, pg-mem dan PostgreSQL WASM (PGlite). Data peserta/guru sintetis.

| Perintah | Hasil akhir |
|---|---|
| `npm test` | 18 file, 61 tes lulus |
| `npm run build` | Lulus; JavaScript 84,21 kB (gzip 28,17 kB), CSS 21,28 kB |
| `TEST_BUILD=1 npx playwright test` | 7 tes lulus, 0 gagal/skip, 40,4 detik |
| `git diff --check` | Lulus |

## Bukti yang diperiksa

- Lima pulau, 15 misi inti: 10 C3/L2, empat C4/L3, satu C5/L3. Satu C6 sebagai bos opsional.
- Nilai terbaik per misi, rata-rata sama bobot, tanpa penalti waktu/petunjuk. Semua misi harus dinilai; tepat 95 dan karya pending ditolak gerbang bos, nilai mentah >95 diterima server.
- Seluruh 15 misi diselesaikan melalui kontrol browser. Guru benar-benar menilai C5 dan C6 melalui form rubrik; nilai bos 0 tidak mengurangi nilai inti 100. Endpoint guru menolak peserta, skor di luar rentang, dan penilaian ulang sesi yang sudah dinilai.
- Python menguji kode pada beberapa input, menolak kode tidak didukung dan pembagian nol. Kasus angka tak hingga, snapshot output list, nested/aliased/cyclic list memiliki tes regresi.
- Draf 5.000 karakter tidak menghasilkan 5.000 event (unit). Browser memproses 3.300 input berturut-turut, memeriksa cache <1 MB, memuat ulang offline, dan memulihkan tulisan utuh.
- Aset permainan tersedia offline sesudah cache siap. Jawaban pulih saat reload, lalu tersinkron ketika jaringan kembali.
- Identitas/cache terpisah; cache rusak tidak ditimpa; konflik perangkat dicadangkan; impor memvalidasi lalu replay bukti. Riwayat versi lama tetap dipisahkan dari nilai versi baru.
- Desktop 1440×900, tablet 768×1024, ponsel 390×844: tidak ada overflow horizontal, kontrol keyboard bekerja, reduced motion aktif, gambar pulau benar-benar termuat. Screenshot desktop/peta/ponsel diperiksa secara visual.
- PostgreSQL lokal memeriksa transaksi, rollback, JSON evidence, dan retry idempoten. Handler Vercel diuji melalui HTTP lokal.

## Review independen

Satu peninjau dengan konteks baru memeriksa seluruh perubahan. Dua temuan penting diperbaiki dengan tes RED→GREEN: graph list bertingkat berpotensi membebani interpreter; riwayat per-keystroke dapat memenuhi localStorage. Interpreter kini menerima list satu dimensi; draf disimpan sebagai snapshot lalu menjadi event saat selesai mengetik/mengirim/meninggalkan misi. Seluruh suite di atas dijalankan lagi setelah perbaikan. Tidak ada temuan minor yang ditunda.

## Batas verifikasi

Ini bukti lokal, belum smoke test deployment Vercel atau database Neon nyata. Belum diuji pada Safari/Firefox atau perangkat sekolah fisik; audio belum dinilai pendengar. Label Bloom/AKM adalah rancangan soal dan tetap memerlukan telaah pendidik. Panduan lama dan hasil uji sebelumnya disimpan di `docs/legacy/`.

## Pembaruan keterbacaan dan transisi (10 Oktober 2026)

- Regresi flowchart: diagram kosong tidak memberikan jawaban dan diagram perbaikan dimulai dengan operator bug `>`.
- Kolom belum lengkap disebutkan dalam umpan balik; fokus select dipertahankan setelah memilih.
- Nara memberikan tujuan, langkah, penjelasan cara menjawab, serta petunjuk khusus pada 15 misi inti dan bos.
- Pengarahan menunggu tombol Mulai misi saat siap. Transisi masuk pulau, antarpulau, dan antarmisi berbeda; meninggalkan transisi membatalkan pembukaan misi.
- Validasi: 64 tes unit/API; 9 tes browser production termasuk perjalanan lengkap, penilaian guru, nilai bos terpisah, offline, serta desktop/tablet/ponsel dan reduced motion.
- Build production berhasil. Screenshot ponsel diperiksa untuk keterbacaan Nara serta transparansi panel. Uji langsung bersama murid belum dilakukan.

## Toast Nara dan navigasi pulau — 11 Oktober 2026 (WIB)

- 64 tes unit/API lulus; build produksi berhasil.
- 12 tes browser produksi lulus, termasuk 3 tes baru: toast di luar panel dan jawaban tetap tersimpan setelah buka/tutup; tombol masuk langsung pada pulau tanpa auto-scroll; kapal dan pendekatan pulau tampil dalam fase terpisah.
- Tampilan toast dan tombol pulau pada ponsel diperiksa dari screenshot.
- Suite awal tertahan pada pendaftaran tablet setelah banyak akun uji dibuat dalam satu menit. Helper tes kini mengikuti header Retry-After pada respons 429, lalu mencoba sekali lagi; batas pendaftaran produksi tetap sama. Suite lengkap sesudah perbaikan lulus.
- Setelah penyederhanaan label tombol: 64 tes unit/API dan seluruh 12 tes browser lulus lagi. Pemeriksaan label memastikan maksimal dua kata pada tombol beranda, pendaftaran, peta, dan seluruh misi. Build akhir berhasil; screenshot peta ponsel dengan tombol Masuk diperiksa.

## Asesmen indikator — 14 Oktober 2026

Implementasi: tiga penilai independen untuk tiap submission baru, validasi bukti/hasil deterministik, status partial/disagreement, Nara maksimal 400 karakter, XP unik tanpa penalti, transfer dan bantuan tercatat, rekap indikator misi/TP, koreksi/history serta ambang konsisten.

- Suite browser lengkap: 25 lolos; tes offline sengaja dilewati dalam mode dev dan diuji terpisah.
- Build produksi dan tes offline: build berhasil, 1 tes offline lolos (asset/draft reload dan sinkronisasi).
- Regresi review: acuan transfer server-only, ordering waktu submission, threshold lintas laporan, API role/ownership, idempotency/concurrency, AI terlambat tidak menimpa guru.
- Regresi pedagogis: tidak tahu tidak mendapat nilai/praise palsu, termasuk ketika hanya bagian alasan yang belum dijelaskan; 350 karakter feedback dipertahankan pada jalur baru maupun pending arsip.
- Pengujian provider memakai fixture sintetis; credential Groq/OpenRouter/Google tidak tersedia di workspace. Tidak mengklaim akurasi model nyata atau kalibrasi guru. Korpus referensi tersedia untuk penilaian guru.

Tidak ada perubahan database/deployment produksi. Branch feat/indicator-assessment menyimpan perubahan yang diuji.

Verifikasi akhir: `npm test` 148/148 lolos (31 file). Setelah perubahan feedback terakhir, tiga tes browser Nara/indikator/draft diulang dan semuanya lolos; suite browser lengkap sebelumnya 25/25 lolos, ditambah 1/1 offline. `npm run build` berhasil dan acuan jawaban transfer tidak ditemukan pada bundle client.
