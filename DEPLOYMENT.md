# Deployment Vercel dan Neon

## Prasyarat

Repositori GitHub berisi kode aplikasi, proyek Vercel, proyek Neon development/production, Node.js 24 untuk operator, serta akses pengelola. ZIP tidak diperlukan. Deployment produksi berada pada proyek Vercel **asesmen-labs**.

0. Pastikan commit aplikasi sudah berada di repositori GitHub yang akan di-import. Pada lingkungan pengembangan ini kode disimpan di branch lokal `work`; push ke branch deployment yang Anda pilih melalui Git. Jika repositori masih kosong dan Anda memilih `main`, perintah tanpa force adalah `git push origin HEAD:main`. Jika ditolak karena remote berubah, integrasikan perubahan remote terlebih dahulu; jangan force-push.
1. Buat database Neon untuk environment yang dituju. Salin **pooled connection string** lewat Neon dashboard dan simpan langsung di environment server Vercel sebagai `DATABASE_URL`. Jangan menggunakan awalan `VITE_` karena variabel tersebut dapat masuk frontend. Pertahankan pengaturan TLS yang diberikan Neon, termasuk verifikasi; jangan menambahkan `rejectUnauthorized=false`.
2. Gunakan database/branch Neon terpisah untuk Preview dan Production. Database pengujian jangan berisi identitas peserta nyata.
3. Di mesin operator, salin `.env.example` menjadi `.env`, masukkan koneksi development/production yang dipilih secara sadar, lalu jalankan `npm ci` dan `npm run db:migrate`. Script mencatat migrasi yang telah diterapkan sehingga pengulangan tidak menerapkan ulang. Migrasi **tidak dijalankan otomatis saat build preview**.
4. Jalankan `npm run teacher:create` di terminal interaktif. Masukkan username dan password minimal 10 karakter; password tidak ditampilkan. Tidak ada akun guru default. Gunakan target database yang sama dengan deployment.
5. Import repositori ke Vercel, pilih framework Vite, build `npm run build`, output `dist`, runtime Node.js 24. `vercel.json` dan `api/index.js` menyediakan routing frontend dan API serverless same-origin.
6. Deploy preview dan jalankan smoke test di bawah. Publish production dilakukan pengelola setelah memeriksa hasil.

Untuk menyalakan penilaian otomatis misi 15 dan bos, tambahkan `GOOGLE_API_KEY` sebagai variabel **Secret** di Vercel lalu redeploy. Lihat [panduan Google AI](GOOGLE_AI.md). Tanpa kunci, jawaban tertulis tetap tersimpan dan dapat dinilai guru.

## Smoke test wajib pada preview HTTPS

Daftarkan peserta sintetis, logout/login dengan kedua nama, selesaikan misi pertama, refresh dan periksa progres. Masuk sebagai guru dan buka rapor peserta tersebut. Periksa API peserta menolak endpoint guru, respons API tidak menjadi HTML, cookie sesi Secure/HttpOnly, serta leaderboard hanya mengirim alias/nilai/peringkat.

Setelah kunjungan pertama dan cache siap, putuskan jaringan, refresh aplikasi, lanjutkan sesi yang belum selesai, dan sambungkan jaringan lagi. Periksa status sinkronisasi dan hasil guru. Mengaktifkan service worker tidak membuktikan semua aset telah tersimpan jika instalasinya belum selesai.

## Cara kerja runtime

Vercel Functions tidak menyimpan sesi penting pada filesystem/memori: data berada di Neon. Pool server maksimal dua koneksi per instance. Login dan API membutuhkan koneksi; game yang sudah dicache dan akun yang sudah pernah login dapat dipakai offline pada perangkat yang sama. Bukti waktu/tindakan offline berasal dari perangkat dan tidak sepenuhnya dapat diverifikasi server.

Service worker hanya cache aset aplikasi, tidak cache `/api/*`. Versi baru menunggu tab versi lama ditutup sebelum aktivasi sehingga tugas aktif tidak dipaksa reload. Tutup seluruh tab dan buka lagi untuk menerima versi baru. Cache lokal privat dipisahkan per ID peserta dan dihapus saat logout setelah konfirmasi data pending.

## Troubleshooting

- API 503: periksa keberadaan `DATABASE_URL`, target Neon, izin dan TLS; jangan mencetak connection string ke log.
- Tabel tidak ditemukan: jalankan migrasi eksplisit terhadap database yang benar.
- Login guru gagal: buat akun pada target Neon deployment, bukan target preview lain.
- `/api` mengembalikan HTML: periksa deployment functions dan rewrites; jangan meneruskan API ke SPA fallback.
- Progres lokal belum terlihat di halaman guru: peserta harus online dan mendapat status tersinkron. Jangan menganggap cache lokal sudah tersimpan di Neon.
- Login lewat nama dapat disalahgunakan orang yang mengetahui kedua nama; gunakan untuk asesmen formatif dengan supervisi, bukan ujian berisiko tinggi.

## Rilis kebijakan indikator

Tidak memerlukan migrasi tabel: tambahan rubrik/asesmen disimpan pada dokumen sesi JSON dan ambang pada tabel settings. Semua sesi baru menggunakan indicator-v1; arsip tetap tersimpan. Jalankan npm test, npm run build, TEST_INDICATOR_GRADER=1 npm run test:browser dan TEST_INDICATOR_GRADER=1 npm run test:offline. Provider sintetis tidak memvalidasi API key/kuota produksi; periksa ketiga provider dengan akun sintetis sebelum memakai hasil sebagai asesmen sumatif. Jangan mempromosikan label sepakat jika penilaian masih parsial. Gemini dipanggil setiap submission; periksa kuota dan biaya yang sesuai.
