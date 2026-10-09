# Panduan Guru — Pulau Logika MVP

## Tujuan dan pemetaan

Asesmen formatif berbasis tindakan bagi Informatika kelas X SMK Fase E. Pemulihan dunia menjadi konteks masalah, bukan sekadar dekorasi kuis. Ada 16 misi inti dan dua pengayaan. Kode berikut adalah kode bukti **internal aplikasi**, bukan pengganti kode TP kurikulum resmi.

| Pulau | Kompetensi / bukti | Misi |
|---|---|---|
| Pecahan | CT.DEC.1–2: cakupan dan pemecahan masalah | Bongkar Misi Pameran; Aliran Air |
| Ritme | CT.PAT.1–2: pola berulang dan berkelompok | Gerbang Tiga Simbol; Sinyal Mercusuar |
| Kabut | CT.ABS.1–2: pemilahan informasi esensial | Peta Drone Penolong; Bekal Perahu Langit |
| Puncak | CT.ALG.1–2: prasyarat langkah dan tracing arah | Portal Karya; Robot Penjaga |
| Alur | FC.1–2: simbol, urutan dan cabang keputusan | Rakit Gerbang Alur; Perbaiki Cabang |
| Mesin | PC.1–2: rancangan dan perbaikan berdasarkan tes | Rakit Pseudocode; Perbaiki Program |
| Sirkuit | VN.1–2: komponen dan fetch/decode/execute | Pasang Komponen; Hidupkan CPU |
| Gudang | ARR.1–2: operasi dan indeks list/array | Editor List Kargo; Alamat Kargo |
| Indeks | ENR.SORT.1–2: pengayaan Bubble Sort | Gelembungkan Nomor; Urutkan Kargo Baru |

List/array menggunakan indeks 0. CPU sederhana memproses LOAD 4, ADD 3, OUTPUT; PC, IR, accumulator dan keluaran ditampilkan. Pengurutan memeriksa setiap pasangan sesuai lintasan Bubble Sort. Flowchart memakai konstruksi terbatas dengan urutan, simbol serta cabang Ya/Tidak; bukan editor diagram bebas. Pseudocode memakai interpreter blok terbatas, bukan JavaScript bebas.

## Penilaian

`Nilai = ROUND(0.40*K + 0.25*W + 0.20*P + 0.15*H)`.

- `K = CLAMP(ROUND(0.60*akurasiPertama + 40),0,100)` setelah berhasil. Akurasi pemeriksaan pertama tidak berubah setelah koreksi/ulang.
- `Patokan = MAX(45,30+12*jumlahElemen) × pengaliGuru` detik. Default pengali 1.
- `W = CLAMP(ROUND(100*(1-MAX(0,waktuAktif-Patokan)/(2*Patokan))),0,100)`.
- `P = CLAMP(100-25*MAX(0,percobaan-1)-12*ulangManual,0,100)`.
- `H = CLAMP(100-40*petunjuk,0,100)`.

Contoh: K/W/P/H 100/100/100/100 → 100; 100/80/75/60 → 84. Satu petunjuk H=60. Kecepatan bernilai 100 sampai patokan, 0 ketika mencapai tiga kali patokan.

Pada tugas susunan, akurasi pertama adalah proporsi unit yang benar di pemeriksaan pertama. Pada robot/CPU/Bubble Sort, bila terjadi kesalahan langkah sebelum pemeriksaan, gunakan proporsi langkah benar sebelum kesalahan pertama terhadap panjang solusi kanonis (dibatasi 0–100). Setelah dibekukan, akurasi tidak berubah. Jejak ini merupakan pendekatan operasional, bukan instrumen psikometrik tervalidasi.

Menyusun objek tidak dihitung sebagai percobaan. Periksa jawaban menghitung satu percobaan; kesalahan operasi domain tetap dicatat. Reset papan menambah ulang manual tanpa menghapus waktu, kesalahan, atau akurasi pertama. Replay setelah selesai membuat sesi baru. Timer berjalan ketika tugas dapat dioperasikan dan tab terlihat; animasi/dialog yang memblokir tugas tidak dihitung. Checkpoint lokal berkala dapat kehilangan paling banyak interval terakhir bila proses browser dihentikan paksa.

## Membaca hasil dan halaman guru

Masuk lewat **Guru** menggunakan username/password pengelola. Dashboard menampilkan peserta, filter kelas/nama/ketuntasan, progres dan nilai. Buka rapor peserta untuk detail 18 misi, komponen skor, waktu, percobaan, kesalahan, ulang, petunjuk, keadaan akhir dan jejak tindakan.

Nilai inti = rata-rata sederhana nilai terbaru 16 misi, hanya muncul setelah seluruh inti selesai. Kompetensi = rata-rata dua misi; bila belum lengkap, tampil belum lengkap. Pengayaan tidak memengaruhi nilai inti atau leaderboard. Nilai sama mendapat peringkat sama. Nilai terbaik ditandai pada sesi asal; metrik kumulatif seluruh sesi tidak dicampur sebagai metrik sesi terbaik.

Ketepatan K ditampilkan terpisah. Peserta yang berhasil dengan bantuan dan koreksi masih mempunyai bukti penyelesaian; kebutuhan penguatan dibaca melalui riwayat. Hindari label tidak mampu/cerdas/lemah berdasarkan satu skor atau kecepatan. Misi belum selesai berarti bukti belum lengkap, bukan nilai nol.

**Ekspor rekap CSV** mengikuti filter dashboard. Rapor peserta menyediakan CSV per misi dan JSON seluruh sesi/tindakan. CSV menggunakan UTF-8 BOM dan perlindungan formula spreadsheet. JSON berisi identitas pribadi; simpan sesuai kebijakan sekolah dan bagikan hanya kepada pihak berwenang. Ekspor tidak mengubah progres. Kalibrasi pengali waktu 0,5–3 pada dashboard hanya berlaku untuk sesi baru dan tidak mengubah riwayat.

## Batas dan rekomendasi

Gunakan untuk asesmen formatif bersama observasi guru. Jawaban teks bebas, alasan mendalam, kolaborasi, demonstrasi perangkat nyata, serta materi di luar delapan kompetensi inti belum dinilai. Nama asli + alias bukan faktor rahasia, sehingga identitas peserta tidak dapat dijamin seperti autentikasi password. Data offline/waktu klien dapat dimanipulasi meskipun server menghitung ulang rumus dan memeriksa tindakan. Jangan menggunakannya sebagai satu-satunya dasar penilaian berisiko tinggi.

Dashboard hanya melihat data tersinkron; meminta peserta memeriksa status sinkronisasi membantu mencegah interpretasi data parsial. Pengelolaan guru saat ini satu instalasi sekolah; tidak ada multisekolah, edit nilai, hapus akun, atau reset peserta melalui dashboard.

Jika satu sesi dimainkan bersamaan di dua perangkat dan tindakannya berbeda, versi server menjadi progres aktif; bukti lokal yang berbeda tetap dicadangkan sebagai konflik di ekspor JSON dan status konflik ditampilkan. Bukti konflik tidak diam-diam dicampur menjadi nilai. Peserta dapat melanjutkan keadaan server atau memainkan ulang, dan guru dapat memeriksa cadangan konflik. Dianjurkan satu perangkat aktif per akun pada satu waktu.

Menekan **Jalankan tes program** atau **Uji diagram** adalah percobaan penilaian: hasil salah membekukan akurasi pertama dan mencatat kesalahan; hasil benar menyelesaikan tugas langsung. Pemeriksaan ulang setelah sukses tidak menambah percobaan.
