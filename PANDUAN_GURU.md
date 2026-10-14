# Panduan Guru — Ekspedisi Lima Pulau

Asesmen Informatika kelas X/Fase E yang dapat digunakan sebagai salah satu bukti sumatif setelah identitas dan hasil ditinjau guru. Ada 15 misi inti: 10 C3/AKM L2, 4 C4/L3, dan 1 C5/L3. Satu C6/L3 menjadi pengayaan opsional. Label kognitif adalah rancangan instrumen, bukan hasil validasi psikometrik.

| Pulau | Materi yang dihubungkan | Misi dan level |
|---|---|---|
| Pelabuhan Data | Pertemuan 4: variabel, tipe data, list | Daftarkan Kargo C3; Atur Rak C3; Siapkan Keberangkatan C3 |
| Gerbang Alur | Pertemuan 3: flowchart | Bangun Jalur C3; Jalankan Gerbang C3; Perbaiki Batas C4 |
| Bengkel Logika | Pertemuan 3: pseudocode | Rakit Pengendali C3; Atur Pengiriman C3; Lacak Gangguan C4 |
| Pusat Mesin | Pertemuan 8: arsitektur Von Neumann | Hubungkan Sistem C3; Jalankan Perhitungan C3; Alamat atau Isi? C4 |
| Pulau Program, lokasi Menara Awan | Pertemuan 9: Python dan evaluasi solusi | Pulihkan Pengolah Nilai C3; Perbaiki Daftar C4; Pilih Solusi Terbaik C5 |
| Ruang Arsitek di dalam Menara Awan | Integrasi variabel, tipe data, perhitungan, percabangan, dan pengujian | Rancang Pemeriksa Keberangkatan C6, pengayaan |

## Nilai inti dan pengayaan

- Setiap misi inti berbobot sama. Rapor/leaderboard memakai rata-rata **nilai terbaik** dari 15 misi yang sudah dinilai. Belum lengkap berarti belum ada nilai inti, bukan nol.
- Misi objektif menggunakan proporsi bukti benar. Analisis C4 berbobot sebab 30, perbaikan 40, dan pengujian 30. Pada Perbaiki Daftar, kode bernilai 40, sebab 30, dan prediksi uji 30.
- **Nilai kompetensi misi** berasal dari ketepatan jawaban terbaik atau rubrik karya tertulis terbaik. Nilai akhir adalah rata-rata nilai 15 misi, setara dengan rata-rata lima nilai pulau. Petunjuk, percobaan, kesalahan, waktu, dan Ulang tidak mengurangi nilai kompetensi.
- **Skor permainan** adalah informasi proses: 60% ketepatan + 10% petunjuk + 10% percobaan + 10% kesalahan + 10% waktu aktif. Petunjuk pertama, Coba pertama, Bersihkan pertama, dan Ulang pertama gratis. Petunjuk berikutnya mengurangi 1 poin skor permainan per penggunaan; Ulang berikutnya mengurangi 1 poin skor permainan misi per pengulangan. Komponen dibatasi 0–100.
- Coba menghitung satu percobaan. Kirim tanpa perubahan setelah Coba tidak dihitung ulang. Panduan umum Nara tidak dihitung sebagai Petunjuk.
- Acuan waktu: C3 180 detik, C4 300, C5 600, C6 900; ditambah 30 detik per isian terstruktur. Komponen waktu tetap 100 sampai acuan terlewati, lalu turun linier menjadi 0 pada tiga kali acuan. Waktu hanya saat misi aktif; tab tersembunyi dan menunggu guru tidak dihitung.
- Bos terbuka hanya setelah 15 misi dinilai dan rata-rata mentah **≥90**. Angka tepat 90 membuka bos. Nilai tampilan dibulatkan dua desimal, tetapi penguncian memakai nilai sebelum pembulatan.
- Bos opsional. Nilainya terpisah dari nilai inti, kompetensi inti, dan leaderboard, termasuk bila memperoleh 0.

## Menilai C5 dan C6

Jika `GOOGLE_API_KEY` terpasang, Nara (Google Gemini) menilai karya yang dikirim berdasarkan rubrik, bukti dalam jawaban, dan panduan penilai. Model memberikan alasan untuk setiap kriteria serta feedback hangat kepada murid. Nilai divalidasi oleh server dan tersimpan tanpa menunggu guru. Lihat [cara memasang kunci](GOOGLE_AI.md).

