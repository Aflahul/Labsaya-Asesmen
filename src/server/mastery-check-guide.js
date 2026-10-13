// Server-only answer guides; never returned in learner sessions.
const guides={
  "v2p01m01": "String, Float, 4, False.",
  "v2p01m02": "Indeks 1 diganti Air, pop(2), append Obat; [Buku,Air,Peta,Obat].",
  "v2p01m03": "Pertama Berangkat; kedua Tunda karena belum disetujui.",
  "v2p02m01": "Jajar genjang input stok/pesanan; stok>=pesanan; YA Terima, TIDAK Tunda; 6/6 diterima.",
  "v2p02m02": "7/8: YA Terima; 9: TIDAK Tunda.",
  "v2p02m03": ">= memperbaiki batas; == menolak 7/6, >= menerima 7/6.",
  "v2p03m01": "INPUT peti; energi=peti*3; OUTPUT energi; hasil 0 dan12.",
  "v2p03m02": "jarak<=6; hasil 5000,5000,8000.",
  "v2p03m03": "Output sebelum assignment; input-proses-output; 0 dan15.",
  "v2p04m01": "RAM, CU, ALU, Monitor sesuai fungsi.",
  "v2p04m02": "7;16;RAM[22]=16;output16.",
  "v2p04m03": "Alamat dijumlahkan; isi4+9=13; perubahan6+9=15.",
  "v2p05m01": "sum(nilai)/len(nilai), print; hasil15 dan25; kode bukan pembagi tetap.",
  "v2p05m02": "pop(1) salah; pop(2) benar; hasil[Buku,Air,Peta,Obat].",
  "v2p05m03": "B; dua data A15 B30; empat A=B50; kosong A0 Bpesan; alasan panjang berubah dan kosong.",
  "v2p05m04": "Data dan tipe, validasi sebelum hitung, kebutuhan paket*3 dan AND; Berangkat, Tunda energi, Data tidak valid; batas berat8 dan energi6 termasuk diterima."
};
export const getMasteryCheckGuide = missionId => guides[missionId];
