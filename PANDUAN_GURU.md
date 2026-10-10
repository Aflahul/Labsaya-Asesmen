# Panduan Guru — Ekspedisi Lima Pulau

Asesmen formatif Informatika kelas X/Fase E. Ada 15 misi inti: 10 C3/AKM L2, 4 C4/L3, dan 1 C5/L3. Satu C6/L3 menjadi pengayaan opsional dalam scene tambahan. Label kognitif adalah rancangan instrumen, bukan hasil validasi psikometrik.

| Pulau | Materi yang dihubungkan | Misi dan level |
|---|---|---|
| Pelabuhan Data | Pertemuan 4: variabel, tipe data, list | Daftarkan Kargo C3; Atur Rak C3; Siapkan Keberangkatan C3 |
| Gerbang Alur | Pertemuan 3: flowchart | Bangun Jalur C3; Jalankan Gerbang C3; Perbaiki Batas C4 |
| Bengkel Logika | Pertemuan 3: pseudocode | Rakit Pengendali C3; Atur Pengiriman C3; Lacak Gangguan C4 |
| Pusat Mesin | Pertemuan 8: arsitektur Von Neumann | Hubungkan Sistem C3; Jalankan Perhitungan C3; Alamat atau Isi? C4 |
| Menara Program | Pertemuan 9: Python dan evaluasi solusi | Pulihkan Pengolah Nilai C3; Perbaiki Daftar C4; Pilih Solusi Terbaik C5 |
| Ruang Arsitek, scene di Menara Program | Integrasi rancangan data, algoritma, dan pengujian | Sistem distribusi bantuan C6, pengayaan |

## Nilai inti dan pengayaan

- Setiap misi inti berbobot sama. Rapor/leaderboard memakai rata-rata **nilai terbaik** dari 15 misi yang sudah dinilai. Belum lengkap berarti belum ada nilai inti, bukan nol.
- Misi objektif menggunakan proporsi bukti benar. Analisis C4 berbobot sebab 30, perbaikan 40, dan pengujian 30. Pada Perbaiki Daftar, kode bernilai 40, sebab 30, dan prediksi uji 30.
- Waktu, petunjuk, kesalahan kontrol, reset, dan jumlah pengujian dicatat tanpa penalti skor. **Uji solusi** tidak mengakhiri percobaan; **Kirim jawaban** mengakhirinya.
- Bos terbuka hanya setelah 15 misi dinilai dan rata-rata mentah **>95**. Angka tepat 95 tidak cukup. Nilai tampilan dibulatkan dua desimal, tetapi penguncian memakai nilai sebelum pembulatan.
- Bos opsional. Nilainya terpisah dari nilai inti, kompetensi inti, dan leaderboard, termasuk bila memperoleh 0.

## Menilai C5 dan C6

Masuk lewat **Guru**, cari peserta, lalu **Buka rapor**. Karya berstatus **Menunggu penilaian** menampilkan jawaban, panduan penilai, dan rubrik. Isi setiap skor serta umpan balik, lalu simpan. Penilaian tidak dilakukan otomatis berdasarkan kata kunci atau panjang teks. Setelah disimpan, peserta dapat memuat hasil melalui tombol pemeriksaan atau membuka ulang aplikasi.

**C5:** keputusan sesuai kriteria 30; bukti perbandingan tiga pengujian 40; alasan dan pertimbangan 30. Periksa hasil untuk lima nilai, tiga nilai, dan list kosong. Terima pertimbangan alternatif yang akurat dan didukung bukti.

**C6:** rancangan data 30; solusi 35; pengujian 25; penjelasan 10. Periksa kasus normal, stok sama dengan permintaan, stok kurang, dan input negatif. Pseudocode yang tepat setara dengan Python yang tepat. Nilai karya, bukan panjang tulisan.

Penilaian yang tersimpan tidak dapat diedit melalui UI saat ini. Peserta dapat membuat percobaan baru setelah karya dinilai. Semua percobaan dan umpan balik tetap menjadi bukti; nilai terbaik dipakai dalam rekap.

## Interpretasi dan batas

Misi menggunakan konfigurasi terstruktur, pratinjau rak/diagram/RAM, dan interpreter Python terbatas untuk list satu dimensi, assignment, sum, len, append, pop, print, serta aritmetika. Interpreter bukan Python lengkap; tidak mendukung import, perulangan, atau akses sistem. Karya C6 dinilai guru dan tidak dieksekusi oleh interpreter.

Gunakan bersama observasi guru. Pengulangan dan bantuan merupakan bagian pembelajaran; nilai terbaik menggambarkan capaian setelah latihan, bukan pengukuran tanpa bantuan. Pemilihan jenis data dan unit mesin memakai pilihan terstruktur, sehingga bukti kinerja perlu dilengkapi praktik langsung bila diperlukan.

Dashboard hanya memuat data tersinkron. Identitas nama + alias bukan autentikasi dengan rahasia. Versi lama tetap dipertahankan dengan ID/rumus lama, tidak dihitung sebagai penyelesaian versi lima pulau. Kalibrasi waktu hanya berlaku pada sesi baru **versi lama**. Lihat [panduan versi lama](docs/legacy/PANDUAN_GURU_V1.md) bila memeriksa arsip.
