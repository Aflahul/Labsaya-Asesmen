# Hasil Uji Pulau Logika MVP

Tanggal: 9 Oktober 2026. Lingkungan: Linux/Debian x86_64, Node.js 24.19.0, Chromium 151.0.7922.173 headless. Phaser 3.90.0, Vite 8.3.4, Fastify 5.12.5, node-postgres 8.23.1, Playwright 1.64.0. Ini bukti pengujian lokal, bukan sertifikasi perangkat sekolah atau deployment Vercel.

## Hasil akhir yang benar-benar dijalankan

| Perintah | Hasil |
|---|---|
| `npm test` | 13 file, 48 tes lulus; 0 gagal/skip |
| `npm run build` | Build produksi Vite lulus; frontend dan service worker di `dist/` |
| `TEST_BUILD=1 npm run test:browser` | 7 tes browser lulus, 0 gagal/skip, sekitar 3,1 menit |

Pengujian browser terakhir memakai hasil build produksi melalui Vite preview, API Node same-origin lewat proxy, dan fixture peserta/guru sintetis di pg-mem. Seluruh 18 misi diselesaikan lewat kontrol nyata (klik/select/input), bukan setter state atau tombol lewati asesmen. CPU/GPU headless membatasi parallelism; runner memakai satu worker agar stabil. Perjalanan dapat selesai otomatis sebelum klik skip; tes perjalanan penuh menerima itu sambil tetap memeriksa misi tujuan, sedangkan tes awal memeriksa tombol skip secara langsung.

## Cakupan

- 18 validator: keadaan awal belum selesai, solusi tindakan benar, serta kasus ilegal robot, indeks array dan Bubble Sort. Flowchart/pseudocode menjalankan tes dengan input yang dinyatakan; CPU menampilkan fetch/decode/execute, PC/IR/accumulator/output.
- Rumus bobot 40/25/20/15: contoh nilai 100 dan 84, batas waktu, petunjuk, skor komponen, akurasi pertama tetap setelah reset/kesalahan berikutnya, run program dinilai sebagai percobaan, terbaru/terbaik/kumulatif terpisah, nilai inti belum lengkap sebelum 16 misi.
- Perjalanan browser penuh: registrasi, seluruh misi inti/pengayaan, penguncian, rapor nilai 100 pada jalur benar pertama, refresh, login guru dan filter peserta.
- Pembatalan logout tidak membekukan timer. Seed cache rusak tetap byte-for-byte dipertahankan setelah reload; penulisan tertunda tidak boleh menimpa perubahan eksternal.
- Cache per peserta, quota/penulisan gagal, pemulihan impor melalui validasi/replay kejadian, sinkronisasi prefix sesi yang sama, serta arsip konflik perangkat. Kasus konflik diuji pada modul, bukan dua perangkat fisik bersamaan.
- Autentikasi: alias ternormalisasi unik, nama salah ditolak, password guru mempertahankan spasi/Unicode asli, akses guru ditolak untuk peserta, sesi akun lain ditolak, CSRF/Origin dan batas input.
- PostgreSQL aktual melalui PGlite: migrasi, JSONB, transaksi rollback ketika urutan event salah, replay hasil, retry event identik/reordered-key yang idempoten, payload berubah ditolak. PGlite menjalankan PostgreSQL lokal berbasis WASM; ini bukan koneksi Neon.
- Handler Vercel Node diperiksa melalui HTTP lokal: 401/404 tetap JSON, konfigurasi hilang menghasilkan 503 tersanitasi. Hosting Vercel aktual belum dijalankan.
- Filter rekap CSV, pengutipan koma/kutip, UTF-8 BOM, dan perlindungan formula. Belum membuka berkas ekspor di aplikasi Excel/Google Sheets asli.
- Produksi offline: service worker cache aset lokal, reload tanpa jaringan, akun/progres cache tetap tersedia, tindakan pending, dan sinkronisasi kembali setelah jaringan pulih. API tidak dicache.
- Viewport desktop 1440×900, tablet 768×1024, ponsel 390×844: kontrol awal keyboard, reduced motion, tidak ada overflow horizontal, serta screenshot yang diperiksa. Tidak membuktikan semua ukuran/jenis perangkat.

## Temuan yang diperbaiki

Tinjauan independen menemukan retry JSONB tidak setara secara urutan key, sesi lokal tidak menerima perubahan remote, latest grade bergantung urutan array/timestamp retry, run program tidak dihitung, cache rusak tertimpa, impor kurang tervalidasi, dan normalisasi password guru yang keliru. Semuanya memperoleh tes regresi RED→GREEN. Masalah timer setelah logout batal juga diperbaiki. Cache aset offline pada Vite preview memerlukan pencocokan static `ignoreVary` karena header `Vary: Origin`; perbaikan diuji dalam build produksi. Pengujian terdahulu yang gagal bukan dilaporkan lulus; hasil tabel di atas berasal dari run akhir setelah perbaikan.

## Batas yang masih berlaku

`DATABASE_URL`/`TEST_DATABASE_URL` belum tersedia pada lingkungan cloud; migrasi dan penyelesaian sesi di Neon development belum dapat diverifikasi. Akses/proyek Vercel belum dikonfigurasi, sehingga deployment preview/production, routing platform nyata dan cookie HTTPS production belum diuji. Ikuti DEPLOYMENT.md dan jalankan smoke test setelah konfigurasi.

Belum mengukur 60 FPS pada laptop sekolah, menguji browser Safari/Firefox/Edge atau perangkat Windows asli, ataupun mendengarkan audio secara manual. Browser menjalankan tombol/audio/mute, tetapi kualitas akustik belum ditinjau pendengar. Login berbasis nama dan bukti waktu offline tidak memiliki jaminan identitas/tamper-proof; gunakan secara formatif dengan supervisi.
