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

## Rilis produksi — 14 Oktober 2026

Branch main sudah menerima fitur indikator dan perbaikan kompatibilitas OpenRouter. Deployment Vercel untuk asesmen-labs berhasil melalui Git integration. Homepage 200 dan bundle indicator-v1 terverifikasi; API me menolak pengguna tanpa login dengan 401 sesuai rancangan. Rapor akun sintetis tampil pada viewport ponsel tanpa overflow horizontal atau error JavaScript.

Uji nyata pada akun kelas UJI SISTEM - BUKAN MURID membuktikan tiga provider complete pada misi pertama: Groq openai/gpt-oss-120b, OpenRouter nvidia/nemotron-3.5-lightning:free, dan Google gemini-flash-latest. Kedua indikator berstatus agreed dan hasil tetap tersimpan setelah GET progress. Ini uji integrasi, bukan bukti kalibrasi seluruh rubrik oleh guru.

OpenRouter diperbaiki karena model gratis tidak mendukung response_format dan reasoning default menghabiskan budget output. Adapter menggunakan JSON tervalidasi, thinking opsional dimatikan untuk model Lightning yang terkonfigurasi, deadline 120 detik, max_tokens 4096, dan lease 150 detik. Key tetap di Vercel; nilainya tidak diambil atau dicetak. Mode gratis/price ceiling nol tetap dipertahankan.

Verifikasi patch terakhir: npm test 155/155; build berhasil; tiga browser flow Nara/indikator/draft 3/3. Arahan jawaban pilihan yang seluruhnya benar diarahkan ke tombol Uji Mandiri agar murid tidak disuruh memilih nilai yang tidak tersedia pada soal.

## Penyederhanaan tampilan murid dan pesan akhir Gemini

OpenRouter dinonaktifkan pada penilaian baru serta fallback lama. Groq dan Gemini menilai dua kali secara independen; Gemini kemudian menyusun satu pesan akhir dan penjelasan pendek per indikator tanpa mengubah tingkat atau bukti. Rincian teknis tetap tersedia untuk guru. Daftar deskriptor 1–4, kutipan mentah, nama model, dan pesan kegagalan tidak ditampilkan kepada murid. Teks pengulangan di instruksi misi dihapus; aturan XP tetap sama.

Verifikasi: 158/158 uji unit/API, build berhasil, 3/3 browser alur hasil kemampuan/Nara/draft. Dua uji tampilan misi ringkas juga lolos. Uji ini mencakup penyusunan pesan yang gagal tanpa menghapus nilai, koreksi guru saat proses berjalan, dan tidak ada panggilan OpenRouter pada penilaian baru.

## Perbaikan UI/UX rapor dan akses hasil

Pulau selesai membuka hasil tersimpan, bukan percobaan baru. Tombol Lihat Hasil juga tersedia untuk misi selesai pada pulau yang belum seluruhnya selesai. Riwayat menampilkan percobaan dan waktu WIB. Rapor memisahkan aktivitas selesai, indikator memenuhi, bukti belum cukup, menunggu penilaian, serta kebutuhan latihan; bukti sebagian tidak diklaim sebagai ketuntasan seluruh TP.

Dasar penilaian dapat dibuka pada kartu hasil: kutipan jawaban, alasan, acuan tiap tahap, status dan catatan tinjauan guru. Tampilan utama tetap singkat tanpa nama model. Nara pada peta dimulai tertutup dan tampil mengikuti alur halaman saat dibuka. Peta/rapor memiliki h1, status sinkronisasi diumumkan secara sopan oleh pembaca layar, dan validasi formulir menggunakan bahasa Indonesia.

Verifikasi: 161/161 unit/API, build produksi berhasil, 27 alur browser terverifikasi melalui suite dan pengulangan kasus dengan ekspektasi teks lama, serta 1/1 offline. Uji integritas membandingkan ID, jumlah event, dan status sesi sebelum/sesudah membuka hasil; tidak ada perubahan. Uji Nara memeriksa tidak ada perpotongan panel dengan pulau pada 390 px dan 1440 px. Perjalanan 15 misi, bos, koreksi guru, dan peringkat XP lolos.

## Peringkat waktu/petunjuk dan badge Sepuh

