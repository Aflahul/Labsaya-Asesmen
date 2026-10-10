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
    "Nomor telepon harus tetap memiliki angka 0 di depan. Jumlah paket dipakai untuk menghitung banyak barang. Berat boleh berupa angka desimal. Status siap hanya memiliki dua keadaan: benar atau salah.",
    [
      field(
        "phone",
        'Jenis data untuk nomor telepon "08123"',
        ["String", "Integer", "Float", "Boolean"],
        "String",
      ),
      field(
        "count",
        "Nilai jumlah_paket jika ada tiga paket",
        ["3", '"3"', "3.5", "True"],
        "3",
      ),
      field(
        "weight",
        "Jenis data untuk berat 2.75 kg",
        ["String", "Integer", "Float", "Boolean"],
        "Float",
      ),
      field(
        "ready",
        "Nilai siap jika pengiriman sudah disetujui",
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
    'Rak awal ["Pangan", "Kayu", "Batu"]. Ganti Kayu menjadi Air, hapus Batu, lalu tambahkan Obat. Pilih perintah Python. Rak hasilnya akan terlihat di pratinjau.',
    [
      field("index", "Indeks Kayu", ["0", "1", "2"], "1"),
      field(
        "set",
        "Perintah mengganti Kayu",
        ['rak[0] = "Air"', 'rak[1] = "Air"', 'rak[2] = "Air"'],
        'rak[1] = "Air"',
      ),
      field(
        "remove",
        "Perintah menghapus Batu setelah penggantian",
        ["rak.pop(0)", "rak.pop(1)", "rak.pop(2)"],
        "rak.pop(2)",
      ),
      field(
        "append",
        "Perintah menambahkan Obat",
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
    "Kapal boleh membawa paling banyak 10 kg. Energi tiap perjalanan tercantum pada data A–D. Berangkat jika berat ≤ 10, energi ≥ 12, dan siap = True. Periksa semua syarat pada setiap perjalanan.",
    [
      field(
        "a",
        "A: berat 10, energi 12, siap True",
        ["Berangkat", "Tunda"],
        "Berangkat",
      ),
      field(
        "b",
        "B: berat 8, energi 18, siap False",
        ["Berangkat", "Tunda"],
        "Tunda",
      ),
      field(
        "c",
        "C: berat 11, energi 20, siap True",
        ["Berangkat", "Tunda"],
        "Tunda",
      ),
      field(
        "d",
        "D: berat 9, energi 13, siap True",
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
    "Gerbang menerima pesanan jika stok cukup, termasuk saat stok sama dengan pesanan. Jika stok kurang, pesanan ditunda. Panah menunjukkan urutan langkah.",
    [
      field(
        "first",
        "Langkah setelah Mulai",
        ["Input stok, pesanan", "Output Terima", "stok ≥ pesanan?"],
        "Input stok, pesanan",
      ),
      field(
        "symbol",
        "Simbol untuk input",
        ["Jajar genjang", "Belah ketupat", "Persegi panjang"],
        "Jajar genjang",
      ),
      field(
        "condition",
        "Kondisi pada belah ketupat",
        ["stok ≥ pesanan", "stok > pesanan", "stok < pesanan"],
        "stok ≥ pesanan",
      ),
      field("yes", "Cabang YA", ["Terima", "Tunda"], "Terima"),
      field("no", "Cabang TIDAK", ["Terima", "Tunda"], "Tunda"),
    ],
  ),
  make(
    2,
    2,
    "Jalankan Gerbang",
    "C3",
    "flow-trace",
    "Gunakan diagram stok ≥ pesanan. Tentukan jalur dan keluaran untuk setiap pasangan data.",
    [
      field(
        "a",
        "Stok 2, pesanan 3",
        ["YA → Terima", "TIDAK → Tunda"],
        "TIDAK → Tunda",
      ),
      field(
        "b",
        "Stok 3, pesanan 3",
        ["YA → Terima", "TIDAK → Tunda"],
        "YA → Terima",
      ),
      field(
        "c",
        "Stok 5, pesanan 3",
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
    "Gerbang saat ini memakai stok > pesanan. Akibatnya, stok 3 untuk pesanan 3 ditolak. Padahal, stok yang tepat cukup seharusnya diterima.",
    [
      field(
        "cause",
        "Penyebab kegagalan",
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
        "Tanda pembanding untuk memperbaiki gerbang",
        [">", ">=", "<", "=="],
        ">=",
        40,
      ),
      field("a", "Hasil stok 2, pesanan 3", ["Terima", "Tunda"], "Tunda", 10),
      field("b", "Hasil stok 3, pesanan 3", ["Terima", "Tunda"], "Terima", 10),
      field("c", "Hasil stok 4, pesanan 3", ["Terima", "Tunda"], "Terima", 10),
    ],
  ),
  make(
    3,
    1,
    "Rakit Pengendali",
    "C3",
    "pseudocode",
    "Pengendali membaca jumlah paket x, menghitung kebutuhan energi dua kali jumlah paket, lalu menampilkan y. Lengkapi urutan dan hasil uji.",
    [
      field("one", "Baris 1", ["INPUT x", "OUTPUT y", "y ← x × 2"], "INPUT x"),
      field(
        "two",
        "Baris 2",
        ["INPUT x", "OUTPUT y", "y ← x × 2"],
        "y ← x × 2",
      ),
      field(
        "three",
        "Baris 3",
        ["INPUT x", "OUTPUT y", "y ← x × 2"],
        "OUTPUT y",
      ),
      field("a", "Output ketika x = 3", ["3", "6", "9"], "6"),
      field("b", "Output ketika x = 7", ["7", "14", "49"], "14"),
    ],
  ),
  make(
    3,
    2,
    "Atur Pengiriman",
    "C3",
    "pseudocode",
    "Biaya pengiriman Rp4.000 untuk jarak hingga 5 km (termasuk 5 km), dan Rp7.000 untuk jarak lebih dari 5 km. Terapkan pseudocode pada tiga pengiriman.",
    [
      field(
        "condition",
        "Kondisi setelah IF (jika)",
        ["jarak < 5", "jarak ≤ 5", "jarak > 5"],
        "jarak ≤ 5",
      ),
      field("a", "Biaya untuk 2 km (rupiah)", ["4000", "7000"], "4000"),
      field("b", "Biaya untuk 5 km (rupiah)", ["4000", "7000"], "4000"),
      field("c", "Biaya untuk 8 km (rupiah)", ["4000", "7000"], "7000"),
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
    "Kebutuhan energi adalah jumlah paket × 2. Pada kode di bawah, ketika jumlah paket 3, program mencoba menampilkan energi yang belum memiliki nilai.",
    [
      field(
        "cause",
        "Penyebab gangguan",
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
        "Perbaikan",
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
        "Output paket = 0 setelah perbaikan",
        ["0", "2", "Tidak tersedia"],
        "0",
        15,
      ),
      field(
        "b",
        "Output paket = 4 setelah perbaikan",
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
    "Operator memasukkan 12 dan 8. Tentukan tujuan data dan unit yang bekerja pada tiap langkah untuk menghasilkan penjumlahan.",
    [
      field(
        "input",
        "Data dari keyboard disimpan sementara di…",
        ["RAM", "Monitor", "ALU"],
        "RAM",
      ),
      field(
        "control",
        "Unit yang mengatur pembacaan instruksi…",
        ["CU", "RAM", "Monitor"],
        "CU",
      ),
      field(
        "calc",
        "Unit yang menjumlahkan kedua nilai…",
        ["ALU", "Keyboard", "RAM"],
        "ALU",
      ),
      field(
        "output",
        "Hasil 20 ditampilkan melalui…",
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
    "RAM: alamat 10 berisi 12, alamat 11 berisi 8. LOAD [10] membaca isi alamat 10; ADD [11] menambahkan isi alamat 11; STORE [12] menyimpan hasil. Tentukan nilai setelah setiap instruksi dijalankan.",
    [
      field("load", "Akumulator setelah LOAD [10]", ["10", "12", "0"], "12"),
      field("add", "Akumulator setelah ADD [11]", ["21", "19", "20"], "20"),
      field(
        "store",
        "Isi RAM alamat 12 setelah STORE [12]",
        ["12", "20", "8"],
        "20",
      ),
      field("out", "OUTPUT [12] menampilkan…", ["12", "20", "10"], "20"),
    ],
    { snippet: "LOAD [10]\nADD [11]\nSTORE [12]\nOUTPUT [12]" },
  ),
  make(
    4,
    3,
    "Alamat atau Isi?",
    "C4",
    "memory-debug",
    "RAM[10] = 12 dan RAM[11] = 8. Program salah menjumlahkan angka alamat 10 + 11 sehingga hasilnya 21. Targetnya jumlah isi kedua sel.",
    [
      field(
        "cause",
        "Mengapa hasil menjadi 21?",
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
        "Data yang harus dikirim ke ALU",
        ["10 dan 11", "12 dan 8", "10 dan 8"],
        "12 dan 8",
        40,
      ),
      field(
        "test",
        "Jika RAM[10] diubah menjadi 15, hasil yang benar…",
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
    "Program awal membaca daftar nilai lima murid, tetapi perhitungan rata-ratanya salah. Hasil yang diminta adalah satu angka rata-rata dari daftar tersebut.",
    [],
    {
      code: "nilai = [70, 80, 90, 60, 100]\ntotal = sum(nilai)\nrata = total / 4\nprint(rata)",
      expectedOutput: "80",
      reference:
        "sum(list) menjumlahkan isi list; len(list) menghitung jumlah elemen. / melakukan pembagian.",
    },
  ),
  make(
    5,
    2,
    "Perbaiki Daftar",
    "C4",
    "python-debug",
    'Untuk daftar awal pada kode, hasil yang diminta adalah ["Pangan", "Air", "Obat"]. Saat ini Air justru hilang setelah program dijalankan.',
    [
      field(
        "cause",
        "Mengapa Air hilang?",
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
        "Setelah perbaikan, nilai kargo[1] adalah…",
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
    "Evaluasi dua program rata-rata. Syarat: benar untuk 5 maupun 3 murid, dapat menangani list kosong tanpa membagi nol, dan mudah diperiksa. Pilih solusi serta jelaskan memakai hasil uji, bukan hanya pilihan A/B.",
    [],
    {
      snippet:
        'A: rata = sum(nilai) / 5\n\nB: IF len(nilai) > 0 THEN\n     rata = sum(nilai) / len(nilai)\n   ELSE\n     OUTPUT "Belum ada nilai"',
      written: [
        ["choice", "Solusi pilihan dan keputusanmu"],
        [
          "evidence",
          "Bandingkan A dan B untuk [70,80,90,60,100], [60,80,100], dan []. Tuliskan hasilnya.",
        ],
        [
          "reason",
          "Jelaskan kelebihan, keterbatasan, dan alasan berdasarkan ketiga syarat.",
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
    "Rancang sistem distribusi bantuan. Terima stok dan jumlah permintaan; kirim bila keduanya tidak negatif dan stok cukup. Tampilkan keputusan serta sisa stok. Jika stok kurang, tunda pengiriman dan biarkan stok tetap. Jika masukan negatif, tampilkan pesan tidak valid dan jangan lakukan pengiriman; jelaskan bahwa sisa stok belum dihitung. Tentukan data, buat algoritma sendiri, dan rancang kasus normal, batas, serta input tidak valid.",
    [],
    {
      enrichment: true,
      scene: "ruang-arsitek",
      written: [
        ["design", "Variabel, tipe data, input dan output rancanganmu"],
        ["solution", "Tulis algoritma/pseudocode atau Python buatanmu"],
        [
          "tests",
          "Buat minimal tiga kasus uji: normal, stok sama dengan permintaan, dan input tidak valid. Sertakan hasil yang diharapkan.",
        ],
        [
          "reason",
          "Jelaskan cara solusi menangani kondisi batas dan alasan rancanganmu",
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
