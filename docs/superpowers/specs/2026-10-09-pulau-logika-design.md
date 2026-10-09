# Rancangan MVP Pulau Logika: Ekspedisi Menara Awan

Status: rancangan MVP disetujui pengguna pada 9 Oktober 2026; belum diimplementasikan.

## Tujuan dan keputusan pengguna

Game asesmen formatif Informatika kelas X SMK yang mengukur pemecahan masalah melalui tindakan nyata. Instruksi terbaru menyederhanakan lingkup menjadi empat aspek berpikir komputasional, flowchart, pseudocode, Von Neumann, list/array, dan pengurutan sebagai pengayaan. Versi 12 pulau/36 misi digantikan oleh rancangan MVP ini.

Keputusan tetap: akun peserta dengan nama asli, nama samaran, kelas, dan nomor absen; login memakai nama asli + nama samaran. Akun guru memakai username dan kata sandi terpisah, sebagaimana disetujui pengguna. Neon menyimpan akun, progres, dan hasil asesmen melalui backend. Leaderboard publik hanya menampilkan nama samaran dan nilai.

## Cakupan permainan yang diusulkan

Sembilan pulau, dua misi per pulau: 16 misi inti dan dua misi pengayaan. Jumlah ini merupakan usulan implementasi untuk memenuhi cakupan pengguna, bukan jumlah yang dinyatakan pengguna. Tiap pulau inti terbuka setelah dua misi pulau sebelumnya selesai; skor kecepatan tidak menentukan pembukaan. Setelah pulau 8, Menara Awan pulih dan rapor inti tersedia. Pulau 9 opsional untuk pengayaan, tanpa menghambat ketuntasan inti.

| Pulau | Kompetensi | Misi 1 | Misi 2 |
|---|---|---|---|
| 1 Pecahan | Dekomposisi | Pilih submasalah relevan dalam pameran digital | Kelompokkan pekerjaan perbaikan saluran air menjadi submasalah |
| 2 Ritme | Pengenalan pola | Susun simbol pada slot pola berulang | Lanjutkan pola sinyal berkelompok |
| 3 Kabut | Abstraksi | Pilih lapisan informasi keselamatan drone | Pilah informasi esensial untuk kapasitas dan rute perahu |
| 4 Puncak | Algoritma | Susun langkah pengunggahan karya berdasarkan prasyarat | Programkan arah robot pada grid dengan rintangan |
| 5 Alur | Flowchart | Tempatkan simbol mulai/input/proses/keputusan/output/akhir dan hubungkan aliran | Perbaiki cabang keputusan lalu uji diagram pada beberapa input |
| 6 Mesin | Pseudocode | Susun blok input/proses/kondisi/output | Perbaiki rancangan berdasarkan hasil pengujian dan jalankan ulang |
| 7 Sirkuit | Von Neumann | Tempatkan input, CPU, memori, output, ALU dan CU | Jalankan fetch/decode/execute sederhana dan amati perubahan data |
| 8 Gudang | List/array | Tambah, ubah, dan hapus list kargo hingga manifest tujuan | Akses indeks dan telusuri perubahan elemen array |
| 9 Indeks | Pengayaan: pengurutan | Bandingkan/tukar pasangan Bubble Sort sampai urut | Terapkan Bubble Sort pada data baru dan telusuri satu lintasan |

Stack, queue, sequential/binary search, Insertion Sort, pembersihan data, sistem operasi, dan subsistem lanjutan tidak termasuk MVP. Bubble Sort dipilih sebagai satu algoritma pengayaan agar pengurutan dipahami melalui tracing, bukan hanya hasil akhir. Langkah yang melanggar aturan algoritma tidak dianggap benar walaupun akhirnya menghasilkan urutan yang sama.

## Arsitektur dan pengalaman bermain

