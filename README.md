# Pulau Logika — Ekspedisi Menara Awan

Game asesmen Informatika Fase E: lima pulau, 15 misi inti dan satu bos C6 opsional. Frontend DOM/CSS/Vite dengan aset ilustrasi; API Node.js/Fastify di Vercel Functions; PostgreSQL Neon.

## Pengembangan

Gunakan Node.js 24. Jalankan `npm ci`, salin `.env.example` ke `.env` dan isi koneksi Neon pooled di mesin Anda, kemudian `npm run db:migrate` serta `npm run teacher:create`. Jangan mengirim connection string/password ke chat atau Git.

Jalankan `npm start` setelah `npm run build` untuk aplikasi production lokal pada port 3000. Untuk development, jalankan API tersebut dan `npm run dev` pada terminal kedua; Vite meneruskan `/api` ke port 3000.

`npm test` menjalankan unit/API lokal. `npm run test:browser` menjalankan Chromium dan database sintetis khusus tes. `npm run test:offline` memeriksa build dan service worker. Lihat [hasil pengujian](HASIL_UJI.md) untuk bukti dan batasnya.

## Penggunaan dan deployment

- [Petunjuk peserta](PETUNJUK.md)
- [Panduan guru](PANDUAN_GURU.md)
- [Deployment Vercel + Neon](DEPLOYMENT.md)
- [Mengaktifkan penilaian Nara (Google AI)](GOOGLE_AI.md)

Tidak ada kredensial atau akun guru bawaan di aplikasi production. Login guru dibuat pengelola. Murid dapat mendaftar sendiri atau menerima akun dari guru; login memakai nama samaran dan kata sandi, sedangkan nama lengkap disimpan untuk rapor.

## Aset ilustrasi

Sebanyak 26 aset dari folder Drive yang disetujui disimpan sebagai WebP di `public/game-assets/`. `manifest.json` mencatat nama, ukuran, hash sumber, dan folder asal. Ekspor ulang master PNG dengan `python scripts/prepare-game-assets.py PATH_MASTERS` (Pillow diperlukan). Master asli tidak diubah.

Nilai kompetensi misi berasal dari ketepatan jawaban atau rubrik karya tertulis terbaik; rata-rata 15 misi minimal 90 membuka bos pengayaan. Skor permainan terpisah dan memberi bobot 60% pada ketepatan serta masing-masing 10% pada petunjuk, percobaan, kesalahan, dan waktu aktif. C5/C6 dapat dinilai Nara (Google AI) melalui rubrik jika kunci server tersedia; guru dapat mengoreksi atau menilai saat layanan tidak tersedia. ID misi versi lama tetap dikenali agar riwayat dan cadangan tidak rusak.
