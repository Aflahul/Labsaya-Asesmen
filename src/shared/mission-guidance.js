// Student-facing guidance is separate from answer keys and scoring rules.
const guide = (goal, steps, help, hint) => ({ goal, steps, help, hint });
export const GUIDANCE = {
  v2p01m01: guide(
    "Bantu aku mencatat data kargo agar tidak salah dibaca komputer.",
    [
      "Baca pertanyaan di atas setiap kotak jawaban.",
      "Pilih tipe data atau nilai yang sesuai pada keempat kotak.",
      "Setelah keempat kotak terisi, tekan Coba untuk memeriksa jawabanmu.",
    ],
    "Kamu cukup memilih jawaban. Tidak perlu mengetik nomor telepon atau menulis program.",
    "Perhatikan data yang perlu dihitung dan data yang harus tetap ditulis persis seperti aslinya.",
  ),
  v2p01m02: guide(
    "Susun isi rak agar barang yang dibutuhkan siap dikirim.",
    [
      "Tentukan posisi Kayu pada rak awal.",
      "Pilih perintah untuk mengganti Kayu, menghapus Batu, lalu menambahkan Obat.",
      "Tekan Coba untuk melihat hasil susunan rak, lalu cocokkan dengan urutan yang diminta.",
    ],
    "Indeks menunjukkan posisi barang dalam list (daftar). Isi rak baru ditampilkan setelah kamu menekan Coba atau Kirim.",
    "Ikuti perintah satu per satu. Menghapus barang dapat menggeser posisi barang setelahnya.",
  ),
  v2p01m03: guide(
    "Bantu aku menentukan pengiriman mana yang boleh berangkat.",
    [
      "Baca tiga syarat keberangkatan.",
      "Periksa berat, energi, dan status siap pada setiap perjalanan A–D.",
      "Pilih Berangkat atau Tunda untuk keempat perjalanan.",
    ],
    "Semua syarat harus terpenuhi sekaligus. ≤ berarti lebih kecil atau sama dengan; ≥ berarti lebih besar atau sama dengan.",
    "Jangan berhenti setelah satu syarat terpenuhi. Periksa ketiganya, termasuk angka yang tepat di batas.",
  ),
  v2p02m01: guide(
    "Bantu aku membuat diagram alur untuk memeriksa pesanan.",
    [
      "Pilih langkah setelah Mulai dan bentuk simbolnya.",
      "Pilih kondisi yang harus diperiksa gerbang.",
      "Isi keluaran cabang YA dan TIDAK, lalu periksa diagram yang terbentuk.",
    ],
    "Gunakan lima kotak pilihan di bawah diagram. Tidak perlu menyeret bentuk atau menggambar. Bagian kosong akan terisi mengikuti pilihanmu.",
    "YA berarti kondisi pada gerbang benar; TIDAK berarti kondisi itu tidak terpenuhi.",
  ),
  v2p02m02: guide(
    "Ikuti diagram alurnya untuk menentukan apakah pesanan diterima atau ditunda.",
    [
      "Baca kondisi pada diagram.",
      "Bandingkan stok dengan pesanan pada setiap kasus.",
      "Pilih jalur YA atau TIDAK beserta keluaran yang sesuai.",
    ],
    "Telusuri diagram dari atas ke bawah. ≥ berarti lebih besar atau sama dengan.",
    "Coba baca kondisi sebagai kalimat untuk setiap pasangan angka, termasuk saat kedua angkanya sama.",
  ),
  v2p02m03: guide(
    "Bandingkan dua usulan perbaikan untuk gerbang yang keliru.",
    [
      "Baca contoh kegagalan dan pilih penyebabnya.",
      "Pilih tanda pembanding untuk memperbaiki kondisi gerbang.",
      "Uji hasil masing-masing usulan pada stok sama dan stok berlebih, lalu tekan Coba.",
    ],
    "Diagram mula-mula menunjukkan kondisi yang salah. Setelah kamu memilih operator, diagram menampilkan kondisi yang kamu pilih.",
    "Perbaikan harus menerima stok yang tepat cukup maupun berlebih, tanpa menerima stok yang kurang.",
  ),
  v2p03m01: guide(
    "Susun langkah pengendali untuk menghitung energi pengiriman.",
    [
      "Pilih isi baris pertama, kedua, dan ketiga.",
      "Ikuti urutan itu satu per satu untuk x = 3 dan x = 7.",
      "Pilih hasil yang akan ditampilkan untuk kedua masukan.",
    ],
    "x menyimpan jumlah paket, y menyimpan kebutuhan energi. INPUT membaca data; OUTPUT menampilkan hasil; ← berarti memberi nilai.",
    "Pastikan setiap nilai sudah tersedia sebelum digunakan pada langkah berikutnya.",
  ),
  v2p03m02: guide(
    "Tentukan biaya pengiriman sesuai jarak perjalanan.",
    [
      "Baca aturan biaya untuk dua kelompok jarak.",
      "Lengkapi kondisi IF pada rancangan langkah.",
      "Hitung biaya untuk jarak 2 km, 5 km, dan 8 km.",
    ],
    "IF berarti jika; ELSE berarti selain itu. Lengkapi pseudocode melalui kotak pilihan di bawahnya.",
    "Baca lagi aturan untuk jarak 5 km. Biaya mana yang berlaku pada jarak tersebut?",
  ),
  v2p03m03: guide(
    "Temukan mengapa pengendali mencoba menampilkan hasil yang belum dihitung.",
    [
      "Baca urutan langkah yang bermasalah.",
      "Pilih penyebab dan urutan perbaikannya.",
      "Prediksi hasil untuk 0 dan 4 paket setelah diperbaiki.",
    ],
    "Pemberian nilai berarti menyimpan hasil ke variabel. Tanda ← menyatakan pemberian nilai; OUTPUT meminta komputer menampilkan nilai yang sudah ada.",
    "Telusuri kapan energi pertama kali memiliki nilai dan kapan program memintanya untuk ditampilkan.",
  ),
  v2p04m01: guide(
    "Bantu aku mengikuti perjalanan data dari keyboard sampai layar.",
    [
      "Bayangkan operator memasukkan angka 12 dan 8.",
      "Pilih komponen yang bekerja pada setiap tahap pengolahan.",
      "Periksa urutan penyimpanan data, pengaturan instruksi, perhitungan, dan tampilan hasil.",
    ],
    "RAM, CU, dan ALU adalah nama komponen komputer yang telah kamu pelajari. Gunakan urutan kerja pada diagram untuk menentukan komponen yang sesuai.",
    "Cocokkan pekerjaan pada setiap tahap dengan fungsi komponen. Tempat menyimpan data berbeda dari unit yang menghitung.",
  ),
  v2p04m02: guide(
    "Ikuti perubahan nilai ketika mesin menjalankan empat instruksi.",
    [
      "Baca isi awal RAM dan urutan instruksi.",
      "Tentukan nilai hasil sementara setelah LOAD dan ADD.",
      "Tentukan nilai yang disimpan oleh STORE dan yang ditampilkan oleh OUTPUT.",
    ],
    "Akumulator adalah tempat hasil sementara. [10] berarti alamat 10, bukan angka yang akan langsung dihitung. Telusuri instruksi dari atas ke bawah.",
    "Setelah satu instruksi selesai, gunakan hasilnya untuk melanjutkan instruksi berikutnya.",
  ),
  v2p04m03: guide(
    "Cari penyebab mesin menjumlahkan nomor alamat, bukan isi kotaknya.",
    [
      "Baca data awal dan hasil mesin yang salah.",
      "Pilih penyebab serta data yang seharusnya dihitung.",
      "Prediksi hasil baru ketika isi RAM[10] diubah menjadi 15.",
    ],
    "Nomor alamat menandai lokasi penyimpanan. Isi RAM adalah nilai di lokasi itu. Pada kasus terakhir, hanya isi RAM[10] yang berubah.",
    "Bayangkan alamat sebagai nomor laci dan isi RAM sebagai barang di dalamnya.",
  ),
  v2p05m01: guide(
    "Perbaiki program agar menghitung rata-rata nilai dengan tepat.",
    [
      "Baca kode awal dan temukan perhitungan yang perlu diperbaiki.",
      "Ubah kode di editor. Pertahankan nama daftar nilai dan tampilkan satu hasil dengan print.",
      "Tekan Coba, baca hasil tiap pengujian, lalu perbaiki sebelum mengirim.",
    ],
    "Saat kamu menekan Coba, program diuji dengan beberapa daftar. Buat perhitungan yang tetap benar saat banyaknya nilai berubah.",
    "Perhatikan jumlah nilai dan banyaknya nilai dalam daftar. Apakah pembagi yang dipakai sudah sesuai?",
  ),
  v2p05m02: guide(
    "Bantu aku memperbaiki program agar daftar kargo sesuai pesanan.",
    [
      "Tentukan mengapa Air terhapus. Setelah kode diperbaiki, barang apa yang menempati posisi yang ditanyakan?",
      "Edit perintah yang salah pada kode.",
      "Tekan Coba, lalu cocokkan daftar hasilnya dengan daftar yang diminta.",
    ],
    "Data uji dapat mengganti barang pertama dan menambahkan barang lain. Pertahankan barang yang tidak diminta untuk dihapus; ganti Kayu menjadi Air, hapus Batu, lalu tambahkan Obat.",
    "Periksa posisi setiap barang tepat sebelum pop dijalankan. Gunakan keadaan daftar saat itu, bukan keadaan awal.",
  ),
  v2p05m03: guide(
    "Bantu aku memilih program yang menghitung rata-rata dengan benar untuk berbagai daftar nilai.",
    [
      "Hitung hasil A dan B satu per satu untuk ketiga daftar yang tersedia.",
      "Tulis hasil masing-masing rancangan, lalu tentukan pilihanmu.",
      "Jelaskan bagaimana pilihanmu memenuhi ketiga syarat. Buka Yang dinilai untuk memeriksa kelengkapan jawabanmu.",
    ],
    "A dan B ditulis dalam pseudocode. Baca langkahnya, lalu tulis hasil hitungan atau pesan yang muncul pada kotak jawaban. Nara akan menilai bukti dan alasanmu dengan rubrik.",
    "Bandingkan semua kasus, bukan hanya contoh lima murid. Jelaskan juga apa arti hasil ketika daftar kosong.",
  ),
  v2p05m04: guide(
    "Selamat datang di Ruang Arsitek, di dalam Menara Awan. Bantu aku memeriksa apakah pesawat boleh berangkat. Gunakan aturan dan data uji yang tersedia. Tantangan ini boleh kamu lewati.",
    [
      "Baca aturan satu per satu. Mulai dari kotak Data: tulis masukan, keluaran, dan tipe datanya.",
      "Di kotak Langkah program, susun solusi dengan bahasa sendiri, pseudocode, atau Python. Kamu cukup memilih satu bentuk.",
      "Di kotak Pengujian, tulis hasil untuk data A sampai D. Terakhir, jelaskan alasan langkah dan pilihan pesanmu.",
    ],
    "Tidak perlu membuat aplikasi atau tampilan. Tulis solusi pada empat kotak yang tersedia. Yang dinilai adalah ketepatan logika dan bukti pengujian, bukan panjang tulisan. Kamu boleh memperbaiki jawaban sebelum menekan Kirim.",
    "Periksa angka negatif sebelum menghitung energi. Saat data valid, periksa ketiga syarat keberangkatan. Ingat untuk menguji nilai yang tepat di batas dan menjelaskan alasan jika pengiriman ditunda.",
  ),
};
