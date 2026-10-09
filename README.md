# Pulau Logika — Ekspedisi Menara Awan

Game asesmen formatif Informatika Fase E: sembilan pulau, 16 misi inti dan dua misi pengayaan. Frontend Phaser 3/Vite; API Node.js/Fastify di Vercel Functions; PostgreSQL Neon.

## Pengembangan

Gunakan Node.js 24. Jalankan `npm ci`, salin `.env.example` ke `.env` dan isi koneksi Neon pooled di mesin Anda, kemudian `npm run db:migrate` serta `npm run teacher:create`. Jangan mengirim connection string/password ke chat atau Git.

Jalankan `npm start` setelah `npm run build` untuk aplikasi production lokal pada port 3000. Untuk development, jalankan API tersebut dan `npm run dev` pada terminal kedua; Vite meneruskan `/api` ke port 3000.

`npm test` menjalankan unit/API lokal. `npm run test:browser` menjalankan Chromium dan database sintetis khusus tes. `npm run test:offline` memeriksa build dan service worker. Lihat [hasil pengujian](HASIL_UJI.md) untuk bukti dan batasnya.

## Penggunaan dan deployment

- [Petunjuk peserta](PETUNJUK.md)
- [Panduan guru](PANDUAN_GURU.md)
- [Deployment Vercel + Neon](DEPLOYMENT.md)

Tidak ada kredensial atau akun guru bawaan di aplikasi production. Login guru dibuat pengelola. Login peserta menggunakan nama asli + nama samaran sesuai kebutuhan pengguna; ini bukan autentikasi dengan rahasia.
