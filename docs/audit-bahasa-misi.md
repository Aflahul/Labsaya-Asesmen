# Audit bahasa dan tampilan misi

Cakupan: 15 misi inti, satu tantangan bos, panduan Nara, formulir masuk, peta, kedatangan, rapor, dan pengaturan.

## Temuan dan perbaikan

| Temuan | Perbaikan |
|---|---|
| Pertanyaan berupa potongan frasa | Pertanyaan utuh yang menyebut data, kondisi, dan jawaban yang diminta |
| Istilah tidak konsisten | Tipe data, nilai (value), variabel, dan perintah dipakai sesuai konteks pembelajaran |
| Petunjuk bercampur dengan soal | Tombol Petunjuk menampilkan tips melalui toast Nara |
| Penjelasan Coba/Kirim berulang | Penjelasan singkat dipindahkan ke panduan Nara |
| Catatan perjalanan memenuhi scene | Panel dihapus; waktu dan progres berada di panel misi |
| Status penyimpanan mengganggu misi | Status rutin tidak ditampilkan pada misi/kedatangan; pesan kegagalan tetap tersedia |
| Pesawat hanya terlihat saat transisi | Pesawat tiba setelah scene terbuka dan menetap selama misi |
| Rapor murid menampilkan data teknis | Tabel murid menampilkan misi, jenis, status, nilai; bukti rinci tersedia untuk guru dan cadangan |

## Aturan penyuntingan

- Satu pertanyaan menyebut tindakan yang dapat dilakukan murid.
- Variabel dan kode tetap memakai ejaan asli agar sesuai program.
- Istilah materi tetap digunakan; istilah pengelolaan aplikasi tidak masuk ke soal.
- Tombol tindakan satu kata; nama pulau dan merek paling banyak dua kata.
- Tips membantu menelusuri langkah, tanpa mengisi pilihan murid.
- Kunci, opsi tersimpan, bobot, dan aturan bos tidak diubah.

## Naskah pertanyaan yang digunakan

### Pelabuhan Data — Daftarkan Kargo

Pesawat akan membawa kargo ke pulau berikutnya. Bantu Nara mengisi data pengiriman: nomor telepon, jumlah paket, berat kargo, dan status siap.

- Apa tipe data yang cocok untuk menyimpan nomor telepon "08123" agar angka 0 di depannya tetap ada?
- Bagaimana penulisan nilai (value) untuk jumlah_paket jika kargo yang akan dikirim berisi 3 paket?
- Apa tipe data yang cocok untuk menyimpan berat kargo 2.75 kg?
- Pengiriman sudah disetujui. Bagaimana penulisan nilai untuk variabel siap yang bertipe Boolean?

Nara: Bantu aku mencatat data kargo agar tidak salah dibaca komputer.

### Pelabuhan Data — Atur Rak

Rak kargo berisi ["Pangan", "Kayu", "Batu"]. Ganti Kayu dengan Air, keluarkan Batu, lalu tambahkan Obat di akhir daftar. Pilih perintah Python untuk melakukan perubahan itu.

- Pada indeks berapa Kayu berada di daftar awal?
- Perintah mana yang mengganti Kayu dengan Air?
- Setelah Kayu diganti dengan Air, perintah mana yang menghapus Batu?
- Perintah mana yang menambahkan Obat di akhir daftar?

Nara: Susun isi rak agar barang yang dibutuhkan siap dikirim.

### Pelabuhan Data — Siapkan Keberangkatan

Pesawat boleh berangkat jika berat kargo paling banyak 10 kg, energi sedikitnya 12 unit, dan siap bernilai True. Tentukan apakah setiap pengiriman berikut boleh berangkat.

- Pengiriman A: berat 10 kg, energi 12 unit, siap = True. Boleh berangkat atau perlu ditunda?
- Pengiriman B: berat 8 kg, energi 18 unit, siap = False. Boleh berangkat atau perlu ditunda?
- Pengiriman C: berat 11 kg, energi 20 unit, siap = True. Boleh berangkat atau perlu ditunda?
- Pengiriman D: berat 9 kg, energi 13 unit, siap = True. Boleh berangkat atau perlu ditunda?

Nara: Putuskan perjalanan mana yang sudah memenuhi syarat berangkat.

### Gerbang Alur — Bangun Jalur

Gerbang harus menerima pesanan jika stok cukup dan menundanya jika stok kurang. Stok yang sama dengan jumlah pesanan juga berarti cukup. Lengkapi diagram alurnya.

