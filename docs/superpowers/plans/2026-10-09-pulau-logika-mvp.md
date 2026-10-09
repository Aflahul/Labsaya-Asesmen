# Pulau Logika MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menghasilkan game asesmen dengan 16 misi inti, dua misi pengayaan, akun peserta, penyimpanan Neon, leaderboard dan dashboard guru, serta ZIP distribusi yang telah diuji.

**Architecture:** Satu repositori berisi frontend Phaser/HTML dan API Node.js same-origin. Evaluator, penilaian, dan kontrak data dibagi sebagai modul yang dipakai frontend dan server. Neon PostgreSQL menyimpan sesi dan tindakan; cache browser menyediakan pengerjaan offline setelah login.

**Tech Stack:** Node.js 24 LTS, JavaScript ESM, Phaser 3, Vite, Fastify, `pg`, PostgreSQL Neon, Vitest, Playwright. Password guru menggunakan `node:crypto` scrypt. Versi dependensi dikunci melalui package-lock.json; pilih rilis stabil kompatibel saat instalasi.

**Spec:** `docs/superpowers/specs/2026-10-09-pulau-logika-design.md`.

## Global Constraints

- Sembilan pulau, dua misi per pulau: 16 misi inti dan dua misi pengayaan.
- Login peserta menggunakan nama asli + nama samaran; guru menggunakan username + kata sandi.
- Nilai inti hanya dihitung setelah 16 misi inti tuntas; pengayaan terpisah.
- Bobot tetap 40% ketepatan, 25% waktu, 20% percobaan, 15% petunjuk.
- Aset runtime lokal, tidak ada API grafis/audio eksternal; akun dan sinkronisasi membutuhkan internet.
- Backend memeriksa sesi/peran; koneksi Neon tidak masuk frontend, ZIP publik, atau log.
- Nilai terbaru, terbaik, dan kumulatif berbeda; waktu perjalanan/tab tersembunyi tidak dinilai.
- Gunakan checkout yang tersedia; cloud task sudah terisolasi, tanpa membuat worktree.
- Jangan deploy, mempublikasikan leaderboard nyata, atau memasukkan data peserta nyata selama pengembangan.

## Review Focus

- Nama Indonesia dengan spasi, Unicode dan kapitalisasi: konsisten, tanpa salah menggabungkan akun; uji Task 4.
- Dua perangkat mengirim event sama atau sesi berbeda: tidak menggandakan dan tidak menghapus bukti; uji Task 5.
- Browser reload/ditutup saat tugas aktif: tidak menghitung waktu offline dan tidak menghapus riwayat; uji Task 3/7.
- Jawaban simulasi atau nilai klien dimanipulasi: server menolak state ilegal dan menghitung sendiri; uji Task 2/5.
- Peserta bernama seperti formula spreadsheet, serta guru mengekspor hasil terfilter: CSV aman dan cakupan tepat; uji Task 8.

## Struktur dan kontrak bersama

`src/shared/` berisi `contracts.js`, `missions.js`, `evaluators/`, `assessment.js`, `progress.js`; `src/client/` berisi `main.js`, `storage.js`, `timer.js`, `sync.js`, `world/`, `ui/`, `audio.js`, `styles.css`; `src/server/` berisi `app.js`, `db.js`, `auth.js`, `routes/`; `migrations/`, `scripts/`, `tests/unit/`, `tests/api/`, `tests/browser/`, dan `docs/` melengkapi produk.

Kontrak dalam JSDoc, divalidasi saat runtime:

- `Mission`: `{id,island,kind,enrichment,competency,indicators,title,narrative,instructions,elements,initialState,hints,rules,canonicalSteps}`.
- `Evaluation`: `{complete,accuracy,errors,feedback}`; `accuracy` 0–100, `errors` array kode domain.
- `Event`: `{id,sessionId,seq,type,payload,activeMs}`; waktu harus finite dan tidak negatif.
- `Session`: `{id,participantId,missionId,missionVersion,scoringConfig,events,state,firstAccuracy,attempts,errors,resets,hints,activeMs,status,startedAt,completedAt,components,score,source}`.
- `Progress`: `{participantId,sessions,latestByMission,bestByMission,cumulativeByMission}`.