Masuk lewat **Guru**, cari peserta, lalu **Buka rapor**. Penilaian Nara (AI) menampilkan skor dan alasan per kriteria; gunakan **Koreksi** bila keputusan perlu diubah. Keputusan AI sebelumnya tetap tersimpan dalam riwayat. Jika layanan AI gagal, karya tetap berstatus **Menunggu penilaian** dan guru dapat mengisi rubrik secara manual. Penilaian tidak ditentukan berdasarkan kata kunci atau panjang teks saja.

**C5:** keputusan sesuai kriteria 30; bukti perbandingan tiga pengujian 40; alasan dan pertimbangan 30. Periksa hasil untuk lima nilai, tiga nilai, dan list kosong. Terima pertimbangan alternatif yang akurat dan didukung bukti.

**C6 — Rancang Pemeriksa Keberangkatan:** murid merancang pemeriksa pengiriman dari materi yang sudah dipelajari. Aturan disajikan terpisah, empat data uji tersedia dalam tabel, dan jawaban dipandu dalam empat bagian. Tidak perlu membuat aplikasi atau tampilan. Pengayaan berupa memilih cara menyampaikan alasan ketika beberapa syarat gagal, lalu menjelaskan manfaatnya.

- Rancangan data 30: empat masukan beserta tipe yang sesuai (20), keluaran kebutuhan energi, keputusan, alasan penundaan, dan pesan data tidak valid (10).
- Solusi 35: memeriksa ketiga angka negatif sebelum menghitung/menentukan keputusan (15), menghitung dan menampilkan kebutuhan energi (10), keputusan serta alasan memenuhi semua aturan dan batas inklusif (10).
- Pengujian 25: A (7), B (6), C (6), D (6). A membutuhkan 12 unit dan boleh berangkat tepat di batas; B membutuhkan 12 tetapi energi hanya 10; C membutuhkan 8 tetapi berat 11 dan belum disetujui; D tidak valid dan tidak diproses lebih lanjut.
- Penjelasan 10: alasan urutan langkah (3), penerimaan berat tepat 10 dan energi tepat cukup (4), pilihan pesan penundaan beserta manfaatnya (3).

Terima bahasa sendiri, pseudocode, atau Python yang logis dengan nilai setara. Beri nilai sebagian berdasarkan bukti yang benar. Murid boleh menampilkan semua alasan penundaan atau satu alasan utama yang benar; keduanya dapat memperoleh nilai penuh jika alasannya masuk akal. Nama variabel, urutan percabangan, dan alasan tidak harus sama dengan contoh solusi. Contoh solusi untuk AI disimpan di sisi server, bukan di metadata misi yang dikirim ke frontend. Nilai karya, bukan panjang tulisan. AI memberi feedback singkat dan sederhana; guru tetap dapat mengoreksi hasilnya.

Nilai AI dapat dikoreksi sekali menjadi keputusan guru. Peserta dapat membuat percobaan baru setelah karya dinilai. Semua percobaan dan umpan balik tetap menjadi bukti; nilai kompetensi terbaik dipakai dalam rekap.

## Interpretasi dan batas

Misi menggunakan konfigurasi terstruktur, pratinjau rak/diagram/RAM, dan interpreter Python terbatas untuk list satu dimensi, assignment, sum, len, append, pop, print, serta aritmetika. Interpreter bukan Python lengkap; tidak mendukung import, perulangan, atau akses sistem. Karya C6 dinilai melalui rubrik oleh AI atau guru dan tidak dieksekusi oleh interpreter.

Gunakan bersama observasi guru. Pengulangan dan bantuan merupakan bagian pembelajaran; nilai terbaik menggambarkan hasil terbaik beserta proses pengerjaannya. Pemilihan jenis data dan unit mesin memakai pilihan terstruktur, sehingga bukti kinerja perlu dilengkapi praktik langsung bila diperlukan.

Dashboard hanya memuat data tersinkron. Identitas nama + alias bukan autentikasi dengan rahasia. Versi lama tetap dipertahankan dengan ID/rumus lama, tidak dihitung sebagai penyelesaian versi lima pulau. Kalibrasi waktu hanya berlaku pada sesi baru **versi lama**. Lihat [panduan versi lama](docs/legacy/PANDUAN_GURU_V1.md) bila memeriksa arsip.

Sesi lima pulau yang sudah tersimpan dihitung ulang dari bukti event saat dibaca, dengan riwayat jawaban dan waktu penyelesaian tetap dipertahankan.