Rekomendasi tetap Phaser 3 + Vite untuk dunia 2.5D, kamera, karakter, partikel dan perjalanan, dipadukan kontrol HTML aksesibel. Alternatif SVG/CSS native lebih ringan tetapi memerlukan kamera khusus; Canvas penuh menyulitkan aksesibilitas rapor dan formulir. Pisahkan katalog/evaluator misi, skor/timer, penyimpanan/sinkronisasi, dunia visual, UI, dan API. Interpreter blok terbatas menjalankan flowchart/pseudocode; jangan mengeksekusi kode pengguna sebagai JavaScript bebas.

Pulau memiliki identitas berbeda, langit berlapis, parallax awan, bangunan yang pulih, dan jalur energi yang menyala. Alur: daftar/login → pengantar → perjalanan kamera → penjaga memperkenalkan misi → tugas → pemulihan → pulau berikutnya. Sediakan lewati animasi, reduced motion, kualitas efek rendah, mute tersimpan, dan audio buatan sendiri setelah interaksi pengguna. Semua aktivitas menyediakan alternatif keyboard dan pilih-lalu-tempatkan selain drag. Warna bukan satu-satunya penanda status.

## Penilaian dan integritas

Pertahankan bobot pengguna: `nilai = ROUND(.40*K + .25*W + .20*P + .15*H)`.

- `K = CLAMP(ROUND(.60*akurasiPertama + 40),0,100)` setelah berhasil.
- `patokan = MAX(45,30+12*elemen)`.
- `W = CLAMP(ROUND(100*(1-MAX(0,aktif-patokan)/(2*patokan))),0,100)`.
- `P = CLAMP(100-25*MAX(0,percobaan-1)-12*ulang,0,100)`.
- `H = CLAMP(100-40*petunjuk,0,100)`.

Pemeriksaan pertama membekukan akurasi proporsi unit jawaban benar. Pada simulasi bertahap, gunakan proporsi langkah benar sebelum kesalahan pertama terhadap jumlah langkah solusi kanonis, dengan aturan terdokumentasi per misi. Klik penyusunan bukan percobaan; periksa/jalankan adalah percobaan. Satu rangkaian simulasi dari mulai sampai hasil/gagal merupakan satu percobaan. Kesalahan teknis tidak dihitung sebagai kesalahan peserta.

Timer hanya berjalan ketika misi dapat dioperasikan dan tab terlihat. Perjalanan, animasi sukses, dialog yang menghalangi interaksi, dan waktu browser tertutup tidak dihitung. Keluar-masuk tugas tidak menghapus waktu atau kesalahan. Ulang Tugas mereset papan sambil mempertahankan riwayat/akurasi/waktu dan menambah ulang manual. Replay misi selesai membuat sesi baru. Terbaru, terbaik, dan kumulatif disimpan terpisah. Penyelesaian bersifat idempoten.

Simpan identitas peserta, kompetensi/indikator, versi misi, konfigurasi skor, waktu mulai/selesai/aktif, percobaan, kesalahan, ulang, petunjuk, akurasi pertama, tindakan, jawaban akhir, skor komponen, dan status. Guru dapat mengkalibrasi patokan waktu untuk sesi berikutnya tanpa mengubah nilai sesi lama.

Nilai inti hanya dihitung setelah 16 misi inti tuntas, berupa rata-rata nilai terbaru dari 16 misi. Nilai kompetensi adalah rata-rata dua misi dan ditandai belum lengkap jika salah satunya belum selesai. Nilai pengayaan terpisah, tidak menaikkan/menurunkan nilai inti atau memengaruhi peringkat inti. Ketepatan ditampilkan terpisah dari gabungan skor. Pemetaan indikator spesifik mencakup hanya materi MVP; jangan mengklaim cakupan seluruh BK.1–BK.8 versi lengkap.

## Akun, Neon, dan sinkronisasi