ID misi `p01m01`…`p09m02`; versi katalog awal `1`. Definisikan semua nilai JSON terserialisasi, tanpa referensi engine atau objek DOM. API menggunakan envelope `{data}` atau `{error:{code,message}}` dan tidak mengirim stack trace.

### Task 1: Katalog, scaffold, dan kontrak MVP

**Files:** Create `package.json`, `package-lock.json`, `.gitignore`, `index.html`, `vite.config.js`, `src/shared/contracts.js`, `src/shared/missions.js`, `src/client/main.js`, `tests/unit/catalog.test.js`.

**Interfaces:** Produces `MISSIONS: Mission[]`, `getMission(id): Mission`, `validateEvent(value): Event`.

- [ ] Tulis tes `catalog_has_16_core_and_2_enrichment`: panjang 18, ID unik, delapan kompetensi inti, dua misi setiap pulau, hanya pulau 9 enrichment; `event_rejects_nan_negative_time_and_unknown_type` harus menolak input tersebut.
- [ ] Siapkan runner dan jalankan `npm run test:unit -- tests/unit/catalog.test.js`; pastikan gagal karena katalog/validator belum ada.
- [ ] Isi katalog lengkap sesuai tabel spec, termasuk keadaan awal, aturan, petunjuk, narasi dampak dan kode indikator internal seperti `CT.DEC.1`, `FC.1`, `PC.1`, `VN.1`, `ARR.1`, `ENR.SORT.1`; panduan membedakan kode internal dari TP kurikulum resmi. Buat scaffold frontend minimal dan validasi kontrak.
- [ ] Jalankan tes katalog dan `npm run build`; keduanya harus lulus. Commit hanya file Task 1 dengan pesan `feat: define MVP mission catalog and contracts`.

### Task 2: Evaluator interaksi dan simulator

**Files:** Create `src/shared/evaluators/{index,selection,grouping,pattern,ordering,robot,flowchart,pseudocode,von-neumann,array,bubble-sort}.js`, `tests/unit/evaluators.test.js`, `tests/fixtures/solutions.js`.

**Interfaces:** Consumes `Mission`; produces `applyAction(mission,state,action): {state,errors}`, `evaluate(mission,state): Evaluation`, `runProgram(blocks,input): {output,trace,errors}`. Fixtures menyediakan solusi sebagai tindakan pengguna, bukan state lengkap yang dilewatkan ke UI.

- [ ] Tulis tes berparameter untuk semua 18 misi: initial state belum complete; solusi benar complete; satu jawaban/tindakan salah memberi feedback; perbaikan dapat complete. Tambahkan `bubble_sort_rejects_non_adjacent_swap`, `robot_rejects_wall`, `flowchart_tests_both_branches`, `array_rejects_out_of_bounds`, `program_rejects_cycle_or_excess_steps`.
- [ ] Jalankan `npm run test:unit -- tests/unit/evaluators.test.js`; harus gagal sebelum evaluator diimplementasikan.
- [ ] Implementasikan evaluator murni dan simulator langkah terbatas maksimal 1.000 langkah; flowchart wajib satu start/end serta edge legal; indeks array dimulai 0; Von Neumann memodelkan PC, IR, accumulator dan memori. Bubble Sort memeriksa pasangan bertetangga sesuai pass aktif. Jangan gunakan `eval` atau `Function`.
- [ ] Jalankan tes sampai semua 18 misi dan kasus ilegal lulus; commit `feat: implement activity validators and simulations`.

### Task 3: Mesin asesmen, progres dan timer

**Files:** Create `src/shared/assessment.js`, `src/shared/progress.js`, `src/client/timer.js`, `tests/unit/{assessment,progress,timer}.test.js`.

