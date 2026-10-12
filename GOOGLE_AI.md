# Mengaktifkan penilaian Nara (AI)

Misi 15 (*Pilih Solusi Terbaik*) dan bos (*Ruang Arsitek*) menggunakan rubrik yang sudah ditentukan. Saat murid menekan **Kirim**, server menyimpan jawaban, meminta Google Gemini menilai tiap kriteria, memvalidasi rentang nilainya, lalu menyimpan nilai dan feedback. Nara menyampaikan feedback itu kepada murid. Guru dapat melihat jawaban, alasan per kriteria, dan mengoreksi nilai AI di rapor. Koreksi menyimpan keputusan AI sebelumnya sebagai riwayat.

## Memasang kunci di Vercel

1. Buka [Google AI Studio — API keys](https://aistudio.google.com/app/apikey), masuk dengan akun Google, lalu buat kunci API untuk proyek Anda. Periksa kuota dan ketentuan pemakaian proyek Google tersebut.
2. Buka proyek Vercel **asesmen-labs** → **Settings** → **Environment Variables**. Tambahkan `GOOGLE_AI_API_KEY` dengan nilai kunci tadi, tipe **Sensitive**, target **Production**. Tambahkan target **Preview** hanya jika ingin menguji di Preview dengan kunci yang sesuai.
3. Simpan, lalu lakukan **Redeploy** agar fungsi server memakai variabel baru. Nama variabel harus persis `GOOGLE_AI_API_KEY`; jangan memakai awalan `VITE_` dan jangan menaruh kunci di kode, Git, atau chat.
4. Uji dengan akun murid sintetis yang telah mencapai misi 15. Kirim jawaban, lalu pastikan status berubah menjadi **Dinilai Nara**, feedback muncul pada balon Nara dan rapor, serta guru dapat melihat alasan rubrik dan tombol **Koreksi**.

Model bawaan adalah `gemini-2.5-flash`. Jika perlu mengganti model yang tersedia untuk proyek Google Anda, tambahkan variabel server `GOOGLE_AI_MODEL` lalu redeploy. Hanya soal, rubrik, dan jawaban misi yang dikirim ke Google; nama asli, nama samaran, kelas, dan kredensial tidak dikirim dalam permintaan penilaian.

Jika kunci belum dipasang, kuota habis, atau layanan gagal, jawaban tetap tersimpan sebagai **Menunggu penilaian**. Murid dapat menekan **Periksa** untuk mencoba lagi dan guru tetap dapat menilai lewat rapor. Jangan menganggap skor AI sebagai bukti tunggal ketercapaian TP; guru dapat meninjau dan mengoreksinya.