Frontend mengakses API HTTPS same-origin. Koneksi Neon hanya berada di server, dengan SQL berparameter dan validasi input. Nama samaran unik setelah normalisasi; nama asli tidak harus unik. Login mencocokkan kedua nama dengan normalisasi spasi/kapitalisasi yang konsisten tanpa fuzzy matching. Pesan gagal tidak menunjukkan bagian mana yang salah. Kedua nama bukan rahasia: orang yang mengetahuinya dapat menyamar; keterbatasan pilihan pengguna ini dinyatakan dalam panduan.

Sesi opaque memakai cookie HttpOnly, Secure pada HTTPS, SameSite, perlindungan CSRF, dan pembatasan percobaan login. Akun guru dibuat lewat prosedur administrasi server, tanpa registrasi guru publik, kredensial default, atau pilihan peran pada formulir peserta. Kata sandi guru memakai password hashing teruji. Backend memeriksa sesi/peran pada setiap akses lintas akun dan ekspor.

Data utama: peserta, akun guru, sesi autentikasi, sesi misi, tindakan asesmen, serta progres. Foreign key, constraint nama samaran, dan transaksi menjaga konsistensi. Server memvalidasi keadaan jawaban dan menghitung skor kembali, bukan mempercayai angka frontend. Event memiliki ID/urutan dan kunci idempotensi. Replay disimpan sebagai sesi berbeda; pengiriman ulang tidak menggandakan hasil.

Cache lokal dipisahkan per ID peserta. Berganti akun menghentikan sesi aktif dan tidak mengirim data akun sebelumnya. Antrean offline disinkronkan saat jaringan pulih dengan status belum tersinkron yang jelas. Gabungkan progres lintas perangkat berdasarkan sesi/event, bukan menimpa seluruh akun. Waktu/tindakan offline tidak bisa diverifikasi sepenuhnya oleh server; tandai sumber offline dan jelaskan batasannya. Data tanpa akun tidak otomatis dipindahkan ke akun lain. Backup ekspor tersedia, kegagalan penyimpanan ditampilkan, penghapusan lokal membutuhkan konfirmasi.

Pendaftaran, login, dashboard guru, dan leaderboard memerlukan internet. Peserta yang telah login dan memiliki cache dapat mengerjakan misi secara offline pada perangkat yang sama, kemudian sinkronisasi memerlukan sesi autentikasi yang valid. Fitur login tidak dijanjikan bekerja dari `file://`; gunakan hosting HTTPS atau server lokal terkonfigurasi.

## Rapor, halaman guru, dan leaderboard

Peserta melihat rapor miliknya: progres 16 misi inti dan dua pengayaan, nilai delapan kompetensi inti, nilai pengayaan terpisah, ketepatan, waktu, dan tabel K/W/P/H serta metrik tindakan. Tidak ada nilai akhir sebelum inti lengkap. Tampilan membedakan terbaru/terbaik/kumulatif dan menyebut sesi asal.

Guru melihat ringkasan kelas dan daftar peserta dengan nama asli, nama samaran, kelas, nomor absen, progres inti/pengayaan, ketepatan, dan nilai inti jika lengkap. Pencarian nama dan filter kelas/kelengkapan tersedia. Guru membuka rincian peserta sampai sesi, jawaban, dan jejak tindakan, dengan waktu sinkronisasi terakhir. Lingkup MVP satu sekolah, guru melihat seluruh kelas instalasi. Guru tidak mengedit nilai atau mereset akun dalam MVP.

CSV mengekspor rekap sesuai filter kelas/peserta dengan kolom Indonesia, UTF-8 BOM, pengutipan benar dan perlindungan formula spreadsheet. JSON mengekspor bukti rinci. Ekspor tidak mengubah progres. Analisis menyebut indikator belum terbukti, bantuan yang digunakan, dan area konfirmasi guru; teks bebas tidak dinilai benar hanya dari panjang karakter.