**Interfaces:** Produces `scoreSession(metrics,config): {K,W,P,H,score}`, `reduceSession(session,event,mission): Session`, `summarizeProgress(progress): Summary`, `createActiveTimer({now,onCheckpoint}): {start,pause,readMs,dispose}`. Config `{baselineMultiplier:1}` disalin ke sesi; guru dapat mengubah multiplier 0.5–3 untuk sesi berikutnya.

- [ ] Tulis tes: komponen 100 menghasilkan 100; komponen 100/80/75/60 menghasilkan 84; satu petunjuk H=60; waktu satu baseline W=100, tiga baseline W=0; firstAccuracy tidak berubah setelah reset; duplikasi completion tidak mengubah skor; replay lebih rendah mempertahankan best; 15/16 inti tidak mempunyai nilai final; enrichment tidak mengubah rata-rata inti.
- [ ] Tambahkan timer fake-clock: hanya waktu interactive+visible dihitung; reload memulai checkpoint baru tanpa menjumlahkan jeda offline; pengaturan audio tidak memengaruhi timer. Jalankan `npm run test:unit -- tests/unit/assessment.test.js tests/unit/progress.test.js tests/unit/timer.test.js`; harus gagal sebelum implementasi.
- [ ] Implementasikan rumus spec dan reducer event. Tahap penyusunan tidak menaikkan attempts; submit/run menaikkan; step simulasi mengacu pada run aktif. Checkpoint tiap 2 detik, setiap tindakan penting, pause/visibilitychange/pagehide. State sukses menutup timer. Session terbaik adalah snapshot, bukan gabungan metrik sesi lain.
- [ ] Jalankan tes tersebut sampai lulus; commit `feat: add auditable assessment and active timing`.

### Task 4: Neon, akun peserta dan autentikasi guru

**Files:** Create `src/server/{app,db,auth}.js`, `src/server/routes/auth.js`, `migrations/001_accounts.sql`, `scripts/{migrate,create-teacher}.js`, `.env.example`, `tests/api/auth.test.js`.

**Interfaces:** Produces `buildApp({db,clock}): FastifyInstance`, `requireParticipant(request): Participant`, `requireTeacher(request): Teacher`. Endpoints `POST /api/register`, `POST /api/login`, `POST /api/teacher/login`, `POST /api/logout`, `GET /api/me`; réponses tidak berisi password/hash/token sesi.

- [ ] Tulis tes daftar/login, nama samaran duplikat setelah Unicode NFC+trim+collapse whitespace+lowercase, dua nama asli sama dengan alias berbeda tetap berbeda; nomor absen integer 1–999, nama 1–100 karakter, kelas 1–50; nama asli salah memberi pesan login generik. Uji akun peserta tidak bisa memperoleh peran guru, CSRF, cookie dan logout.
- [ ] Jalankan `npm run test:api -- tests/api/auth.test.js` menggunakan database test; harus gagal sebelum routes dibuat. Database test wajib terpisah dari produksi dan tidak memakai data peserta nyata.
- [ ] Implementasikan tabel peserta/guru/sesi, username guru unik, scrypt dengan salt acak, token sesi acak minimal 32 byte yang disimpan sebagai hash, masa sesi 7 hari, cookie same-origin HttpOnly/SameSite=Lax/Secure pada HTTPS. Validasi Origin untuk perubahan dan token CSRF per sesi. Rate limit login 10 percobaan/menit per IP plus akun. Script create-teacher meminta password melalui input terminal tersembunyi, bukan argumen/log/default.
- [ ] Gunakan `DATABASE_URL` hanya pada server, `TEST_DATABASE_URL` khusus tes, TLS verifikasi tetap aktif; `.env` diabaikan Git dan contoh hanya nama variabel. Periksa binding yang tersedia sebelum meminta pengguna memasukkan koneksi secara aman. Jalankan migrasi dua kali untuk memverifikasi tabel riwayat migrasi mencegah duplikasi.
- [ ] Jalankan tes API hingga lulus pada PostgreSQL dan uji koneksi Neon read-only/migrasi target development yang diotorisasi. Jika Neon belum tersedia, lanjutkan task mandiri dan catat integrasi Neon belum terverifikasi. Commit `feat: add database schema and role-based authentication`.

