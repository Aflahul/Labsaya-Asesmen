# Audit keterbacaan dan UX — 10 Oktober 2026

Lingkup: kode versi lima pulau yang digabungkan melalui PR #1. Pemeriksaan kode mencakup 15 misi inti, bos, tampilan aktivitas, evaluator, dan progres. Temuan kode bukan hasil uji pemahaman langsung dengan murid. Dokumen ini merupakan rekomendasi; perubahan berikut belum diterapkan.

## Prioritas utama

1. Diagram Bangun Jalur menampilkan jawaban benar sebelum pilihan diisi. Gunakan placeholder untuk langkah, kondisi, dan keluaran yang belum dipilih.
2. Diagram Perbaiki Batas mula-mula memakai ≥, sedangkan soal menyebut bug >. Tampilkan kondisi awal > dan tandai pratinjau setelah operator diubah.
3. Pesan Koneksi dipulihkan muncul pada setiap percobaan selesai, termasuk skor rendah. Pisahkan status terkirim, dinilai, dan ketepatan jawaban. Selesai tidak berarti semua benar.
4. Instruksi umum menyuruh Uji dulu pada C5/C6 yang tidak memiliki tombol Uji. Jelaskan penelusuran manual untuk C5 dan rancangan kasus uji untuk C6.
5. Uji solusi dan Kirim jawaban belum cukup dibedakan. Urutkan Uji → perbaiki → Kirim. Jelaskan bahwa Uji tidak mengakhiri percobaan, sedangkan Kirim mengakhiri percobaan dan merekam nilai; nilai terbaik tetap digunakan.
6. Setiap perubahan select merender ulang halaman misi. Pertahankan fokus keyboard pada kontrol yang sama; verifikasi dengan keyboard dan pembaca layar.
7. Umpan balik jawaban kosong tidak menunjuk kolom. Sebutkan label kolom dan arahkan fokus ke kolom pertama yang belum lengkap.
8. Hasil print angka tunggal ditampilkan sebagai array output, misalnya target 80 dan output [80]. Tampilkan tiap baris keluaran tanpa pembungkus internal evaluator.

## Pola instruksi

Tujuan (satu kalimat), Data dan aturan, Langkahmu (maksimal tiga langkah), Bukti yang dikirim, lalu Cara selesai. Gunakan kata kerja konkret: pilih, hitung, ubah, bandingkan, tuliskan. Istilah tracing dijelaskan sebagai menelusuri nilai setiap langkah; assignment sebagai pemberian nilai; akumulator sebagai tempat hasil sementara. Label C3–C6/AKM cukup berada dalam detail penilaian, bukan informasi pertama murid.

## Audit semua misi

