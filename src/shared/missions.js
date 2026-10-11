import { GUIDANCE } from "./mission-guidance.js";
import { MISSIONS as LEGACY } from "./legacy/missions.js";
export const ISLANDS = [
  {
    id: 1,
    name: "Pelabuhan Data",
    slug: "pelabuhan-data",
    topic: "Variabel · tipe data · list",
    meeting: "Pertemuan 4",
  },
  {
    id: 2,
    name: "Gerbang Alur",
    slug: "gerbang-alur",
    topic: "Flowchart · percabangan",
    meeting: "Pertemuan 3",
  },
  {
    id: 3,
    name: "Bengkel Logika",
    slug: "bengkel-logika",
    topic: "Pseudocode · pengujian",
    meeting: "Pertemuan 3",
  },
  {
    id: 4,
    name: "Pusat Mesin",
    slug: "pusat-mesin",
    topic: "RAM · CU · ALU · output",
    meeting: "Pertemuan 8",
  },
  {
    id: 5,
    name: "Menara Program",
    slug: "menara-program",
    topic: "Python · evaluasi solusi",
    meeting: "Pertemuan 9",
  },
];
const field = (key, label, options, answer, weight = 1) => ({
  key,
  label,
  options,
  answer,
  weight,
});
const make = (
  island,
  n,
  title,
  bloom,
  kind,
  instructions,
  fields,
  extra = {},
) => {
  const i = ISLANDS[island - 1];
  return {
    id: `v2p0${island}m0${n}`,
    island,
    islandName: i.name,
    slug: i.slug,
    meeting: i.meeting,
    title,
    bloom,
    akm: bloom === "C3" ? "L2" : "L3",
    kind,
    missionVersion: 2,
    enrichment: false,
    competency: i.topic,
    indicators: [`V2.${island}.${n}`],
    narrative: `Pulihkan layanan ${i.name}. Setiap solusi yang kamu bangun membantu menyambungkan jaringan Menara Awan.`,
    instructions,
    guidance: GUIDANCE[`v2p0${island}m0${n}`],
    elements: fields.length,
    canonicalSteps: fields.length,
    hints: [
      "Baca tujuan dan data yang diberikan. Kamu boleh mengubah jawaban sebelum mengirim.",
      "Bandingkan hasil dengan syarat misi, termasuk nilai yang tepat di batas.",
    ],
    rules: {
      fields: fields.map(({ answer, ...f }) => f),
      answers: Object.fromEntries(fields.map((f) => [f.key, f.answer])),
      ...extra,
    },
    ...extra,
  };
};
export const MISSIONS = [
  make(
    1,
    1,
    "Daftarkan Kargo",
    "C3",
    "form",
    "Pesawat akan membawa kargo ke pulau berikutnya. Bantu Nara mengisi data pengiriman: nomor telepon, jumlah paket, berat kargo, dan status siap.",
    [
      field(
        "phone",
        'Apa tipe data yang cocok untuk menyimpan nomor telepon "08123" agar angka 0 di depannya tetap ada?',
        ["String", "Integer", "Float", "Boolean"],
        "String",
      ),
      field(
        "count",
        "Bagaimana penulisan nilai (value) untuk jumlah_paket jika kargo yang akan dikirim berisi 3 paket?",
        ["3", '"3"', "3.5", "True"],
        "3",
      ),
      field(
        "weight",
        "Apa tipe data yang cocok untuk menyimpan berat kargo 2.75 kg?",
        ["String", "Integer", "Float", "Boolean"],
        "Float",
      ),
      field(
        "ready",
        "Pengiriman sudah disetujui. Bagaimana penulisan nilai untuk variabel siap yang bertipe Boolean?",
        ["True", '"siap"', "0", "2.75"],
        "True",
      ),
    ],
  ),
  make(
    1,
    2,
    "Atur Rak",
    "C3",
    "list",
    'Rak kargo berisi ["Pangan", "Kayu", "Batu"]. Ganti Kayu dengan Air, keluarkan Batu, lalu tambahkan Obat di akhir daftar. Pilih perintah Python untuk melakukan perubahan itu.',
    [
      field(
        "index",
        "Pada indeks berapa Kayu berada di daftar awal?",
        ["0", "1", "2"],
        "1",
      ),
      field(
        "set",
        "Perintah mana yang mengganti Kayu dengan Air?",
        ['rak[0] = "Air"', 'rak[1] = "Air"', 'rak[2] = "Air"'],
        'rak[1] = "Air"',
      ),
      field(
        "remove",
        "Setelah Kayu diganti dengan Air, perintah mana yang menghapus Batu?",
        ["rak.pop(0)", "rak.pop(1)", "rak.pop(2)"],
        "rak.pop(2)",
      ),
      field(
        "append",
        "Perintah mana yang menambahkan Obat di akhir daftar?",
        ['rak.append("Obat")', 'rak[0] = "Obat"', "rak.pop(2)"],
        'rak.append("Obat")',
      ),
    ],
    { initial: ["Pangan", "Kayu", "Batu"] },
  ),
  make(
    1,
    3,
    "Siapkan Keberangkatan",
    "C3",
    "form",
    "Pesawat boleh berangkat jika berat kargo paling banyak 10 kg, energi sedikitnya 12 unit, dan siap bernilai True. Tentukan apakah setiap pengiriman berikut boleh berangkat.",
    [
      field(
        "a",
        "Pengiriman A: berat 10 kg, energi 12 unit, siap = True. Boleh berangkat atau perlu ditunda?",
        ["Berangkat", "Tunda"],
        "Berangkat",
      ),
      field(
        "b",
        "Pengiriman B: berat 8 kg, energi 18 unit, siap = False. Boleh berangkat atau perlu ditunda?",
        ["Berangkat", "Tunda"],
        "Tunda",
      ),
      field(
        "c",
        "Pengiriman C: berat 11 kg, energi 20 unit, siap = True. Boleh berangkat atau perlu ditunda?",
        ["Berangkat", "Tunda"],
        "Tunda",
      ),
      field(
        "d",
        "Pengiriman D: berat 9 kg, energi 13 unit, siap = True. Boleh berangkat atau perlu ditunda?",
        ["Berangkat", "Tunda"],
        "Berangkat",
      ),
    ],
  ),
  make(
    2,
    1,
    "Bangun Jalur",
    "C3",
    "flow",
    "Gerbang harus menerima pesanan jika stok cukup dan menundanya jika stok kurang. Stok yang sama dengan jumlah pesanan juga berarti cukup. Lengkapi diagram alurnya.",
    [
      field(
        "first",
        "Langkah apa yang perlu dilakukan setelah Mulai?",
        ["Input stok, pesanan", "Output Terima", "stok ≥ pesanan?"],
        "Input stok, pesanan",
      ),
      field(
        "symbol",
        "Simbol flowchart apa yang cocok untuk menerima data stok dan pesanan?",
        ["Jajar genjang", "Belah ketupat", "Persegi panjang"],
        "Jajar genjang",
      ),
      field(
        "condition",
        "Kondisi apa yang harus diperiksa untuk menentukan apakah stok cukup?",
        ["stok ≥ pesanan", "stok > pesanan", "stok < pesanan"],
        "stok ≥ pesanan",
      ),
      field(
        "yes",
        "Jika kondisi terpenuhi (YA), keputusan apa yang ditampilkan?",
        ["Terima", "Tunda"],
        "Terima",
      ),
      field(
        "no",
        "Jika kondisi tidak terpenuhi (TIDAK), keputusan apa yang ditampilkan?",
        ["Terima", "Tunda"],
        "Tunda",
      ),
    ],
  ),
  make(
    2,
    2,
    "Jalankan Gerbang",
    "C3",
    "flow-trace",
    "Gunakan diagram di bawah untuk memeriksa tiga pesanan. Untuk setiap pesanan, pilih cabang yang dilewati dan keputusan yang ditampilkan.",
    [
      field(
        "a",
        "Jika stok 2 dan pesanan 3, cabang mana yang dilewati dan apa keputusannya?",
        ["YA → Terima", "TIDAK → Tunda"],
        "TIDAK → Tunda",
      ),
      field(
        "b",
        "Jika stok 3 dan pesanan 3, cabang mana yang dilewati dan apa keputusannya?",
        ["YA → Terima", "TIDAK → Tunda"],
        "YA → Terima",
      ),
      field(
        "c",
        "Jika stok 5 dan pesanan 3, cabang mana yang dilewati dan apa keputusannya?",
        ["YA → Terima", "TIDAK → Tunda"],
        "YA → Terima",
      ),
    ],
  ),
  make(
    2,
    3,
    "Perbaiki Batas",
    "C4",
    "boundary",
    "Gerbang memakai kondisi stok > pesanan. Saat stok 3 dan pesanan 3, pesanan justru ditolak. Bantu Nara memperbaikinya agar stok yang tepat cukup juga diterima.",
    [
      field(
        "cause",
        "Mengapa pesanan ditolak saat stok dan jumlah pesanan sama?",
        [
          "Nilai sama tidak diterima oleh >",
          "Input harus selalu negatif",
          "Output selalu membutuhkan list",
        ],
        "Nilai sama tidak diterima oleh >",
        30,
      ),
      field(
        "operator",
        "Tanda pembanding apa yang sebaiknya digunakan agar gerbang bekerja sesuai aturan?",
        [">", ">=", "<", "=="],
        ">=",
        40,
      ),
      field(
        "a",
        "Setelah diperbaiki, apa keputusan gerbang jika stok 2 dan pesanan 3?",
        ["Terima", "Tunda"],
        "Tunda",
        10,
      ),
      field(
        "b",
        "Setelah diperbaiki, apa keputusan gerbang jika stok 3 dan pesanan 3?",
        ["Terima", "Tunda"],
        "Terima",
        10,
      ),
      field(
        "c",
        "Setelah diperbaiki, apa keputusan gerbang jika stok 4 dan pesanan 3?",
        ["Terima", "Tunda"],
        "Terima",
        10,
      ),
    ],
  ),
  make(
    3,
    1,
    "Rakit Pengendali",
    "C3",
    "pseudocode",
    "Setiap paket membutuhkan 2 unit energi. Susun pseudocode yang membaca jumlah paket x, menghitung kebutuhan energi y, lalu menampilkan hasilnya.",
    [
      field(
        "one",
        "Apa yang ditulis pada baris pertama?",
        ["INPUT x", "OUTPUT y", "y ← x × 2"],
        "INPUT x",
      ),
      field(
        "two",
        "Apa yang ditulis pada baris kedua?",
        ["INPUT x", "OUTPUT y", "y ← x × 2"],
        "y ← x × 2",
      ),
      field(
        "three",
        "Apa yang ditulis pada baris ketiga?",
        ["INPUT x", "OUTPUT y", "y ← x × 2"],
        "OUTPUT y",
      ),
      field(
        "a",
        "Jika x = 3, berapa nilai y yang ditampilkan?",
        ["3", "6", "9"],
        "6",
      ),
      field(
        "b",
        "Jika x = 7, berapa nilai y yang ditampilkan?",
        ["7", "14", "49"],
        "14",
      ),
    ],
  ),
  make(
    3,
    2,
    "Atur Pengiriman",
    "C3",
    "pseudocode",
    "Biaya pengiriman sampai dengan 5 km adalah Rp4.000. Jika jaraknya lebih dari 5 km, biayanya Rp7.000. Lengkapi kondisi pada pseudocode, lalu tentukan biaya ketiga pengiriman.",
    [
      field(
        "condition",
        "Kondisi apa yang perlu ditulis setelah IF agar biaya sesuai aturan?",
        ["jarak < 5", "jarak ≤ 5", "jarak > 5"],
        "jarak ≤ 5",
      ),
      field(
        "a",
        "Berapa biaya pengiriman untuk jarak 2 km, dalam rupiah?",
        ["4000", "7000"],
        "4000",
      ),
      field(
        "b",
        "Berapa biaya pengiriman untuk jarak 5 km, dalam rupiah?",
        ["4000", "7000"],
        "4000",
      ),
      field(
        "c",
        "Berapa biaya pengiriman untuk jarak 8 km, dalam rupiah?",
        ["4000", "7000"],
        "7000",
      ),
    ],
    {
      snippet:
        "INPUT jarak\nIF [pilih kondisi] THEN biaya ← 4000\nELSE biaya ← 7000\nOUTPUT biaya",
    },
  ),
  make(
    3,
    3,
    "Lacak Gangguan",
    "C4",
    "debug",
    "Program ini seharusnya menghitung energi sebesar jumlah paket × 2. Namun, saat dijalankan untuk 3 paket, nilai energi belum tersedia. Periksa urutan langkahnya.",
    [
      field(
        "cause",
        "Mengapa nilai energi belum tersedia saat program mencoba menampilkannya?",
        [
          "Output terjadi sebelum assignment energi",
          "Angka 3 tidak boleh menjadi input",
          "Perkalian harus diganti penjumlahan",
        ],
        "Output terjadi sebelum assignment energi",
        30,
      ),
      field(
        "fix",
        "Urutan langkah mana yang membuat program bekerja dengan benar?",
        [
          "INPUT → proses → OUTPUT",
          "OUTPUT → INPUT → proses",
          "proses → OUTPUT → INPUT",
        ],
        "INPUT → proses → OUTPUT",
        40,
      ),
      field(
        "a",
        "Setelah urutannya diperbaiki, berapa energi yang ditampilkan untuk 0 paket?",
        ["0", "2", "Tidak tersedia"],
        "0",
        15,
      ),
      field(
        "b",
        "Setelah urutannya diperbaiki, berapa energi yang ditampilkan untuk 4 paket?",
        ["4", "6", "8"],
        "8",
        15,
      ),
    ],
    { snippet: "INPUT paket\nOUTPUT energi\nenergi ← paket × 2" },
  ),
  make(
    4,
    1,
    "Hubungkan Sistem",
    "C3",
    "cpu",
    "Nara memasukkan angka 12 dan 8 lewat keyboard untuk dijumlahkan. Komputer perlu menyimpan data, menjalankan instruksi, menghitung, lalu menampilkan hasilnya.",
    [
      field(
        "input",
        "Di komponen apa angka dari keyboard disimpan sementara?",
        ["RAM", "Monitor", "ALU"],
        "RAM",
      ),
      field(
        "control",
        "Komponen apa yang mengatur jalannya instruksi?",
        ["CU", "RAM", "Monitor"],
        "CU",
      ),
      field(
        "calc",
        "Komponen apa yang melakukan perhitungan 12 + 8?",
        ["ALU", "Keyboard", "RAM"],
        "ALU",
      ),
      field(
        "output",
        "Perangkat apa yang menampilkan hasil penjumlahan kepada Nara?",
        ["Monitor", "CU", "Keyboard"],
        "Monitor",
      ),
    ],
  ),
  make(
    4,
    2,
    "Jalankan Perhitungan",
    "C3",
    "memory",
    "RAM pada alamat 10 berisi 12, sedangkan alamat 11 berisi 8. Ikuti empat instruksi di bawah, lalu tentukan nilai setelah setiap langkah. Akumulator adalah tempat menyimpan hasil sementara.",
    [
      field(
        "load",
        "Setelah LOAD [10] membaca isi alamat 10, berapa nilai dalam akumulator?",
        ["10", "12", "0"],
        "12",
      ),
      field(
        "add",
        "Setelah ADD [11] menambahkan isi alamat 11, berapa nilai dalam akumulator?",
        ["21", "19", "20"],
        "20",
      ),
      field(
        "store",
        "Setelah STORE [12] menyimpan hasilnya, berapa isi RAM pada alamat 12?",
        ["12", "20", "8"],
        "20",
      ),
      field(
        "out",
        "Berapa nilai yang ditampilkan oleh OUTPUT [12]?",
        ["12", "20", "10"],
        "20",
      ),
    ],
    { snippet: "LOAD [10]\nADD [11]\nSTORE [12]\nOUTPUT [12]" },
  ),
  make(
    4,
    3,
    "Alamat atau Isi?",
    "C4",
    "memory-debug",
    "RAM[10] berisi 12 dan RAM[11] berisi 8. Program seharusnya menjumlahkan isi kedua alamat, tetapi malah menghitung 10 + 11 dan menghasilkan 21. Bantu Nara mencari kesalahannya.",
    [
      field(
        "cause",
        "Mengapa program menghasilkan 21?",
        [
          "Alamat dipakai sebagai nilai",
          "ALU tidak bisa menjumlahkan",
          "RAM selalu kosong",
        ],
        "Alamat dipakai sebagai nilai",
        30,
      ),
      field(
        "fix",
        "Dua nilai apa yang seharusnya dijumlahkan oleh ALU?",
        ["10 dan 11", "12 dan 8", "10 dan 8"],
        "12 dan 8",
        40,
      ),
      field(
        "test",
        "Jika isi RAM[10] diubah menjadi 15 dan RAM[11] tetap 8, berapa hasil penjumlahannya?",
        ["21", "23", "26"],
        "23",
        30,
      ),
    ],
  ),
  make(
    5,
    1,
    "Pulihkan Pengolah Nilai",
    "C3",
    "python",
    "Nara ingin menghitung rata-rata nilai lima murid. Program di bawah sudah menjumlahkan nilainya, tetapi rata-ratanya belum benar. Perbaiki perhitungannya dan tampilkan hasil dengan print.",
    [],
    {
      code: "nilai = [70, 80, 90, 60, 100]\ntotal = sum(nilai)\nrata = total / 4\nprint(rata)",
      expectedOutput: "80",
      reference:
        "Ingat: sum(nilai) menjumlahkan semua nilai, len(nilai) menghitung banyaknya nilai, dan / digunakan untuk membagi.",
    },
  ),
  make(
    5,
    2,
    "Perbaiki Daftar",
    "C4",
    "python-debug",
    'Daftar kargo seharusnya menjadi ["Pangan", "Air", "Obat"], tetapi Air justru hilang. Cari penyebabnya, lalu perbaiki kode agar barang yang dibutuhkan tetap ada.',
    [
      field(
        "cause",
        "Perintah mana yang membuat Air hilang dari daftar?",
        [
          "pop(1) menghapus Air yang baru disimpan",
          "append selalu menghapus elemen",
          "Indeks dimulai dari 1",
        ],
        "pop(1) menghapus Air yang baru disimpan",
        30,
      ),
      field(
        "test",
        "Setelah kodenya diperbaiki, barang apa yang tersimpan pada kargo[1]?",
        ["Pangan", "Air", "Obat"],
        "Air",
        30,
      ),
    ],
    {
      code: 'kargo = ["Pangan", "Kayu", "Batu"]\nkargo[1] = "Air"\nkargo.pop(1)\nkargo.append("Obat")\nprint(kargo)',
      expectedOutput: '["Pangan","Air","Obat"]',
    },
  ),
  make(
    5,
    3,
    "Pilih Solusi Terbaik",
    "C5",
    "review",
    "Nara perlu memilih program rata-rata yang tetap benar untuk 5 atau 3 murid. Program juga harus menangani daftar kosong tanpa membagi dengan nol dan mudah diperiksa. Bandingkan rancangan A dan B, lalu jelaskan pilihanmu.",
    [],
    {
      snippet:
        'A: rata = sum(nilai) / 5\n\nB: IF len(nilai) > 0 THEN\n     rata = sum(nilai) / len(nilai)\n   ELSE\n     OUTPUT "Belum ada nilai"',
      written: [
        [
          "choice",
          "Menurutmu, rancangan A atau B yang lebih sesuai dengan kebutuhan Nara? Tuliskan pilihanmu.",
        ],
        [
          "evidence",
          "Apa hasil A dan B untuk masing-masing daftar berikut: [70,80,90,60,100], [60,80,100], dan []? Tuliskan hasil keduanya untuk setiap daftar.",
        ],
        [
          "reason",
          "Mengapa kamu memilih rancangan itu? Bandingkan kelebihan dan kekurangannya dengan tiga kebutuhan Nara di atas.",
        ],
      ],
      rubric: [
        ["decision", "Keputusan sesuai kriteria", 30],
        ["evidence", "Bukti perbandingan tiga pengujian", 40],
        ["reason", "Alasan dan pertimbangan", 30],
      ],
      teacherGuide:
        "B memenuhi semua syarat. Lima data: A=B=80. Tiga data: A=48, B=80. Kosong: A menghasilkan 0 yang menyesatkan; B menampilkan pesan. Terima evaluasi alternatif yang akurat dan beralasan.",
    },
  ),
  make(
    5,
    4,
    "Ruang Arsitek",
    "C6",
    "boss",
    "Buat program untuk membantu Nara membagikan bantuan. Program membaca stok dan jumlah permintaan. Jika keduanya tidak negatif dan stok cukup, kirim bantuan lalu tampilkan sisa stok. Jika stok kurang, tunda pengiriman; stok tidak berubah. Jika ada angka negatif, tampilkan pesan kesalahan tanpa menghitung sisa stok.",
    [],
    {
      enrichment: true,
      scene: "ruang-arsitek",
      written: [
        [
          "design",
          "Data apa yang perlu dimasukkan dan hasil apa yang perlu ditampilkan? Tuliskan nama variabel dan tipe datanya.",
        ],
        [
          "solution",
          "Bagaimana urutan langkah programmu? Tulis dalam bentuk algoritma, pseudocode, atau kode Python.",
        ],
        [
          "tests",
          "Bagaimana kamu memastikan programmu bekerja? Buat sedikitnya tiga contoh: stok cukup, stok sama dengan permintaan, dan data negatif. Untuk setiap contoh, tulis masukan dan hasil yang seharusnya muncul.",
        ],
        [
          "reason",
          "Mengapa kamu menyusun langkahnya seperti itu? Jelaskan juga apa yang terjadi saat stok kurang atau ada angka negatif pada data yang dimasukkan.",
        ],
      ],
      rubric: [
        ["design", "Kejelasan rancangan data", 30],
        ["solution", "Ketepatan solusi", 35],
        ["tests", "Kualitas pengujian", 25],
        ["reason", "Penjelasan", 10],
      ],
      teacherGuide:
        "Nilai hasil karya, bukan panjang tulisan. Periksa input negatif, stok sama, stok kurang, dan sisa stok. Pseudocode yang benar setara dengan Python. Nilai ini tidak memengaruhi inti.",
    },
  ),
];
export const CORE_MISSIONS = MISSIONS.filter((m) => !m.enrichment);
export const BOSS = MISSIONS.at(-1);
export const getMission = (id) => {
  const m =
    MISSIONS.find((m) => m.id === id) || LEGACY.find((m) => m.id === id);
  if (!m) throw Error("Misi tidak ditemukan");
  return m;
};
