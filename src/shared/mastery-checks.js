import { getIndicatorRubric } from "./indicator-rubrics.js";
const variants={
  "v2p01m01": "Nomor kontaknya \"00721\", berat 1.5 kg, paket 4, belum disetujui. Tuliskan tipe kontak/berat dan nilai paket/persetujuan.",
  "v2p01m02": "Rak baru [\"Buku\",\"Kayu\",\"Batu\",\"Peta\"]. Tulis langkah mengganti Kayu dengan Air, menghapus Batu, lalu menambah Obat tanpa menghapus Peta.",
  "v2p01m03": "Syaratnya berat paling banyak 10 kg, energi sedikitnya 12, disetujui. Tentukan keputusan dan alasan untuk (10,12,True) serta (7,15,False).",
  "v2p02m01": "Gerbang baru menerima jika persediaan cukup. Untuk stok 6 dan pesanan 6, tulis input, simbol input, kondisi, serta keluaran YA dan TIDAK.",
  "v2p02m02": "Stok 8. Tulis cabang dan keputusan untuk pesanan 7, 8, dan 9 menggunakan stok>=pesanan.",
  "v2p02m03": "Gerbang memakai stok>pesanan. Stok 6, pesanan 6 ditolak. Jelaskan perbaikannya dan bandingkan == dengan >= saat stok 7, pesanan 6.",
  "v2p03m01": "Setiap peti memerlukan 3 unit energi. Tulis urutan membaca peti, menghitung energi, dan menampilkan; hitung untuk 0 dan 4 peti.",
  "v2p03m02": "Ongkos sampai 6 km adalah 5000; di atasnya 8000. Tulis kondisi serta ongkos untuk 4, 6, dan 9 km.",
  "v2p03m03": "Program membaca peti, menampilkan energi, baru menghitung peti×3. Apa kesalahannya? Tulis urutan benar dan hasil untuk 0 serta 5 peti.",
  "v2p04m01": "Nara mengetik 7 dan 9 untuk dijumlahkan. Komponen mana menyimpan data, mengatur instruksi, menghitung, serta menampilkan hasil?",
  "v2p04m02": "RAM[20]=7, RAM[21]=9. Tulis nilai setelah LOAD [20], ADD [21], STORE [22], OUTPUT [22].",
  "v2p04m03": "RAM[30]=4 dan RAM[31]=9. Program menghasilkan 61. Jelaskan kesalahan dan nilai yang benar. Jika RAM[30] menjadi 6, berapa hasilnya?",
  "v2p05m01": "Tulis Python untuk rata-rata daftar nilai dengan panjang yang berubah. Tunjukkan hasil untuk [10,20] dan [10,20,30,40].",
  "v2p05m02": "Daftar baru [\"Buku\",\"Kayu\",\"Batu\",\"Peta\"]. Setelah indeks1 diganti Air, pop(1) menghilangkan Air. Jelaskan dan tulis kode perbaikan yang mempertahankan Peta serta menambah Obat.",
  "v2p05m03": "Bandingkan A=sum(nilai)/4 dan B yang membagi len(nilai) hanya jika tidak kosong. Pilih dan jelaskan hasil untuk [20,40], [20,40,60,80] dan [].",
  "v2p05m04": "Rancang pemeriksa baru: 3 energi per paket, berat paling banyak 8 kg, persetujuan wajib. Tolak angka negatif dahulu. Tulis data, langkah, hasil untuk (2,8,6,True), (2,7,5,True), (-1,4,8,True), dan jelaskan batasnya."
};
export function getMasteryCheck(missionId, indicatorId) {
  if (!getIndicatorRubric(missionId).indicators.some(i=>i.id===indicatorId)) throw Error("Indikator tidak ditemukan");
  const prompt=variants[missionId];
  return {id:`${indicatorId}.transfer-v1`,version:1,indicatorId,prompt};
}
export function missionMasteryCheck(missionId) {
  const first=getIndicatorRubric(missionId).indicators[0];
  return getMasteryCheck(missionId,first.id);
}