- Langkah apa yang perlu dilakukan setelah Mulai?
- Simbol flowchart apa yang cocok untuk menerima data stok dan pesanan?
- Kondisi apa yang harus diperiksa untuk menentukan apakah stok cukup?
- Jika kondisi terpenuhi (YA), keputusan apa yang ditampilkan?
- Jika kondisi tidak terpenuhi (TIDAK), keputusan apa yang ditampilkan?

Nara: Bantu aku menyusun jalur keputusan gerbang pesanan.

### Gerbang Alur — Jalankan Gerbang

Gunakan diagram di bawah untuk memeriksa tiga pesanan. Untuk setiap pesanan, pilih cabang yang dilewati dan keputusan yang ditampilkan.

- Jika stok 2 dan pesanan 3, cabang mana yang dilewati dan apa keputusannya?
- Jika stok 3 dan pesanan 3, cabang mana yang dilewati dan apa keputusannya?
- Jika stok 5 dan pesanan 3, cabang mana yang dilewati dan apa keputusannya?

Nara: Cari tahu ke mana setiap pesanan diarahkan oleh gerbang.

### Gerbang Alur — Perbaiki Batas

Gerbang memakai kondisi stok > pesanan. Saat stok 3 dan pesanan 3, pesanan justru ditolak. Bantu Nara memperbaikinya agar stok yang tepat cukup juga diterima.

- Mengapa pesanan ditolak saat stok dan jumlah pesanan sama?
- Tanda pembanding apa yang sebaiknya digunakan agar gerbang bekerja sesuai aturan?
- Setelah diperbaiki, apa keputusan gerbang jika stok 2 dan pesanan 3?
- Setelah diperbaiki, apa keputusan gerbang jika stok 3 dan pesanan 3?
- Setelah diperbaiki, apa keputusan gerbang jika stok 4 dan pesanan 3?

Nara: Perbaiki gerbang yang menolak pesanan saat stok sebenarnya cukup.

### Bengkel Logika — Rakit Pengendali

Setiap paket membutuhkan 2 unit energi. Susun pseudocode yang membaca jumlah paket x, menghitung kebutuhan energi y, lalu menampilkan hasilnya.

- Apa yang ditulis pada baris pertama?
- Apa yang ditulis pada baris kedua?
- Apa yang ditulis pada baris ketiga?
- Jika x = 3, berapa nilai y yang ditampilkan?
- Jika x = 7, berapa nilai y yang ditampilkan?

Nara: Susun langkah pengendali untuk menghitung energi pengiriman.

### Bengkel Logika — Atur Pengiriman

Biaya pengiriman sampai dengan 5 km adalah Rp4.000. Jika jaraknya lebih dari 5 km, biayanya Rp7.000. Lengkapi kondisi pada pseudocode, lalu tentukan biaya ketiga pengiriman.

- Kondisi apa yang perlu ditulis setelah IF agar biaya sesuai aturan?
- Berapa biaya pengiriman untuk jarak 2 km, dalam rupiah?
- Berapa biaya pengiriman untuk jarak 5 km, dalam rupiah?
- Berapa biaya pengiriman untuk jarak 8 km, dalam rupiah?

Nara: Tentukan biaya pengiriman sesuai jarak perjalanan.

### Bengkel Logika — Lacak Gangguan

Program ini seharusnya menghitung energi sebesar jumlah paket × 2. Namun, saat dijalankan untuk 3 paket, nilai energi belum tersedia. Periksa urutan langkahnya.

- Mengapa nilai energi belum tersedia saat program mencoba menampilkannya?
- Urutan langkah mana yang membuat program bekerja dengan benar?
- Setelah urutannya diperbaiki, berapa energi yang ditampilkan untuk 0 paket?
- Setelah urutannya diperbaiki, berapa energi yang ditampilkan untuk 4 paket?

Nara: Temukan mengapa pengendali mencoba menampilkan hasil yang belum dihitung.

### Pusat Mesin — Hubungkan Sistem

Nara memasukkan angka 12 dan 8 lewat keyboard untuk dijumlahkan. Komputer perlu menyimpan data, menjalankan instruksi, menghitung, lalu menampilkan hasilnya.

- Di komponen apa angka dari keyboard disimpan sementara?
- Komponen apa yang mengatur jalannya instruksi?
- Komponen apa yang melakukan perhitungan 12 + 8?
- Perangkat apa yang menampilkan hasil penjumlahan kepada Nara?

Nara: Bantu aku mengikuti perjalanan data dari keyboard sampai layar.

### Pusat Mesin — Jalankan Perhitungan

