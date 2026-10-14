# Penilaian indikator dan pesan Gemini

Penilaian baru `indicator-v1` menggunakan Groq (`openai/gpt-oss-120b`) dan Google (`gemini-flash-latest`) secara paralel. OpenRouter dinonaktifkan dari alur penilaian baru dan fallback lama karena respons produksi belum konsisten. Variabel OpenRouter boleh tetap ada di Vercel; aplikasi tidak memakainya dalam alur tersebut.

Kunci server: `GROQ_API_KEY`, `GOOGLE_API_KEY` (alias `GOOGLE_AI_API_KEY` didukung). Model dapat diatur melalui `GROQ_AI_MODEL` dan `GOOGLE_AI_MODEL`. Jangan memakai awalan `VITE_` atau memasukkan kunci ke browser.

Kedua hasil sama: disepakati. Selisih satu tingkat: hasil sementara; selisih dua tingkat atau kecukupan bukti berbeda: tinjauan guru. Jika Groq terkena HTTP 429 (batas pemakaian) dan Gemini menghasilkan penilaian valid, Gemini menangani hasil kemampuan dan penyusunan pesan sepenuhnya. Hasil ini berstatus internal single, bukan kesepakatan dua penilai, dan dapat masuk rapor tanpa menunggu Groq. Alasan fallback dicatat untuk guru; murid hanya melihat hasil akhir. Kegagalan Groq lainnya tetap menghasilkan status parsial jika hanya Gemini berhasil; jika Gemini juga gagal, tidak diberi nilai nol. Bukti, tingkat kemampuan, bantuan, dan koreksi guru tetap tersimpan. Tingkat 4 memerlukan penerapan mandiri pada kasus baru.

Setelah server memvalidasi ulang hasil, Gemini menyusun kesimpulan Nara (maksimal 400 karakter) dan satu kalimat per indikator (maksimal 160 karakter). Tahap ini tidak dapat mengubah tingkat atau kutipan bukti. Panel dan Nara memakai hasil penyusunan ini; murid tidak melihat nama model, pesan kegagalan layanan, kutipan mentah, atau perbedaan antarpenilai. Guru tetap dapat memeriksa rincian penilaian. Jika penyusunan pesan gagal, aplikasi memakai penjelasan Indonesia yang aman tanpa menghilangkan hasil kemampuan.

Setiap panggilan memiliki batas 45 detik, dengan lease 150 detik dan fungsi Vercel 180 detik. Gemini dipanggil untuk penilaian serta penyusunan pesan setiap pengiriman, sehingga penggunaan token/kuota bertambah. Retry penilai hanya mencoba layanan yang belum berhasil, maksimum dua kali. Penyusunan pesan tidak menimpa keputusan guru yang datang saat proses berjalan.

Uji lokal: `npm test`, `npm run build`, dan `TEST_INDICATOR_GRADER=1 npm run test:browser`. Fixture sintetis bukan bukti akurasi model nyata. Kalibrasi guru tetap diperlukan sebelum hasil dijadikan asesmen sumatif. Data historis tidak dinilai ulang otomatis.
