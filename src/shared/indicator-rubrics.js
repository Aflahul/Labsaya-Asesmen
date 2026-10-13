const catalog = {
  "v2p01m01": [
    [
      "types",
      "Memilih tipe data sesuai kebutuhan",
      [
        "phone",
        "weight"
      ],
      "Nomor telepon disimpan sebagai String; berat pecahan sebagai Float.",
      "BK.3",
      null,
      "supporting"
    ],
    [
      "values",
      "Menuliskan nilai bilangan dan Boolean",
      [
        "count",
        "ready"
      ],
      "Jumlah paket adalah 3; persetujuan True.",
      "BK.5",
      null,
      "supporting"
    ]
  ],
  "v2p01m02": [
    [
      "list",
      "Mengakses dan mengubah isi list",
      [
        "index",
        "set",
        "remove",
        "append"
      ],
      "Indeks Kayu 1; ubah indeks 1, hapus indeks 2, append Obat.",
      "BK.3",
      "BK.3.1",
      "partial"
    ]
  ],
  "v2p01m03": [
    [
      "conditions",
      "Memeriksa semua syarat keberangkatan",
      [
        "a",
        "b",
        "c",
        "d"
      ],
      "Berat ≤10, energi ≥12, siap True harus terpenuhi bersama; A/D Berangkat, B/C Tunda.",
      "BK.5",
      "BK.5.1",
      "supporting"
    ]
  ],
  "v2p02m01": [
    [
      "flow",
      "Menyusun input, kondisi dan cabang flowchart",
      [
        "first",
        "symbol",
        "condition",
        "yes",
        "no"
      ],
      "Input stok dan pesanan memakai jajar genjang; stok ≥ pesanan; YA Terima, TIDAK Tunda.",
      "BK.5",
      "BK.5.2",
      "partial"
    ]
  ],
  "v2p02m02": [
    [
      "trace",
      "Menelusuri cabang termasuk nilai tepat batas",
      [
        "a",
        "b",
        "c"
      ],
      "Stok 2: TIDAK Tunda; stok 3 dan 5: YA Terima untuk pesanan 3.",
      "BK.5",
      "BK.5.1",
      "supporting"
    ]
  ],
  "v2p02m03": [
    [
      "diagnosis",
      "Menemukan dan memperbaiki pembanding batas",
      [
        "cause",
        "operator"
      ],
      "Operator > melewatkan stok yang sama; >= menerima sama atau lebih.",
      "BK.5",
      "BK.5.5",
      "partial"
    ],
    [
      "tests",
      "Menguji kelemahan usulan perbaikan",
      [
        "a",
        "b",
        "c"
      ],
      "== menunda 4/3 tetapi menerima 3/3; >= menerima 4/3.",
      "BK.5",
      "BK.5.5",
      "partial"
    ]
  ],
  "v2p03m01": [
    [
      "sequence",
      "Menyusun input, perhitungan dan output",
      [
        "one",
        "two",
        "three"
      ],
      "INPUT x lalu y ← x × 2 lalu OUTPUT y.",
      "BK.5",
      "BK.5.2",
      "partial"
    ],
    [
      "calculation",
      "Menelusuri hasil perhitungan energi",
      [
        "a",
        "b"
      ],
      "3 paket ->6; 7 paket ->14.",
      "BK.5",
      "BK.5.1",
      "supporting"
    ]
  ],
  "v2p03m02": [
    [
      "branch",
      "Memilih kondisi dan menghitung hasil percabangan",
      [
        "condition",
        "a",
        "b",
        "c"
      ],
      "jarak ≤5; jarak 2/5 ->4000; 8 ->7000.",
      "BK.5",
      "BK.5.2",
      "partial"
    ]
  ],
  "v2p03m03": [
    [
      "order",
      "Mendiagnosis dan memperbaiki urutan program",
      [
        "cause",
        "fix"
      ],
      "Output sebelum assignment; ubah INPUT -> proses -> OUTPUT.",
      "BK.5",
      "BK.5.5",
      "partial"
    ],
    [
      "tests",
      "Menguji hasil setelah memperbaiki urutan",
      [
        "a",
        "b"
      ],
      "0 paket ->0; 4 paket ->8.",
      "BK.5",
      "BK.5.5",
      "partial"
    ]
  ],
  "v2p04m01": [
    [
      "components",
      "Menentukan fungsi komponen komputer",
      [
        "input",
        "control",
        "calc",
        "output"
      ],
      "RAM menyimpan, CU mengatur, ALU menghitung, Monitor menampilkan.",
      "BK.6",
      "BK.6.1",
      "partial"
    ]
  ],
  "v2p04m02": [
    [
      "instructions",
      "Menelusuri pemrosesan instruksi dan data",
      [
        "load",
        "add",
        "store",
        "out"
      ],
      "LOAD menghasilkan 12; ADD 20; STORE menyimpan 20; OUTPUT menampilkan 20.",
      "BK.7",
      "BK.7.4",
      "partial"
    ]
  ],
  "v2p04m03": [
    [
      "address",
      "Membedakan alamat memori dari isinya",
      [
        "cause",
        "fix"
      ],
      "Alamat dipakai sebagai nilai; yang dijumlahkan 12 dan 8.",
      "BK.6",
      "BK.6.3",
      "partial"
    ],
    [
      "tests",
      "Menguji perubahan isi memori",
      [
        "test"
      ],
      "Jika RAM[10]=15 dan RAM[11]=8 hasil 23.",
      "BK.7",
      "BK.7.4",
      "partial"
    ]
  ],
  "v2p05m01": [
    [
      "program",
      "Memperbaiki program rata-rata untuk panjang list berbeda",
      [
        "code"
      ],
      "Kode menghitung sum(nilai)/len(nilai) dan print; lolos tiga uji dengan panjang list berbeda.",
      "BK.5",
      "BK.5.4",
      "partial"
    ]
  ],
  "v2p05m02": [
    [
      "diagnosis",
      "Menjelaskan penyebab kesalahan operasi list",
      [
        "cause",
        "test"
      ],
      "pop(1) menghapus Air; setelah diperbaiki indeks 1 berisi Air.",
      "BK.3",
      "BK.3.1",
      "partial"
    ],
    [
      "program",
      "Memperbaiki kode tanpa menghilangkan barang lain",
      [
        "code"
      ],
      "Ganti pop(1) dengan pop(2), append Obat dan print; barang lain tetap ada pada kedua uji.",
      "BK.5",
      "BK.5.5",
      "partial"
    ]
  ],
  "v2p05m03": [
    [
      "decision",
      "Memilih rancangan sesuai kebutuhan",
      [
        "choice",
        "reason"
      ],
      "B sesuai banyak data yang berubah, daftar kosong dan keterbacaan; pilihan didukung perbandingan.",
      "BK.5",
      "BK.5.3",
      "partial"
    ],
    [
      "evidence",
      "Membandingkan hasil tiga pengujian",
      [
        "evidence"
      ],
      "Lima data A=B=80; tiga data A=48 B=80; kosong A=0 B=pesan.",
      "BK.5",
      "BK.5.5",
      "partial"
    ],
    [
      "reason",
      "Menjelaskan kelebihan dan keterbatasan pilihan",
      [
        "reason"
      ],
      "Alasan mengaitkan panjang list, kosong dan kemudahan diperiksa; bukan sekadar B lebih baik.",
      "BK.5",
      "BK.5.3",
      "partial"
    ]
  ],
  "v2p05m04": [
    [
      "design",
      "Menentukan masukan, keluaran dan tipe data",
      [
        "design"
      ],
      "Jumlah paket integer, berat/energi numerik, persetujuan Boolean; keluaran kebutuhan energi, keputusan dan alasan.",
      "BK.5",
      "BK.5.1",
      "partial"
    ],
    [
      "solution",
      "Menyusun validasi, perhitungan dan keputusan",
      [
        "solution"
      ],
      "Tolak angka negatif sebelum hitung; kebutuhan paket×2; berat ≤10 AND energi cukup AND disetujui; output keputusan/alasan.",
      "BK.5",
      "BK.5.2",
      "partial"
    ],
    [
      "tests",
      "Menguji aturan dan data tidak valid",
      [
        "tests"
      ],
      "A energi12 Berangkat; B energi12 Tunda energi kurang; C energi8 Tunda berat/persetujuan; D Data tidak valid tanpa hitung.",
      "BK.5",
      "BK.5.5",
      "partial"
    ],
    [
      "reason",
      "Menjelaskan batas dan pilihan pesan",
      [
        "reason"
      ],
      "Berat tepat10 diterima, energi tepat cukup diterima; jelaskan satu/semua alasan penundaan.",
      "BK.5",
      "BK.5.3",
      "partial"
    ]
  ]
};
export function getIndicatorRubric(missionId) {
  if (!catalog[missionId]) throw Error("Rubrik indikator tidak ditemukan");
  return {version:1, indicators:catalog[missionId].map(([key,label,fields,requiredEvidence,tp,indicator,coverage]) => ({
    id: `${missionId}.${key}`, key, label, fields, requiredEvidence,
    tpLinks:[{tp,indicator,coverage}],
    descriptors:{1:`Masih ada kesalahan mendasar dalam ${label.toLowerCase()}.`,2:`Sebagian langkah dalam ${label.toLowerCase()} sudah sesuai; masih ada bagian penting yang perlu diperbaiki.`,3:`${label} dengan benar pada kasus misi, berdasarkan bukti jawaban dan hasil uji.`,4:`${label} pada kasus baru secara mandiri, disertai penjelasan yang sesuai.`}
  }))};
}