| Misi | Bukti kerja dan perbaikan instruksi |
|---|---|
| Daftarkan Kargo | Pilih tipe/nilai untuk empat data sesuai syarat. Jelaskan tidak perlu mengetik nomor telepon. Perkuat penerapan melalui akibat salah memilih tipe, bukan identifikasi istilah saja. |
| Atur Rak | Pilih indeks dan tiga operasi berurutan; amati rak hasilnya. Hapus frasa memilih hasil karena tidak ada isian hasil terpisah. |
| Siapkan Keberangkatan | Tentukan Berangkat/Tunda untuk empat data perjalanan; semua syarat wajib terpenuhi. Hilangkan energi 20 pada pengantar yang rancu dengan energi tiap kasus. |
| Bangun Jalur | Pilih lima bagian diagram; pratinjau mengikuti pilihan. Jangan tampilkan jawaban sebelum murid mengisi. |
| Jalankan Gerbang | Telusuri kondisi untuk tiga pasangan stok/pesanan, lalu pilih cabang dan keluaran. Jelaskan simbol ≥ berarti lebih besar atau sama dengan. |
| Perbaiki Batas | Temukan penyebab penolakan, ubah operator, prediksi tiga hasil setelah perbaikan. Diagram awal harus menunjukkan bug yang sama dengan soal. |
| Rakit Pengendali | Susun tiga baris, kemudian hitung keluaran untuk dua masukan. Jelaskan x adalah jumlah paket dan y kebutuhan energi. |
| Atur Pengiriman | Tentukan kondisi dan tiga biaya. Cuplikan sudah memuat jawaban kondisi; kosongkan bagian yang memang dinilai. Beri satuan jarak/biaya yang konsisten. |
| Lacak Gangguan | Pilih penyebab, urutan perbaikan, dan dua keluaran. Terangkan pemberian nilai sebelum meminta analisis urutan. |
| Hubungkan Sistem | Identifikasi unit pada alur penjumlahan. Bentuk sekarang masih dominan mengingat fungsi perangkat; untuk bukti C3, minta penerapan alur pada situasi baru. |
| Jalankan Perhitungan | Telusuri empat instruksi berurutan; isi nilai setelah tiap instruksi. Bedakan alamat, isi RAM, dan hasil sementara secara visual. |
| Alamat atau Isi? | Jelaskan penyebab, pilih data yang dihitung, lalu prediksi setelah satu isi RAM berubah. Labeli diagram sebagai data awal agar tidak bertentangan dengan kasus perubahan. |
| Pulihkan Pengolah Nilai | Perbaiki kode rata-rata, jalankan uji, periksa keluaran, lalu kirim. Jelaskan pengujian memakai beberapa daftar nilai, bukan hanya daftar awal. |
| Perbaiki Daftar | Pilih penyebab, edit kode, prediksi elemen, kemudian uji. Jelaskan barang pertama harus tetap dipertahankan ketika data uji berubah. |
| Pilih Solusi Terbaik | Telusuri A/B secara manual untuk tiga daftar, catat hasil, pilih dan beri alasan. Tidak ada eksekutor untuk cuplikan ini; jelaskan sebagai pseudocode. Guru menilai dengan rubrik. |
| Bos: Ruang Arsitek | Susun data, algoritma, minimal tiga kasus uji beserta hasil harapan, dan alasan. Tegaskan perlakuan stok kurang/input tidak valid, termasuk aturan sisa stok. Guru menilai; hasil terpisah dari nilai inti. |

## Visual dan interaksi

- Instruksi saat ini 14 px dan sejumlah teks pendukung 10–13 px. Prioritaskan ukuran sekitar 16 px untuk instruksi inti, jarak baris memadai, serta panel solid di atas ilustrasi. Kontras perlu diukur; tidak disimpulkan lulus/gagal hanya dari kode ukuran.
- Peta sebaiknya menonjolkan pulau aktif dan tombol Lanjutkan misi. Tunjukkan alasan pulau terkunci dekat kontrolnya.
- Pada ponsel, pemilihan pulau menggulir ke daftar misi. Tambahkan perpindahan fokus/penanda judul yang sesuai agar perubahan konteks jelas.
- Animasi keberhasilan hanya setelah bukti sesuai; pengiriman dengan skor parsial tetap mendapat respons netral dan dukungan mencoba lagi.
- Jangan memakai timer sebagai penekanan utama. Pertahankan informasi bahwa waktu, petunjuk, dan pengujian tidak mengurangi nilai.

## Validitas asesmen

Metadata memenuhi komposisi 10 C3/L2, 4 C4/L3, 1 C5/L3, dan 1 C6/L3 opsional. Namun label Bloom tidak otomatis membuktikan level AKM. Khusus Daftarkan Kargo dan Hubungkan Sistem perlu diperkuat penerapannya; sejumlah pengecoh C4 terlalu mudah dieliminasi. Gunakan miskonsepsi yang masuk akal dan pertahankan bukti prediksi/pengujian. Interpretasikan skor terbaik setelah uji berulang sebagai penguasaan setelah umpan balik, bukan kemampuan awal tanpa bantuan.

Kode progres memakai rata-rata nilai terbaik seluruh 15 misi yang sudah dinilai, secara ketat >95. Bos tidak masuk nilai inti. Nilai C5 yang masih menunggu guru membuat nilai inti belum lengkap; hal ini perlu dijelaskan pada status murid.

## Kriteria verifikasi perbaikan