### Task 5: Penyimpanan hasil dan sinkronisasi aman

**Files:** Create `migrations/002_assessment.sql`, `src/server/routes/progress.js`, `src/client/{storage,sync}.js`, `tests/api/progress.test.js`, `tests/unit/storage-sync.test.js`.

**Interfaces:** Consumes evaluator/reducer Tasks 2–3; produces `createProgressStore(storage,participantId): {load,save,enqueue,pending,acknowledge}`, `syncProgress({store,api}): Promise<Progress>`. API `GET /api/progress`, `POST /api/sessions`, `POST /api/sessions/:id/events` accepts ordered Event batches and returns accepted IDs and authoritative session.

- [ ] Tulis tes isolasi akun A/B, sesi misi dua perangkat tetap terpisah, retry event id sama tidak menggandakan, id sama payload berbeda ditolak 409, seq melompat ditolak 409, nilai kiriman palsu diabaikan/dihitung server, state ilegal ditolak 422, waktu NaN/negatif ditolak 400, sesi peserta lain ditolak 403.
- [ ] Tulis tes cache rusak tidak menimpa backup, quota gagal memberi status unsaved, offline membuat pending, koneksi pulih mengirim sekali, pergantian akun tidak mengirim antrean A menggunakan sesi B. Jalankan kedua file tes; harus gagal sebelum implementasi.
- [ ] Implementasikan transaksi dan unique `(session_id,seq)` serta event ID. Server replay event lewat evaluator dan reducer; checkpoint waktu memiliki batas monoton dan plausible terhadap durasi sesi, tetapi sumber offline tetap tidak bisa dibuktikan penuh. Simpan versi/config immutable, latest/best/session asal serta status source. Gunakan fetch credentials same-origin; 401 menghentikan retry dan meminta login.
- [ ] Implementasikan skema cache berversi, checkpoint otomatis, status pending/synced/failed dan backup ekspor. Jangan menggabungkan event dua sesi menjadi satu run. Jalankan tes hingga lulus; commit `feat: sync participant evidence with idempotent events`.

### Task 6: Dunia 2.5D dan perjalanan

**Files:** Create `src/client/world/{WorldScene,island-art,transitions}.js`, `src/client/audio.js`, `src/client/ui/{shell,settings}.js`, `src/client/styles.css`, `tests/browser/world.spec.js`.

**Interfaces:** Produces `createWorld(container,{onTravelStart,onTravelEnd}): {travelTo,islandRecovered,setQuality,setReducedMotion,destroy}`, `travelTo(islandId,{skip}): Promise<void>`, `createAudio(): {unlock,play,setMuted,destroy}`. World tidak membaca/menulis skor; callbacks mengubah alasan pause timer.

- [ ] Tulis browser test start→pulau 1, skip menyelesaikan Promise tepat sekali, perjalanan batal tidak membuka task lama, reduced-motion tanpa tween panjang, unlock audio setelah gesture, mute tersimpan. Jalankan `npm run test:browser -- tests/browser/world.spec.js`; harus gagal sebelum UI/world dibuat.
- [ ] Buat sembilan ilustrasi lokal konsisten memakai bentuk vektor/sprite generated lokal, parallax, karakter, portal, camera pan/zoom, recovery state. Tombol HTML tetap dapat dioperasikan saat efek dikurangi. Buat audio klik/interaksi/benar/salah/misi/portal/perjalanan/akhir melalui Web Audio, tanpa fetch aset eksternal.
- [ ] Jalankan tes dan ukur animasi pada browser uji, catat perangkat/hasil tanpa mengklaim semua laptop 60 FPS. Commit `feat: add island world travel and audio`.

### Task 7: Alur pemain dan seluruh UI tugas

**Files:** Create `src/client/ui/{auth,map,mission,activity-renderers,feedback}.js`, `src/client/controller.js`, `tests/browser/{activities,journey,resume}.spec.js`.

