# Audit instrumen asesmen: 15 misi inti

Status: pemetaan awal terhadap [ATP final 2026/2027](https://docs.google.com/document/d/1h9vQTKH05GAZZG-xcx4AEz4gEy6rQZEsBuruAmyqMUQ/edit) dan [KKTP final 2026/2027](https://docs.google.com/document/d/1ZlpIs5530ySTVL9ndcuc8hetEtjLzTFCr6faunnjZlk/edit), **belum** validasi empiris instrumen. Lingkup yang disetujui ialah materi yang sudah diajarkan: data/list, flowchart, pseudocode, model Von Neumann, dan dasar Python. Pengurutan dan sistem operasi berada di luar klaim nilai game ini.

KKTP final menetapkan status TP dari seluruh indikator esensial (skor 0–4), bukan rerata tugas. Skor tinggi di satu indikator tidak menutup indikator esensial lain yang belum terbukti. Karena game belum menilai seluruh BK.3 (stack/queue), BK.5, BK.6, atau BK.7, rapor game adalah **salah satu sumber bukti**, bukan putusan ketercapaian TP. Pemetaan parsial per misi dicatat di `src/shared/mission-alignment.js` dan ditampilkan pada rapor guru. ATP final menempatkan Python/list pada Pertemuan 10; metadata Menara Program diselaraskan.

## Keputusan yang sudah berlaku

- Lima pulau, tiga misi inti per pulau; nilai pulau adalah rerata tiga misi dan nilai akhir rerata lima pulau. Bos pengayaan terpisah dan terbuka bila kelima belas misi sudah dinilai dengan nilai akhir sebelum pembulatan ≥90.
- Nilai kompetensi misi memakai ketepatan jawaban terbaik atau rubrik guru terbaik, tanpa potongan proses. Nilai pulau adalah rata-rata tiga misi; nilai akhir adalah rata-rata lima pulau. Portal bos memakai nilai kompetensi sebelum pembulatan. Skor permainan tetap terpisah dan memakai sesi dengan skor permainan tertinggi, dikurangi satu poin per pengulangan. Rekap guru menampilkan kedua nilai beserta sumber sesinya.
- Murid dapat mendaftar sendiri dengan nama lengkap, kelas, nomor absen, nama samaran, dan kata sandi. Guru tetap dapat membuat akun dengan kata sandi acak atau mereset kata sandi. Nama lengkap, kelas, dan nomor absen pendaftaran mandiri perlu dicocokkan guru sebelum rapor dipakai sebagai nilai sumatif; leaderboard publik hanya memakai nama samaran.

## Temuan dan tindakan per misi

Kolom “bukti” merujuk tindakan yang benar-benar dinilai sekarang. Kaitan dengan TP/KKTP final adalah **parsial**; guru perlu memeriksa indikator esensial yang belum tercakup sebelum menetapkan status TP.

| Misi | Level saat ini | Bukti yang dinilai | Risiko validitas dan tindakan revisi |
| --- | --- | --- | --- |
| Daftarkan Kargo | C3 | Empat pilihan tipe data/nilai literal. | Sebagian besar dapat dijawab sebagai ingatan istilah. Tambah situasi data baru dan konsekuensi pilihan tipe yang keliru; tetap C3 sampai bukti penerapan jelas. |
| Atur Rak | C3 | Indeks dan tiga perintah list. | Empat jawaban terpisah dapat benar tanpa memahami keadaan akhir. Minta prediksi isi list setelah tiap perubahan. |
| Siapkan Keberangkatan | C3 | Empat keputusan berdasarkan tiga syarat. | Sudah menguji batas, tetapi hanya hasil akhir. Tambah alasan syarat mana yang gagal bila diubah menjadi C4/C5. |
| Bangun Jalur | C3 | Bagian diagram input, simbol, kondisi, keluaran. | Mengukur susunan alur, tetapi pilihan simbol cenderung hafalan. Periksa hasil diagram pada kasus batas. |
| Jalankan Gerbang | C3 | Tiga cabang dan keluaran flowchart. | Semua pilihan biner; tebakan relatif mudah. Untuk promosi C4, berikan diagram yang salah dan minta diagnosis dengan bukti kasus. |
| Perbaiki Batas | C4 | Penyebab operator `>`, perbaikan `>=`, tiga uji. | Pengecoh penyebab terlalu jauh dari miskonsepsi yang nyata. Gunakan alternatif `==`, `<=`, dan dampak pada nilai batas. |
| Rakit Pengendali | C3 | Urutan tiga langkah dan dua keluaran. | Pilihan urutan langsung mengungkap model. Gunakan input baru untuk memastikan transfer penerapan. |
| Atur Pengiriman | C3 | Kondisi tarif dan tiga keluaran. | Tepat untuk penerapan batas. Jika dipromosikan ke C5, bandingkan dua kebijakan tarif dengan kriteria dan bukti; butuh rubrik guru. |
| Lacak Gangguan | C4 | Penyebab, urutan perbaikan, dua uji. | Perlu pengecoh yang masuk akal dan penjelasan mengapa perbaikan menyelesaikan error. |
| Hubungkan Sistem | C3 | Mencocokkan RAM/CU/ALU/output. | Saat ini dominan mengenali fungsi komponen, bukan menerapkan model. Minta prediksi alur data/instruksi pada kasus baru. |
| Jalankan Perhitungan | C3 | Empat keadaan akumulator/RAM. | Bukti penelusuran cukup konkret; pertahankan dengan variasi input pada versi baru. |
| Alamat atau Isi? | C4 | Diagnosis alamat vs isi, perbaikan, uji nilai baru. | Sudah ada bukti pengujian; perkuat pengecoh yang terkait kesalahan pengalamatan. |
| Pulihkan Pengolah Nilai | C3 | Kode dijalankan pada tiga daftar berisi lima data. | Ketiga kasus panjangnya sama, sehingga solusi `/ 5` lolos meski tidak umum. Tambah panjang 3 dan daftar kosong sesuai kebutuhan yang diajarkan; bila menjadi C4, nilai diagnosis dan alasan perbaikan. |
| Perbaiki Daftar | C4 | Diagnosis `pop(1)`, keluaran kode pada dua daftar. | Dua uji memiliki struktur identik. Tambah kasus yang membedakan perbaikan umum dari jawaban khusus. |
| Pilih Solusi Terbaik | C5 | Pilihan A/B, tiga bukti uji, alasan tertulis; rubrik guru. | Satu-satunya C5; moderator perlu contoh jangkar nilai dan uji konsistensi antarpenilai. |

## Kebijakan skor sumatif yang diputuskan

Kebijakan `competency-v1`: nilai sumatif game memakai K (ketepatan jawaban atau rubrik guru) terbaik per misi. Rata-rata 15 misi inti menentukan nilai akhir dan syarat bos. Formula K 60%, petunjuk 10%, percobaan 10%, kesalahan 10%, waktu 10%, lalu potongan 1 poin per pengulangan, tetap dihitung sebagai **skor permainan**, bukan nilai sumatif. Pada sesi baru (rumus versi 4), petunjuk pertama gratis dan petunjuk berikutnya masing-masing mengurangi komponen H sebanyak 25. Sesi dengan rumus versi 3 mempertahankan aturan petunjuk sebelumnya. Rapor dan ekspor menampilkan keduanya. Sesi historis tidak diubah; nilai kompetensi dihitung ulang dari komponen K yang tersimpan. Jika bukti K tidak tersedia pada format lama, sistem memakai ketepatan pertama atau skor sesi sebagai fallback historis. Statistik proses membantu guru memeriksa bukti, bukan mengurangi nilai kompetensi. Nilai game ini tetap tidak otomatis menetapkan status TP menurut KKTP.

## Perbaikan butir yang telah diterapkan

- *Perbaiki Batas* dan *Lacak Gangguan*: pengecoh yang terlalu mudah dikenali diganti dengan dugaan kesalahan yang lebih dekat dengan kasus. Kunci jawaban tetap sama.
- *Pulihkan Pengolah Nilai*: sesi baru diuji pada daftar berisi 5, 3, dan 4 nilai. Pembagi tetap `/ 5` tidak lagi mendapat nilai kompetensi penuh.
- *Perbaiki Daftar*: sesi baru juga diuji pada daftar dengan satu barang tambahan yang harus tetap tersimpan; solusi yang hanya mengembalikan tiga barang tidak mendapat nilai penuh.
- Revisi uji ditandai `assessmentRevision = 2` pada sesi baru dan tampil dalam rekap guru. Sesi yang sudah dimulai memakai aturan uji sebelumnya; dokumen sesi dan hasil yang tersimpan tidak dinilai ulang.

Perbaikan lain pada tabel di atas masih merupakan agenda revisi instrumen. Penambahan butir baru, perubahan kunci, dan kenaikan level Bloom perlu paket misi baru beserta uji coba dan rubrik; revisi uji terbatas di atas belum mengubah label C3/C4/C5.

## Rencana komposisi kognitif C4 dan C5

Pertahankan 15 misi dan bobot antarmisi setara. Kandidat: **7 C3, 6 C4, 2 C5** (sekarang 10/4/1). Naikkan *Jalankan Gerbang* dan *Pulihkan Pengolah Nilai* ke C4 setelah tugasnya menghasilkan diagnosis, perbaikan, dan uji yang nyata. Ubah *Atur Pengiriman* menjadi C5 hanya bila guru siap menilai evaluasi dua kebijakan tarif memakai rubrik. Sebelum penerapan, cocokkan dengan TP/KKTP sekolah, cek tingkat kesulitan, dan perkirakan beban penilaian tertulis guru. Mengganti label Bloom saja tanpa mengubah bukti tidak menaikkan level kognitif.

Perubahan tugas atau kunci jawaban yang lebih luas harus diterbitkan sebagai paket misi dengan identitas/versi baru. Revisi uji terbatas di atas tetap memakai identitas misi lama, tetapi versi uji disimpan per sesi. Sesi lama dan skor 15 misi yang sudah ada tidak boleh berubah akibat evaluasi ulang menggunakan kunci jawaban baru. Definisikan terlebih dahulu apakah kohor lama menyelesaikan versi lama atau memulai paket asesmen baru; jangan campurkan versi dalam satu nilai akhir tanpa keputusan guru.

## Bukti yang masih dibutuhkan sebelum dipakai sebagai nilai sumatif resmi

1. Konfirmasi guru bahwa urutan materi pada ATP final sesuai yang benar-benar sudah diajarkan pada kohor yang akan memakai game ini; terutama Python/list Pertemuan 10 dan cakupan BK.3 yang belum lengkap.
2. Uji coba terbatas dengan murid: kejelasan soal, waktu aktif realistis per misi, kesesuaian pengecoh, dan kemampuan menjelaskan alasan.
3. Kalibrasi guru pada rubrik C5/C6 dengan contoh jawaban, lalu cek konsistensi penilai.
4. Pemeriksaan bahwa nilai, jawaban, status penilaian guru, dan ekspor sesuai untuk setiap murid, termasuk setelah pengulangan dan sinkronisasi offline.
