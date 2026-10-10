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
