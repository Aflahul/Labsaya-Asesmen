# Mengaktifkan penilaian Nara (AI)

Misi 15 (*Pilih Solusi Terbaik*) dan bos (*Ruang Arsitek*) menggunakan rubrik yang sudah ditentukan. Saat murid menekan **Kirim**, server menyimpan jawaban, meminta Google Gemini menilai tiap kriteria, memvalidasi rentang nilainya, lalu menyimpan nilai dan feedback. Nara menyampaikan feedback itu kepada murid. Guru dapat melihat jawaban, alasan per kriteria, dan mengoreksi nilai AI di rapor. Koreksi menyimpan keputusan AI sebelumnya sebagai riwayat.

## Memasang kunci di Vercel

1. Buka [Google AI Studio — API keys](https://aistudio.google.com/app/apikey), masuk dengan akun Google, lalu buat kunci API untuk proyek Anda. Periksa kuota dan ketentuan pemakaian proyek Google tersebut.
2. Buka proyek Vercel **asesmen-labs** → **Settings** → **Environment Variables**. Tambahkan `GOOGLE_API_KEY` dengan nilai kunci tadi, tipe **Secret**, target **Production**. Tambahkan target **Preview** hanya jika ingin menguji di Preview dengan kunci yang sesuai.
3. Simpan, lalu lakukan **Redeploy** agar fungsi server memakai variabel baru. Nama variabel harus persis `GOOGLE_API_KEY`; jangan memakai awalan `VITE_` dan jangan menaruh kunci di kode, Git, atau chat.
4. Uji dengan akun murid sintetis yang telah mencapai misi 15. Kirim jawaban, lalu pastikan status berubah menjadi **Dinilai Nara**, feedback muncul pada balon Nara dan rapor, serta guru dapat melihat alasan rubrik dan tombol **Koreksi**.

Model bawaan adalah `gemini-flash-latest`, mengikuti contoh terbaru SDK resmi Google. Jika perlu mengganti model yang tersedia untuk proyek Google Anda, tambahkan variabel server `GOOGLE_AI_MODEL` lalu redeploy. Hanya soal, rubrik, dan jawaban misi yang dikirim ke Google; nama asli, nama samaran, kelas, dan kredensial tidak dikirim dalam permintaan penilaian.

Jika kunci belum dipasang, kuota habis, atau layanan gagal, jawaban tetap tersimpan sebagai **Menunggu penilaian**. Murid dapat menekan **Periksa** untuk mencoba lagi dan guru tetap dapat menilai lewat rapor. Jangan menganggap skor AI sebagai bukti tunggal ketercapaian TP; guru dapat meninjau dan mengoreksinya.

## Memeriksa kuota dan kegagalan

Di Google AI Studio, buka **Rate Limit** dan pilih proyek yang digunakan oleh API key. Cari model Flash yang digunakan oleh alias `gemini-flash-latest` (atau model yang disetel di `GOOGLE_AI_MODEL`), lalu periksa batas dan pemakaian permintaan/token. Batas nol atau jatah yang habis dapat menolak permintaan; pembuatan API key tidak menjamin kuota tersedia. Billing dipertimbangkan hanya jika model atau kuota yang diperlukan tidak tersedia pada paket saat ini.

Kode mengutamakan `GOOGLE_API_KEY` dan tetap mendukung `GOOGLE_AI_API_KEY` untuk konfigurasi lama. Setelah mengubah kunci atau model di Vercel, simpan dan deploy ulang Production.

Jika penilaian masih gagal, tekan **Periksa**, lalu buka **Vercel → Logs** untuk deployment Production tersebut. Cari `[AI_GRADING_FAILURE]`. Log hanya berisi ID misi dan kode diagnostik, tanpa API key, identitas murid, atau jawaban. `KEY_MISSING` berarti kunci tidak terbaca; `GOOGLE_HTTP_429` menunjukkan penolakan terkait batas/kuota; `GOOGLE_HTTP_404` memerlukan pemeriksaan nama/ketersediaan model; `GOOGLE_HTTP_400`/`403` memerlukan pemeriksaan kunci, pembatasan API, atau format permintaan. Jika tersedia, `reason` dari Google yang sudah disaring menjelaskan kegagalan lebih spesifik. `TIMEOUT`, `NETWORK_ERROR`, dan `RESPONSE_INVALID` menunjukkan kegagalan waktu, koneksi, atau format penilaian. Jangan membagikan kunci atau jawaban murid saat mengirim log.

Jika permintaan menghasilkan `GOOGLE_HTTP_404`, periksa nilai `GOOGLE_AI_MODEL`: nama model harus merupakan ID API yang mendukung `generateContent`, bukan nama tampilan pada tabel kuota. Hapus override yang tidak tersedia agar memakai alias bawaan, atau isi `gemini-flash-latest`, simpan, lalu deploy ulang. Tabel Rate Limit menunjukkan batas/pemakaian, bukan hasil uji ketersediaan endpoint. Contoh alias resmi: https://github.com/googleapis/python-genai#generate-content.