169/169 uji unit/API, build produksi berhasil, 3/3 browser untuk peringkat HP, pemulihan permintaan peringkat, serta perjalanan 15 misi/bos/koreksi guru. Pengujian mencakup pengurutan waktu, petunjuk, waktu selesai, seri, data waktu kosong, pengulangan setelah selesai, dan badge hanya untuk pengayaan yang selesai. API publik tidak menyertakan nama lengkap, ID akun, atau detail jawaban. Implementasi menghitung peringkat dari data yang sudah tersimpan dan tidak menulis ulang data asesmen kelas.

## Sepuh menggantikan nomor peringkat

Peserta yang menyelesaikan pengayaan masuk kelompok Sepuh di atas semua peringkat bernomor. Badge berada pada kolom Peringkat, tanpa angka; peserta lain mulai dari 1. Kelompok Sepuh tetap diurutkan dengan metrik inti, tanpa tambahan XP. XP pengayaan bernilai 0 dan layar penyelesaian pengayaan menampilkan badge. Data jawaban dan penilaian guru tidak diubah.

Verifikasi: 170/170 unit/API sebelum penambahan satu uji perlindungan rapor; 11/11 uji indikator termasuk uji tambahan tersebut lolos. Tiga alur browser (perjalanan lengkap/koreksi guru, pemulihan peringkat, badge pada HP) lolos; build produksi berhasil. Uji membandingkan seluruh hasil indikator inti sebelum dan sesudah pengayaan: tetap sama.

## Kartu penghargaan pada leaderboard

Leaderboard memakai daftar kartu dengan ikon dan angka peringkat: mahkota emas (1), medali perak (2), medali perunggu (3), kompas berbingkai (4–10), dan kompas sederhana (11 dan seterusnya). Sepuh memiliki ikon dan kelompok terpisah di atas peringkat utama, tanpa nomor. Ikon vektor lokal tidak memerlukan gambar eksternal. Aturan pengurutan, XP, dan keputusan asesmen tetap.

Verifikasi: 17/17 uji unit peringkat dan rapor, build produksi, serta 4/4 alur browser. Tampilan seluruh jenis penghargaan diperiksa pada 390 px dan 1440 px, termasuk nama panjang dan tidak adanya pelebaran horizontal. Perjalanan 15 misi, pengayaan, koreksi guru, dan pemisahan XP dari kemampuan tetap lulus.

## Bonus XP pengayaan untuk urutan Sepuh

Gemini menilai jawaban pertama pengayaan dengan rubrik rancangan 30, langkah 35, pengujian 25, alasan 10. Skor dibulatkan dengan minimum 10 dan maksimum 100 XP, disimpan dalam enrichmentReward, dan hanya dipakai pada urutan Sepuh. XP inti, hasil kemampuan, dan rapor tidak menerima bonus ini. Latihan ulang dan Uji Mandiri tidak mengakumulasi bonus. Penilaian gagal tetap menyusul tanpa XP buatan. Penyelesaian baru dinilai otomatis; guru dapat memproses jawaban lama lewat tombol Nilai XP pengayaan.

Verifikasi: 185/185 unit/API dan 5/5 alur browser, serta build produksi. Uji mencakup panggilan hanya ke Gemini, batas 10/100, respons tidak valid, penilaian sekali, lease mencegah panggilan ganda, koreksi guru yang berlangsung bersamaan, kontrol akses/CSRF, XP Sepuh terpisah, dan rapor tetap. Layar 390 px dan 1440 px tetap tidak melebar horizontal.

## PNG penghargaan dari pengguna

Atlas asli 3072 × 512 dengan kanal alpha transparan disimpan lokal sebagai leaderboard-awards.png tanpa perubahan piksel. Tampilan menggunakan enam bagian atlas: 1 emas, 2 perak, 3 perunggu, 4–10 kompas emas, 11 dan seterusnya kompas perak, Sepuh bersayap. Angka peringkat dan huruf S ditambahkan di bidang tengah; label Sepuh tetap ditampilkan. Nomor mengecil proporsional untuk beberapa digit, dan setiap ikon memiliki nama aksesibel.

Verifikasi: build dan 3/3 browser lulus. PNG berhasil dimuat dari aset lokal dengan ukuran asli. Tampilan diperiksa pada 390 px dan 1440 px, termasuk angka 100, nama panjang, posisi teks di bidang tengah, dan tidak adanya pelebaran horizontal. Perubahan hanya tampilan, tanpa perubahan aturan XP atau penilaian kemampuan.