## Akun guru

Akun produksi dibuat administrator melalui `npm run teacher:create` setelah `DATABASE_URL` dikonfigurasi. Tidak ada akun guru bawaan untuk produksi. Akun `guru` dengan kata sandi `test-password-only` hanya tersedia pada server pengujian `node tests/server.js` dan datanya sementara.

## Kebijakan indikator (sesi baru)

Rapor Kemampuan menampilkan hasil per indikator, bukti jawaban, status penilaian, dan kaitan TP. Nilai lama ada dalam Arsip nilai lama. Indikator pendukung/sebagian tidak menyatakan seluruh TP tuntas. Tingkat 1 perlu latihan, 2 mulai berkembang, 3 memenuhi pada kasus ini, 4 menerapkan pada kasus baru. Belum cukup bukti tidak sama dengan nilai nol.

Di Ruang Guru, pilih kelas untuk melihat jumlah murid pada kelompok eksklusif: memenuhi mandiri, perlu penguatan, berhasil dengan bantuan, belum cukup bukti, dan menunggu penilaian/tinjauan. Murid yang belum mengerjakan tetap masuk denominator kelas. Pencarian nama/opsi inti selesai menyaring tabel akun; rekap indikator memakai seluruh kelas yang dipilih. Klik kelompok lalu Buka untuk meninjau jawaban, bantuan dan rincian penilai. Ambang default 3/4 dapat diubah melalui Simpan Ambang; perubahan tersimpan dengan versi dan tidak mengubah bukti asli.

Koreksi indikator melalui form Tinjauan indikator. Pilih tingkat atau Belum cukup bukti, tulis alasan dan feedback maksimal 400 karakter. Centang verifikasi mandiri hanya setelah memeriksa kemampuan murid secara langsung. Keputusan guru menjadi hasil berlaku dan hasil sebelumnya tetap tersimpan. Ekspor Indikator memuat jumlah dan daftar murid tiap kelompok.

Setiap misi selesai memberi 100 XP sekali. Ulang, petunjuk, kesalahan dan waktu tidak memotong XP. Bos dibuka setelah 15 aktivitas inti selesai; Pengayaan tidak memberi tambahan XP. XP bukan nilai kemampuan. Jawaban setelah Coba/petunjuk atau mengulang kasus yang telah dilihat menjadi latihan; Uji Mandiri memakai kasus baru. Petunjuk selama Uji Mandiri mengubah hasilnya menjadi latihan berbantuan. Bukti mandiri terbaru yang valid dipakai, bukan rata-rata semua percobaan; riwayat tetap dapat diperiksa. Awasi pemeriksaan mandiri di kelas karena aplikasi tidak dapat membuktikan tidak adanya bantuan di luar aplikasi.

Kasus transfer saat ini satu versi terkurasi per misi. Mengulangi kasus transfer yang sudah dicoba atau diberi petunjuk dicatat sebagai latihan, bukan bukti mandiri baru. Guru dapat memberi kasus lain dan mencatat hasil observasi mandiri lewat koreksi. Ini mencegah penguasaan semu dari menyalin jawaban pada kasus yang sama.

## Peringkat permainan saat asesmen indikator

Peringkat peserta yang menyelesaikan 15 misi inti diurutkan berdasarkan total waktu aktif paling singkat, petunjuk tercatat paling sedikit, percobaan paling sedikit, lalu waktu selesai lebih awal. Jika keempatnya sama, peringkat seri; nama samaran hanya mengatur urutan tampilan pada seri. Waktu, petunjuk, dan percobaan dihitung dari penyelesaian pertama setiap misi inti. Latihan ulang sesudahnya tidak mengubah ukuran waktu/petunjuk/percobaan. Peserta yang menyelesaikan pengayaan tampil dalam kategori Sepuh di atas peringkat bernomor. Data waktu yang tidak tersedia tidak dianggap nol.

Badge **Sepuh** diberikan setelah aktivitas pengayaan selesai dan menggantikan angka pada kolom peringkat. Sepuh tidak menggunakan nomor; peserta lainnya mulai dari peringkat 1. Tidak ada bonus XP pengayaan. Badge ini menunjukkan penyelesaian aktivitas, bukan keputusan ketuntasan kompetensi. XP, jawaban, nilai indikator, dan keputusan guru tidak diubah oleh pengurutan peringkat.