RAM pada alamat 10 berisi 12, sedangkan alamat 11 berisi 8. Ikuti empat instruksi di bawah, lalu tentukan nilai setelah setiap langkah. Akumulator adalah tempat menyimpan hasil sementara.

- Setelah LOAD [10] membaca isi alamat 10, berapa nilai dalam akumulator?
- Setelah ADD [11] menambahkan isi alamat 11, berapa nilai dalam akumulator?
- Setelah STORE [12] menyimpan hasilnya, berapa isi RAM pada alamat 12?
- Berapa nilai yang ditampilkan oleh OUTPUT [12]?

Nara: Ikuti perubahan nilai ketika mesin menjalankan empat instruksi.

### Pusat Mesin — Alamat atau Isi?

RAM[10] berisi 12 dan RAM[11] berisi 8. Program seharusnya menjumlahkan isi kedua alamat, tetapi malah menghitung 10 + 11 dan menghasilkan 21. Bantu Nara mencari kesalahannya.

- Mengapa program menghasilkan 21?
- Dua nilai apa yang seharusnya dijumlahkan oleh ALU?
- Jika isi RAM[10] diubah menjadi 15 dan RAM[11] tetap 8, berapa hasil penjumlahannya?

Nara: Cari penyebab mesin menjumlahkan nomor alamat, bukan isi kotaknya.

### Menara Program — Pulihkan Pengolah Nilai

Nara ingin menghitung rata-rata nilai lima murid. Program di bawah sudah menjumlahkan nilainya, tetapi rata-ratanya belum benar. Perbaiki perhitungannya dan tampilkan hasil dengan print.


Nara: Perbaiki program agar menghitung rata-rata nilai dengan tepat.

### Menara Program — Perbaiki Daftar

Daftar kargo seharusnya menjadi ["Pangan", "Air", "Obat"], tetapi Air justru hilang. Cari penyebabnya, lalu perbaiki kode agar barang yang dibutuhkan tetap ada.

- Perintah mana yang membuat Air hilang dari daftar?
- Setelah kodenya diperbaiki, barang apa yang tersimpan pada kargo[1]?

Nara: Perbaiki program kargo agar barang yang benar tetap berada di daftar.

### Menara Program — Pilih Solusi Terbaik

Nara perlu memilih program rata-rata yang tetap benar untuk 5 atau 3 murid. Program juga harus menangani daftar kosong tanpa membagi dengan nol dan mudah diperiksa. Bandingkan rancangan A dan B, lalu jelaskan pilihanmu.

- Menurutmu, rancangan A atau B yang lebih sesuai dengan kebutuhan Nara? Tuliskan pilihanmu.
- Apa hasil A dan B untuk masing-masing daftar berikut: [70,80,90,60,100], [60,80,100], dan []? Tuliskan hasil keduanya untuk setiap daftar.
- Mengapa kamu memilih rancangan itu? Bandingkan kelebihan dan kekurangannya dengan tiga kebutuhan Nara di atas.

Nara: Bantu aku memilih solusi rata-rata yang dapat diandalkan.

### Menara Program — Ruang Arsitek

Buat program untuk membantu Nara membagikan bantuan. Program membaca stok dan jumlah permintaan. Jika keduanya tidak negatif dan stok cukup, kirim bantuan lalu tampilkan sisa stok. Jika stok kurang, tunda pengiriman; stok tidak berubah. Jika ada angka negatif, tampilkan pesan kesalahan tanpa menghitung sisa stok.

- Data apa yang perlu dimasukkan dan hasil apa yang perlu ditampilkan? Tuliskan nama variabel dan tipe datanya.
- Bagaimana urutan langkah programmu? Tulis dalam bentuk algoritma, pseudocode, atau kode Python.
- Bagaimana kamu memastikan programmu bekerja? Buat sedikitnya tiga contoh: stok cukup, stok sama dengan permintaan, dan data negatif. Untuk setiap contoh, tulis masukan dan hasil yang seharusnya muncul.
- Mengapa kamu menyusun langkahnya seperti itu? Jelaskan juga apa yang terjadi saat stok kurang atau ada angka negatif pada data yang dimasukkan.

Nara: Rancang sistem bantuan versimu sendiri. Tantangan ini boleh kamu lewati.

## Batas pemeriksaan

Pemeriksaan bahasa dilakukan pada naskah dan alur aplikasi. Keterpahaman nyata belum diuji langsung bersama murid kelas 10; guru tetap perlu mengamati kata atau langkah yang membuat murid berhenti saat penggunaan di kelas.