**Interfaces:** Consumes Tasks 1–6; produces `renderActivity(container,{mission,state,onAction}): {update,dispose}`, `createController({store,world,api,timer}): {navigate,dispatch,dispose}`. `navigate(route)` menggunakan route home/login/map/mission/report/teacher; semua perubahan domain lewat dispatch Event.

- [ ] Tulis tes UI untuk semua kind: kontrol keyboard dan pilih/tempatkan mengirim action sama dengan drag. Uji feedback salah, perbaikan, hints sekali per permintaan, reset tetap menyimpan metrik, 18 misi dari fixture dijalankan lewat klik/keyboard bukan setter state.
- [ ] Tulis tes locked island, 16 misi selesai membuka rapor inti tanpa enrichment, dua enrichment terpisah; reload mempertahankan state/metrik; tab hide dan travel tidak menambah activeMs; context browser baru dengan akun sama memuat progres synced. Jalankan tes browser dan pastikan kegagalan sebelum implementasi.
- [ ] Implementasikan form identitas/login, onboarding, peta, task area, status, timer, hints, run/submit/reset, replay, recovery dan perjalanan. Flowchart memakai selectable nodes/edge controls dengan alternatif keyboard; pseudocode memakai move-up/down serta test inputs; array menampilkan indeks; simulator menampilkan state berubah. Update fokus setelah dialog/navigasi dan gunakan aria-live untuk feedback.
- [ ] Terapkan satu state machine untuk home/travel/interactive/blocked/success, checkpoint sebelum navigate dan abort render lama. Uji viewport 1440×900, 768×1024, 390×844 tanpa overflow kontrol. Jalankan suites sampai semua 18 misi complete lewat UI; commit `feat: connect complete MVP player journey`.

### Task 8: Rapor peserta, dashboard guru dan leaderboard

**Files:** Create `src/shared/reports.js`, `src/server/routes/{teacher,leaderboard}.js`, `src/client/ui/{report,teacher,leaderboard}.js`, `tests/unit/reports.test.js`, `tests/api/teacher.test.js`, `tests/browser/reports.spec.js`.

**Interfaces:** Produces `buildReport(progress): Report`, `toCsv(rows): string`, `exportJson(progress): string`. API `GET /api/teacher/participants?class=&query=&complete=&page=`, `GET /api/teacher/participants/:id/report`, `GET /api/teacher/export?class=&query=&complete=`, `GET /api/leaderboard?page=`. Gunakan pagination 50 baris, maksimal 100; ekspor seluruh filter, bukan hanya halaman aktif.

- [ ] Tulis tes 15/16 inti tetap incomplete, summary kompetensi dua misi, enrichment terpisah, terbaik/terbaru tidak mencampur metrik, leaderboard tie mendapat peringkat sama dan hanya alias/rank/score. Uji nama `=SUM(1,1)` dan kutip/koma/newline aman dalam CSV serta JSON valid.
- [ ] Tulis tes peserta tidak dapat akses teacher endpoints atau report akun lain, guru filter kelas memperoleh jumlah/rekap/ekspor identik, leaderboard tidak berisi nama asli/absen, guru logout ditolak. Jalankan tests reports/teacher sebelum implementasi.
- [ ] Implementasikan dashboard identitas/filter/progres/kompetensi/detail sesi/event dan status last-sync. Export CSV UTF-8 BOM dan neutralisasi prefiks formula `= + - @` setelah whitespace; JSON menyertakan schemaVersion. Kalibrasi guru melalui `PUT /api/teacher/scoring-config`, gunakan multiplier Task 3 hanya untuk sesi baru; uji snapshot lama tidak berubah.
- [ ] Implementasikan login guru, tabel responsif, rincian per misi, laporan konfirmasi guru, backup JSON/import tervalidasi dengan konfirmasi penggantian, dan hapus cache lokal dengan konfirmasi. Uji import payload milik akun lain ditolak dan data lama tidak berubah jika validasi gagal. Jalankan tests dan commit `feat: add teacher assessment dashboard and reports`.

### Task 9: Integrasi akhir, dokumentasi dan ZIP

