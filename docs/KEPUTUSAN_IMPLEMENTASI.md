# Catatan keputusan implementasi

- Gunakan checkout cloud terisolasi yang tersedia; tidak membuat worktree. Repository awal kosong dan belum memiliki base branch dengan commit. Pekerjaan disimpan di branch lokal `work`; integrasi/push/publikasi menjadi tindakan terpisah.
- Ledger dikelola manual karena referensi skill cloud tidak menyediakan executable helper di filesystem. Bukti pengujian dan commit tetap dicatat; konsekuensi: audit bookkeeping manual.
- Tes awal Bubble Sort mengharapkan tidak menukar 7 dan 5; assertion dikoreksi sesuai aturan banding/tukar. Konsekuensi jika keliru: cakupan validator bisa menutupi kesalahan; solusi seluruh lintasan juga diuji melalui fixture dan browser.
- UI memakai controller bersama dan renderer aktivitas, bukan file tersendiri untuk setiap layar. Konsekuensi: controller perlu dipisah bila cakupan bertambah; domain asesmen/server tetap terpisah.
- Konflik sesi yang sama di dua perangkat mempertahankan versi server dan mengarsipkan bukti lokal yang berbeda dalam JSON, dengan status/peringatan jelas. Konsekuensi: peserta harus melanjutkan versi server atau replay; tindakan toggle tidak bisa digabung otomatis tanpa mengubah maksud peserta. Bukti konflik tidak dicampur menjadi nilai atau dihapus diam-diam.
- Akun peserta memakai kedua nama sesuai keputusan pengguna; guru memakai username/password. Deployment diarahkan ke Vercel/Neon, bukan ZIP. Neon dan Vercel nyata belum diuji karena konfigurasi tidak tersedia.