Uji keyboard dan ponsel; diagram awal harus selaras dengan soal; kontrol kosong tidak membocorkan jawaban; instruksi C5/C6 tidak meminta tombol yang tidak ada; hasil uji cocok dengan format keluaran program; skor parsial tidak disebut semua benar. Uji pemahaman singkat dengan murid kelas 10 diperlukan untuk memastikan mereka dapat menyebut tujuan, tindakan pertama, dan bukti penyelesaian tanpa penjelasan tambahan guru.

## Tindak lanjut implementasi

Perbaikan diterapkan pada cabang UX setelah audit: panduan Nara khusus untuk semua 16 misi, bahasa instruksi/label lebih sederhana, diagram awal tanpa jawaban, operator bug yang konsisten, kondisi pseudocode mengikuti pilihan, petunjuk per misi, format hasil print, umpan balik skor parsial dan bagian kosong, serta pemulihan fokus select. Nilai opsi yang tersimpan dipertahankan agar sesi lama tetap kompatibel.

Panel misi menggunakan latar gelap dengan opacity 78% dan blur ringan; kolom jawaban tetap pekat. Animasi masuk pulau 3 detik, antarpulau 4,2 detik, antarmisi 0,9 detik, bos 2,2 detik; semuanya bisa dilewati. Setelah animasi, pengarahan tetap tampil sampai murid memilih Mulai misi saat siap. Pengurangan gerak tetap menampilkan pengarahan tanpa menunggu animasi. Waktu asesmen baru berjalan setelah misi dibuka.

Ukuran teks pendukung beranda ditingkatkan, pendaftaran diberi konteks dan contoh absen, serta penjelasan akses akun dipindah sebelum tombol. Beranda tetap memakai satu pulau sebagai ilustrasi pembuka; kelima pulau terlihat pada peta. Penguatan validitas konstruk C3/C4 dan pengujian langsung bersama murid tetap merupakan tindak lanjut pedagogis, bukan klaim bahwa label level sudah tervalidasi.

## Koreksi interaksi — 11 Oktober 2026 (WIB)

Arahan Nara dipindahkan keluar dari panel soal menjadi toast mengambang. Murid membaca percakapan bertahap (tujuan, langkah, catatan), dapat menutupnya, lalu membuka kembali lewat tombol Nara. Petunjuk dan hasil pengujian juga menggunakan toast tersebut; tidak ada batas waktu baca otomatis. Avatar bergerak ringan, mengikuti pengaturan reduced motion. Kolom jawaban tidak kehilangan nilainya saat toast dibuka/ditutup.

Memilih ilustrasi atau label pulau menampilkan tombol Masuk pulau di pulau itu sendiri. Tombol menuju misi pertama yang belum selesai, atau misi pertama untuk mengulang bila semua sudah selesai. Pulau terkunci menampilkan syarat pembukaannya di lokasi yang sama. Pemilihan tidak lagi menggulir ke panel samping; daftar misi lama tetap tersedia sebagai pilihan langsung. Animasi mengambang diterapkan pada gambar, bukan area klik.

Masuk pulau dari peta hanya memakai pendekatan pulau selama 3 detik, tanpa kapal. Perjalanan antarpulau terdiri dari kapal melintas 2,2 detik, lalu pulau mendekat 2 detik. Kedua lapisan tidak ditampilkan bersamaan. Melewati atau membatalkan perjalanan membersihkan timer kedua fase. Pengarahan sebelum misi tetap menunggu tindakan murid.

### Label tombol singkat

Tombol aksi memakai satu kata: Daftar, Masuk, Mulai, Coba, Kirim, Lanjut, Ulang, Bersihkan, Nara, Panduan, Catatan, Mengerti, Peta, Rapor, Buka, Periksa, Rekap, Cadangan, Pulihkan, Unduh, Segarkan, Simpan. Nama pulau/identitas game maksimal dua kata; judul misi dan progres ditempatkan di luar tombol. Instruksi Nara mengikuti label Coba/Kirim yang terlihat. Keterangan fungsi unduhan ditulis di teks pendamping, bukan jargon pada tombol. Nama aksesibel dapat lebih deskriptif untuk pembaca layar tanpa memperpanjang label visual.