Leaderboard inti hanya memuat peserta yang menyelesaikan 16 misi inti, menggunakan rata-rata nilai terbaru. Nilai sama memperoleh peringkat sama. Hanya nama samaran/peringkat/nilai ditampilkan; tidak ada nama asli atau nomor absen. Pengayaan ditampilkan dalam rapor dan tidak memengaruhi peringkat inti.

## Deployment Vercel dan pengujian

Keputusan pengguna terbaru: ZIP tidak wajib, aplikasi akan di-deploy ke Vercel. Hasil akhir adalah repositori siap deployment, build frontend statis, API Vercel Functions pada origin yang sama, migrasi Neon, panduan guru/peserta, laporan pengujian, dan panduan deployment. Vite menghasilkan frontend; Fastify dipakai sebagai aplikasi HTTP yang dapat diuji lokal dan dibungkus handler Vercel Functions berbasis Node.js. Koneksi Neon menggunakan pooled connection string dan pool kecil yang digunakan ulang per instance; jangan menyimpan state akun/sesi dalam memori fungsi atau filesystem sementara.

Kredensial database hanya di environment server Vercel. Database preview/test dipisahkan dari production. Migrasi dijalankan secara eksplisit oleh operator terhadap target yang dipilih, bukan otomatis setiap build preview. Service worker dengan cache aset berversi diperlukan untuk membuka kembali game tanpa jaringan setelah kunjungan/login pertama; jangan cache respons autentikasi atau data rapor lewat cache HTTP bersama. Hapus cache privat peserta saat logout; progres belum tersinkron memerlukan peringatan sebelum penghapusan. Leaderboard dan API identitas memakai kebijakan cache yang mencegah kebocoran data. Tidak menjanjikan permainan sebelum kunjungan pertama tanpa internet atau login baru offline.

Dokumentasi menjelaskan konfigurasi Neon/Vercel dan prosedur membuat akun guru secara aman. Deployment nyata memerlukan otorisasi pengguna dan akses proyek yang tersedia; instruksi menyatakan rencana pengguna melakukan deployment, bukan izin otomatis mempublikasikan aplikasi. Tidak memasukkan kredensial ke frontend, source, log atau chat. File lokal dan peluncur Windows bukan target distribusi MVP.

Pengujian wajib sebelum penyerahan:

1. Formula dan batas skor, akurasi pertama tetap, timer, ulang/replay, terbaru/terbaik/kumulatif, kalibrasi, idempotensi.
2. Validator seluruh 18 misi dengan jawaban benar/salah/perbaikan, termasuk simbol/cabang flowchart, interpreter pseudocode, Von Neumann, indeks array, dan tracing Bubble Sort.
3. Browser: perjalanan penuh 16 misi inti dan dua pengayaan melalui kontrol nyata; penguncian, penyelesaian inti sebelum pengayaan, animasi dilewati, rapor, reload, offline dan resume.
4. Neon/API: registrasi duplikat, login peserta/guru, logout, akses tanpa sesi, isolasi akun, manipulasi peran, sinkronisasi retry/konflik, skor server, dan leaderboard tanpa identitas asli.
5. Dashboard/filter/ekspor, metrik terhadap sumber sesi, nilai belum lengkap, kegagalan penyimpanan dan jaringan, CSRF, serta SQL parameterized.
6. Desktop/tablet/ponsel, keyboard tiap mekanisme, reduced motion, kualitas rendah, audio/mute, serta aset tanpa jaringan.
7. Build Vercel, routing frontend/API same-origin, handler serverless, database pooled, serta service worker/update cache. Uji preview HTTPS jika akses tersedia; hasil lokal tidak membuktikan deployment Vercel berhasil. Laporkan browser dan lingkungan yang benar-benar diuji.

Jangan menyatakan aplikasi siap deployment bila misi atau pemeriksaan wajib belum berfungsi. Sasaran 60 FPS harus diukur; jangan mengklaim tanpa bukti perangkat. Tidak ada tombol dekoratif atau fitur akan-segera-tersedia menggantikan kebutuhan inti.
