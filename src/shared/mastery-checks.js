import { getIndicatorRubric } from "./indicator-rubrics.js";
const variants={
  "v2p01m01": [
    "Nomor kontaknya \"00721\", berat 1.5 kg, paket 4, belum disetujui. Tuliskan tipe kontak/berat dan nilai paket/persetujuan.",
    "String, Float, 4, False."
  ],
  "v2p01m02": [
    "Rak baru [\"Buku\",\"Kayu\",\"Batu\",\"Peta\"]. Tulis langkah mengganti Kayu dengan Air, menghapus Batu, lalu menambah Obat tanpa menghapus Peta.",
    "Indeks 1 diganti Air, pop(2), append Obat; [Buku,Air,Peta,Obat]."
  ],
  "v2p01m03": [
    "Syaratnya berat paling banyak 10 kg, energi sedikitnya 12, disetujui. Tentukan keputusan dan alasan untuk (10,12,True) serta (7,15,False).",
    "Pertama Berangkat; kedua Tunda karena belum disetujui."
  ],
  "v2p02m01": [
    "Gerbang baru menerima jika persediaan cukup. Untuk stok 6 dan pesanan 6, tulis input, simbol input, kondisi, serta keluaran YA dan TIDAK.",
    "Jajar genjang input stok/pesanan; stok>=pesanan; YA Terima, TIDAK Tunda; 6/6 diterima."
  ],
  "v2p02m02": [
    "Stok 8. Tulis cabang dan keputusan untuk pesanan 7, 8, dan 9 menggunakan stok>=pesanan.",
    "7/8: YA Terima; 9: TIDAK Tunda."
  ],
  "v2p02m03": [
    "Gerbang memakai stok>pesanan. Stok 6, pesanan 6 ditolak. Jelaskan perbaikannya dan bandingkan == dengan >= saat stok 7, pesanan 6.",
    ">= memperbaiki batas; == menolak 7/6, >= menerima 7/6."
  ],
  "v2p03m01": [
    "Setiap peti memerlukan 3 unit energi. Tulis urutan membaca peti, menghitung energi, dan menampilkan; hitung untuk 0 dan 4 peti.",
    "INPUT peti; energi=peti*3; OUTPUT energi; hasil 0 dan12."
  ],
  "v2p03m02": [
    "Ongkos sampai 6 km adalah 5000; di atasnya 8000. Tulis kondisi serta ongkos untuk 4, 6, dan 9 km.",
    "jarak<=6; hasil 5000,5000,8000."
  ],
  "v2p03m03": [
    "Program membaca peti, menampilkan energi, baru menghitung peti×3. Apa kesalahannya? Tulis urutan benar dan hasil untuk 0 serta 5 peti.",
    "Output sebelum assignment; input-proses-output; 0 dan15."
  ],
  "v2p04m01": [
    "Nara mengetik 7 dan 9 untuk dijumlahkan. Komponen mana menyimpan data, mengatur instruksi, menghitung, serta menampilkan hasil?",
    "RAM, CU, ALU, Monitor sesuai fungsi."
  ],
  "v2p04m02": [
    "RAM[20]=7, RAM[21]=9. Tulis nilai setelah LOAD [20], ADD [21], STORE [22], OUTPUT [22].",
    "7;16;RAM[22]=16;output16."
  ],
  "v2p04m03": [
    "RAM[30]=4 dan RAM[31]=9. Program menghasilkan 61. Jelaskan kesalahan dan nilai yang benar. Jika RAM[30] menjadi 6, berapa hasilnya?",
    "Alamat dijumlahkan; isi4+9=13; perubahan6+9=15."
  ],
  "v2p05m01": [
    "Tulis Python untuk rata-rata daftar nilai dengan panjang yang berubah. Tunjukkan hasil untuk [10,20] dan [10,20,30,40].",
    "sum(nilai)/len(nilai), print; hasil15 dan25; kode bukan pembagi tetap."
  ],
  "v2p05m02": [
    "Daftar baru [\"Buku\",\"Kayu\",\"Batu\",\"Peta\"]. Setelah indeks1 diganti Air, pop(1) menghilangkan Air. Jelaskan dan tulis kode perbaikan yang mempertahankan Peta serta menambah Obat.",
    "pop(1) salah; pop(2) benar; hasil[Buku,Air,Peta,Obat]."
  ],
  "v2p05m03": [
    "Bandingkan A=sum(nilai)/4 dan B yang membagi len(nilai) hanya jika tidak kosong. Pilih dan jelaskan hasil untuk [20,40], [20,40,60,80] dan [].",
    "B; dua data A15 B30; empat A=B50; kosong A0 Bpesan; alasan panjang berubah dan kosong."
  ],
  "v2p05m04": [
    "Rancang pemeriksa baru: 3 energi per paket, berat paling banyak 8 kg, persetujuan wajib. Tolak angka negatif dahulu. Tulis data, langkah, hasil untuk (2,8,6,True), (2,7,5,True), (-1,4,8,True), dan jelaskan batasnya.",
    "Data dan tipe, validasi sebelum hitung, kebutuhan paket*3 dan AND; Berangkat, Tunda energi, Data tidak valid; batas berat8 dan energi6 termasuk diterima."
  ]
};
export function getMasteryCheck(missionId, indicatorId) {
  if (!getIndicatorRubric(missionId).indicators.some(i=>i.id===indicatorId)) throw Error("Indikator tidak ditemukan");
  const [prompt,expectedEvidence]=variants[missionId];
  return {id:`${indicatorId}.transfer-v1`,version:1,indicatorId,prompt,expectedEvidence};
}
export function missionMasteryCheck(missionId) {
  const first=getIndicatorRubric(missionId).indicators[0];
  return getMasteryCheck(missionId,first.id);
}