**Files:** Create `scripts/{package,serve-local}.js`, `PANDUAN_GURU.md`, `PETUNJUK.txt`, `HASIL_UJI.md`, `DEPLOYMENT.md`, `THIRD_PARTY_NOTICES.md`, `tests/browser/offline.spec.js`; update scripts build/test pada `package.json`.

**Interfaces:** Produces `npm run build`, `npm start` (API + distribusi pada origin sama), `npm run package` → `artifacts/Pulau-Logika-MVP.zip`. ZIP berisi `app/` build lokal, `server/` source/API+manifest+lockfile, `migrations/`, scripts setup, dan dokumen; tidak menyertakan `.env`, kredensial, node_modules, atau data peserta.

- [ ] Tulis tes built app mengambil seluruh aset lokal, koneksi diputus setelah login tetap dapat mengerjakan cached task, status unsynced jelas dan sync pulih, export tetap tersedia. Tambahkan verifikasi daftar ZIP menolak file secret dan memuat semua dokumen/build/migrasi.
- [ ] Konfigurasikan build frontend dengan relative base dan bundle klasik jika mendukung pengalaman file lokal yang dijanjikan. `npm start` menyajikan UI/API dari satu origin; dokumentasikan Node hanya diperlukan operator server, bukan murid hosted. Jika file:// tidak berfungsi, laporkan dan gunakan mode server lokal tanpa menjanjikan klik ganda.
- [ ] Jalankan `npm ci`, `npm run test:unit`, `npm run test:api`, `npm run build`, `npm run test:browser`, serta `npm run package`. API suite memakai TEST_DATABASE_URL terpisah; kalau Neon development belum terhubung, jangan mengklaim integrasi nyata lulus dan jangan menyatakan produk final siap.
- [ ] Periksa login, pendaftaran, migrasi dan satu penyelesaian sesi nyata di Neon development, dashboard serta leaderboard. Jangan deploy publik tanpa instruksi pengguna; koneksi dan deployment harus disediakan melalui konfigurasi aman, bukan chat. Jika prasyarat belum tersedia, selesaikan tes lokal dan laporkan operasi tepat yang tertunda.
- [ ] Lengkapi panduan pemetaan 18 misi/indikator, rumus, batas autentikasi nama, offline evidence, waktu, replay, laporan, ekspor, backup, kalibrasi dan instalasi/deployment. Isi HASIL_UJI dari hasil aktual, counts/commands/browser/platform, tidak dari ekspektasi rencana.
- [ ] Verifikasi ZIP diekstrak dan startup sesuai petunjuk pada folder baru, aset lokal dan tidak ada secret. Jalankan `git diff --check`, tinjau scope terhadap spec dan catat keterbatasan aktual; commit `chore: package tested MVP and user documentation`.

## Urutan dan kesiapan eksekusi

Tasks 1–3 mendasari semua bagian. Task 4 menyediakan autentikasi; Task 5 membutuhkan 2–4. Task 6 memakai katalog; Task 7 menyatukan 1–6. Task 8 memerlukan progres dan auth; Task 9 memerlukan semua deliverable. Jangan membangun 12 pulau/36 misi versi lama.

Sebelum koneksi nyata: periksa nama binding dan status konfigurasi, jangan mencetak nilai; tentukan proyek Neon development/test dan target hosting yang tersedia. Prasyarat eksternal ini tidak menghalangi evaluator, visual, laporan dan API dengan database test lokal jika runtime tersedia. Persistensi Neon dan deployment hanya dinyatakan terverifikasi setelah operasi aktual berhasil.

## Hasil self-review rencana

Seluruh cakupan spec dipetakan: 18 misi Tasks 1/2/7; dunia/audio Task 6; penilaian/timer Task 3; akun/Neon Tasks 4/5; guru/rapor/export/kalibrasi Task 8; offline Tasks 5/7/9; dokumentasi/ZIP Task 9. Kontrak nama serta session/progress sama antar-task. Lima risiko Review Focus memiliki tes pada task pemilik. Tidak ada source aplikasi dibuat atau dependensi diinstal selama penyusunan rencana.
