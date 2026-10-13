# Asesmen indikator, Nara, dan XP
Status: rancangan untuk tinjauan, belum diimplementasikan.

Tujuan: murid bebas mencoba ulang, memperoleh bantuan konkret dan hasil kemampuan per indikator; guru melihat kelompok murid yang perlu penguatan per indikator TP.

Kondisi terverifikasi di kode: tiga provider adalah Groq (default openai/gpt-oss-120b), OpenRouter (default nvidia/nemotron-3.5-lightning:free), Google (default gemini-flash-latest). Environment dapat mengganti model. Sekarang fallback berurutan dan hanya misi C5/C6 tertulis memakai AI. Batas feedback 250 karakter. Konfigurasi aktif production belum diperiksa.

Nara: maksimal 400 karakter Unicode termasuk spasi; 300–400 ketika bantuan membutuhkan penjelasan lebih panjang, tanpa panjang minimum. Sebut bukti nyata, satu masalah prioritas dan satu langkah konkret/pertanyaan kecil. Tidak memuji bukti yang tidak ada. Bantuan bertahap dan tercatat. Validasi panjang; pemotongan pada batas kalimat hanya perlindungan terakhir.

XP: 100 sekali per misi selesai; tidak dikurangi karena pengulangan, kesalahan, petunjuk atau durasi. Deduplikasi pencapaian di server. Penghargaan tantangan tambahan sekali per ID tantangan. XP tidak menyatakan ketuntasan kemampuan; penyelesaian aktivitas berbeda dengan status penilaian.

Rubrik: setiap misi mempunyai indikator ber-ID tetap, label murid, deskriptor 1–4, bukti dan pemetaan TP eksplisit. Tingkat 1 belum memenuhi, 2 sebagian, 3 memenuhi, 4 menerapkan pada variasi kasus. Belum cukup bukti berstatus terpisah tanpa skor buatan. Ambang awal tingkat 3, konfigurasi guru diberi versi. Bedakan pemetaan langsung, pendukung dan sebagian; prasyarat/pengayaan tidak dipaksakan menjadi bukti ketuntasan TP. Audit seluruh misi termasuk bos. Tampilkan rubrik sebelum mengerjakan.

Tiga penilai: panggil independen secara paralel untuk tiap submission asesmen misi, bukan setiap interaksi atau cek status. Deduplikasi fingerprint bukti/rubrik. Beri ketiganya rubrik yang sama, jawaban, hasil uji deterministik dan jejak tindakan relevan tanpa identitas/kredensial. Misi tanpa tulisan dinilai dari tindakan yang direkam; tidak mengarang alasan murid. Setiap penilai mengembalikan tingkat/status, referensi bukti yang diverifikasi server, alasan dan pesan Nara per hasil. Tiga hasil valid sepakat menjadi hasil sementara disepakati; selisih satu tingkat memakai median sementara dengan perbedaan terlihat guru. Selisih >=2, pertentangan bukti atau kecukupan bukti memerlukan tinjauan guru. Kurang dari tiga hasil valid berstatus parsial; semua gagal menunggu penilaian, tanpa nilai nol. Guru mengoreksi dengan riwayat audit. Pilih pesan yang sesuai hasil gabungan/prioritas; jika tidak tersedia gunakan template berbasis bukti, bukan panggilan keempat. Retry provider gagal dibatasi, idempoten dan mematuhi durasi fungsi. Pertahankan OpenRouter gratis. Gemini pada setiap submission menambah penggunaan dibanding fallback sekarang.

Penguasaan: simpan awal, perbaikan dan bantuan. Setelah bantuan substansial, soal variasi singkat yang dikurasi dan diberi versi memeriksa kemampuan mandiri. Latihan tetap bisa dilanjutkan walau nilai rendah. Ringkasan memakai bukti mandiri terbaru yang valid, bukan rata-rata semua percobaan. Keberhasilan dengan bantuan ditampilkan tersendiri; jangan klaim mandiri tanpa bukti. Cakupan bukti membatasi klaim TP.

UI: hasil murid memuat kemampuan, tingkat/status, bukti pendek dan langkah perbaikan; XP terpisah. Status parsial/menunggu jelas. Rapor guru menghitung kelompok eksklusif per indikator: memenuhi mandiri, perlu penguatan, berhasil berbantuan, belum cukup bukti, menunggu penilaian/tinjauan. Denominator daftar murid kelas termasuk belum mengerjakan. Drill-down jawaban, bantuan, ketiga review dan koreksi; ekspor sama.

Data: versi kebijakan, rubrik/misi, hasil indikator, tiga review, status konsensus, referensi bukti, bantuan dan pemeriksaan mandiri tersimpan. Data lama tetap arsip; jangan mengarang indikator dari total historis. XP kebijakan baru dihitung dari misi unik yang selesai; skor lama tetap arsip, label kebijakan jelas. Jangan menghilangkan jawaban/koreksi lama.

Verifikasi: jawaban kosong/tidak tahu, salah, benar dan instruksi berbahaya dalam jawaban; bukti tidak ada tidak diberi nilai/praise. Semua kombinasi kegagalan model, malformed response, konflik, retry, duplikasi dan koreksi. XP tetap setelah mengulang; bantuan vs mandiri; hitungan kelas/ekspor/arsip; Unicode <=400 dan mobile. Kalibrasi dengan sampel yang dinilai guru. Uji browser-API-data-rapor pada preview sebelum produksi.

Urutan implementasi: inventarisasi rubrik dan soal variasi seluruh misi; penyimpanan/orchestrator; UI Nara dan XP; rapor/ekspor/arsip; kalibrasi dan pengujian preview.
