import "./styles.css";
import { MISSIONS, getMission } from "../shared/missions.js";
import { newSession, reduceSession } from "../shared/assessment.js";
import { summarizeProgress, unlocked } from "../shared/progress.js";
import { buildReport, toCsv, exportJson } from "../shared/reports.js";
import { createProgressStore } from "./storage.js";
import { syncProgress } from "./sync.js";
import { createActiveTimer } from "./timer.js";
import { createWorld } from "./world/WorldScene.js";
import { createAudio } from "./audio.js";
import { activityHtml, esc } from "./ui/activities.js";
const app = document.querySelector("#app");
const worldEl = document.createElement("div");
worldEl.id = "world";
document.body.prepend(worldEl);
const world = createWorld(worldEl),
  audio = createAudio(),
  timer = createActiveTimer();
let auth = null,
  progress = { sessions: [] },
  store,
  route = "home",
  active = null,
  hint = "",
  syncStatus = "Belum masuk",
  syncRunning = false,
  syncAgain = false,
  syncTimeout,
  teacherRows = [],
  reportProgress = null,
  reportIdentity = null,
  travelVersion = 0;
const $ = (s) => document.querySelector(s);
const seconds = (ms) => {
  const n = Math.floor(ms / 1000);
  return `${Math.floor(n / 60)}:${String(n % 60).padStart(2, "0")}`;
};
async function api(path, body, method) {
  const response = await fetch("/api" + path, {
    method: method || (body ? "POST" : "GET"),
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      ...(auth?.csrf ? { "x-csrf-token": auth.csrf } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  let json;
  try {
    json = await response.json();
  } catch {
    throw Error("API tidak tersedia. Periksa konfigurasi Vercel.");
  }
  if (!response.ok) {
    const e = new Error(json.error?.message || "Permintaan gagal");
    e.status = response.status;
    throw e;
  }
  return json.data;
}
function save() {
  try {
    store?.save(progress);
  } catch (e) {
    syncStatus = "Gagal menyimpan lokal — ekspor cadangan";
    showError(e.message);
  }
}
function showError(message) {
  const box = $("#error") || $('[role="status"]');
  if (box) box.textContent = message;
  else {
    const p = document.createElement("p");
    p.id = "error";
    p.className = "error panel";
    p.textContent = message;
    app.querySelector("main")?.prepend(p);
  }
}
async function sync() {
  if (auth?.role !== "participant" || !navigator.onLine) return;
  if (syncRunning) {
    syncAgain = true;
    return;
  }
  syncRunning = true;
  try {
    await syncProgress({
      progress,
      api,
      onStatus: (s) => {
        syncStatus = s;
        updateStatus();
      },
    });
    save();
  } catch (e) {
    syncStatus =
      e.status === 401
        ? "Masuk ulang untuk sinkronisasi"
        : "Belum tersinkron — tersimpan lokal";
    save();
  } finally {
    syncRunning = false;
    updateStatus();
    if (syncAgain) {
      syncAgain = false;
      setTimeout(sync, 100);
    }
  }
}
function scheduleSync() {
  clearTimeout(syncTimeout);
  syncTimeout = setTimeout(sync, 650);
}
function updateStatus() {
  for (const el of document.querySelectorAll("[data-sync]"))
    el.textContent = syncStatus;
}
function current() {
  return progress.sessions.find((s) => s.id === active);
}
function emit(type, payload = {}) {
  const s = current();
  if (!s || s.status === "complete") return;
  const event = {
    id: crypto.randomUUID(),
    sessionId: s.id,
    seq: s.events.length + 1,
    type,
    payload,
    activeMs: timer.readMs(),
  };
  const updated = reduceSession(s, event, getMission(s.missionId));
  Object.assign(s, updated);
  save();
  scheduleSync();
  if (s.status === "complete") {
    timer.pause();
    audio.play("success");
    world.islandRecovered(getMission(s.missionId).island);
  }
  if (type !== "checkpoint") {
    if (s.feedback) audio.play(s.status === "complete" ? "right" : "wrong");
    else audio.play("move");
    renderMission();
  }
}
function pause() {
  if (route === "mission" && current()?.status === "active") {
    timer.pause();
    emit("checkpoint");
  }
}
function shell(content) {
  app.innerHTML = `<header><button class="brand" data-nav="home"><span class="brand-mark">✧</span><span>Pulau Logika<small>EKSPEDISI MENARA AWAN</small></span></button><nav>${auth?.role === "participant" ? '<button class="navbtn" data-nav="map">Peta dunia</button><button class="navbtn" data-nav="report">Rapor saya</button>' : ""}${auth?.role === "teacher" ? '<button class="navbtn" data-nav="teacher">Halaman guru</button>' : ""}<button class="navbtn" data-nav="leaderboard">Leaderboard</button><button class="navbtn" data-nav="${auth?.role === "teacher" ? "teacher" : "teacher-login"}">Guru</button><button class="small ghost" id="mute" aria-label="${audio.muted ? "Aktifkan suara" : "Matikan suara"}">${audio.muted ? "♪ Off" : "♪ On"}</button><button class="small ghost" data-nav="settings" aria-label="Pengaturan">⚙</button>${auth ? '<button class="small ghost" id="logout">Keluar</button>' : ""}</nav></header><main>${content}</main><footer class="footer">ASESMEN INFORMATIKA · FASE E <span style="float:right" data-sync>${esc(syncStatus)}</span></footer>`;
}
function home() {
  world.reset();
  shell(
    `<div class="hero-shadow"></div><section class="home"><div class="hero"><div class="eyebrow">Petualangan • Berpikir • Menemukan</div><h1>Satu perjalanan.<br>Ribuan <em>kemungkinan.</em></h1><p>Menara Awan kehilangan cahayanya. Jelajahi pulau-pulau yang melayang, pecahkan tantangan, dan hubungkan kembali dunia dengan kekuatan logikamu.</p><div class="actions"><button class="primary" data-nav="${auth?.role === "participant" ? "map" : "register"}">${auth?.role === "participant" ? "Lanjutkan Petualangan" : "Mulai Petualangan"}</button>${!auth ? '<button class="ghost" data-nav="login">Sudah punya akun? Masuk ↗</button>' : ""}</div><div class="hero-foot"><span>09 PULAU<br>UNTUK DIJELAJAHI</span><span>16 MISI INTI<br>02 PENGAYAAN</span><span>BELAJAR MELALUI<br>TINDAKAN NYATA</span></div></div></section>`,
  );
}
function authForm(kind) {
  const register = kind === "register",
    teacher = kind === "teacher-login";
  shell(
    `<section class="panel auth-panel"><div class="eyebrow">${teacher ? "Ruang pendidik" : "Identitas penjelajah"}</div><h2 style="margin-top:12px">${register ? "Mulai ekspedisimu" : teacher ? "Masuk halaman guru" : "Selamat datang kembali"}</h2><p>${teacher ? "Lihat bukti belajar dan perkembangan peserta." : register ? "Gunakan nama asli untuk rapor dan nama samaran untuk leaderboard." : "Masuk dengan nama asli dan nama samaran yang sama saat mendaftar."}</p><form id="auth-form" data-kind="${kind}">${teacher ? '<label for="username">Username guru</label><input id="username" name="username" required autocomplete="username"><label for="password">Kata sandi</label><input id="password" name="password" type="password" required autocomplete="current-password">' : '<label for="realName">Nama asli</label><input id="realName" name="realName" maxlength="100" required autocomplete="name"><label for="alias">Nama samaran</label><input id="alias" name="alias" maxlength="100" required autocomplete="username">'}${register ? '<label for="className">Kelas / rombel</label><input id="className" name="className" maxlength="50" required placeholder="Contoh: X RPL 1"><label for="attendance">Nomor absen</label><input id="attendance" name="attendance" type="number" min="1" max="999" required>' : ""}<p id="error" role="alert" class="error"></p><div class="actions"><button class="primary" type="submit">${register ? "Buat akun & mulai" : "Masuk"}</button><button type="button" class="ghost" data-nav="home">Kembali</button></div></form><p class="notice">${teacher ? "Akun guru disediakan oleh pengelola aplikasi." : "Nama bukan rahasia. Jangan gunakan nama samaran yang sama dengan data akun sensitif. Siapa pun yang mengetahui kedua nama dapat masuk ke akun ini."}</p></section>`,
  );
}
async function activate(data) {
  auth = data;
  if (auth.role === "participant") {
    localStorage.setItem("pulau:last-account", JSON.stringify(auth));
    store = createProgressStore(localStorage, auth.user.id);
    try {
      progress = store.load();
    } catch (e) {
      progress = { participantId: auth.user.id, sessions: [] };
      showError(e.message);
    }
    await sync();
  } else {
    store = null;
    progress = { sessions: [] };
    syncStatus = "Akses guru terautentikasi";
  }
}
function map() {
  if (auth?.role !== "participant") {
    navigate("login");
    return;
  }
  world.reset();
  const summary = summarizeProgress(progress);
  shell(
    `<div class="topline"><div class="map-title"><div class="eyebrow">Ekspedisi ${esc(auth.user.alias)}</div><h2 style="margin:10px 0">Pilih jalur pemulihanmu.</h2><p>${summary.completed}/16 misi inti selesai · ${summary.enrichmentCompleted}/2 pengayaan</p></div><span class="badge">${summary.score !== null ? "Menara Awan pulih" : "Ekspedisi berlangsung"}</span></div><div class="world-map">${Array.from(
      { length: 9 },
      (_, i) => {
        const ms = MISSIONS.filter((m) => m.island === i + 1);
        const done = ms.every((m) => summary.latestByMission[m.id]),
          open = unlocked(ms[0], summary);
        const col = i % 3,
          row = Math.floor(i / 3);
        return `<button class="island-pin ${done ? "complete" : open ? "" : "locked"}" style="left:${18 + col * 32 - (row === 1 ? 7 : 0)}%;top:${18 + row * 30}%" data-island="${i + 1}" ${open ? "" : "disabled"}>${done ? "✓" : open ? "◇" : "⌑"} ${i + 1}. Pulau ${ms[0].islandName}<span>${esc(ms[0].competency)}${i === 8 ? " · pengayaan" : ""}</span></button>`;
      },
    ).join("")}</div>`,
  );
}
async function travel(m) {
  pause();
  const version = ++travelVersion;
  route = "travel";
  audio.play("travel");
  shell(
    `<section class="travel"><div class="panel"><div class="eyebrow">${m.enrichment ? "Pengayaan" : "Memulihkan jalur energi"} · Pulau ${m.island}</div><h2>Pulau ${esc(m.islandName)}</h2><p>${esc(m.narrative)}</p><button id="skip" class="primary">Lewati perjalanan</button></div></section>`,
  );
  await world.travelTo(m.island);
  if (version !== travelVersion) return;
  openMission(m);
}
function openMission(m, replay = false) {
  const summary = summarizeProgress(progress);
  if (!unlocked(m, summary)) return;
  let s =
    !replay &&
    progress.sessions.findLast(
      (x) => x.missionId === m.id && x.status === "active",
    );
  if (!s) {
    s = newSession(m, auth.user.id);
    s.source = navigator.onLine ? "online" : "offline";
    progress.sessions.push(s);
  }
  active = s.id;
  route = "mission";
  hint = "";
  timer.set(s.activeMs);
  if (!document.hidden && s.status === "active") timer.start();
  save();
  renderMission();
  scheduleSync();
}
function renderMission() {
  const s = current();
  if (!s) return;
  const m = getMission(s.missionId),
    summary = summarizeProgress(progress),
    done = s.status === "complete";
  shell(
    `<div class="topline"><button class="ghost small" data-nav="map">← Peta dunia</button><span class="eyebrow">Pulau ${m.island} / 9 · ${m.enrichment ? "Pengayaan" : "Misi inti"}</span></div><div class="mission-layout"><section class="panel mission-panel"><div class="mission-title"><div><div class="eyebrow">${esc(m.competency)} · ${esc(m.indicators.join(" / "))}</div><h2>${esc(m.title)}</h2></div><span class="badge">${done ? "✓ Dipulihkan" : `${m.id.endsWith("01") ? "1" : "2"} / 2`}</span></div><p>${esc(m.narrative)}</p><div class="instruction">${esc(m.instructions)}</div><div class="activity" ${done ? "inert" : ""}>${activityHtml(m, s.state)}</div><div role="status" aria-live="polite">${esc(s.feedback || "Susun tindakanmu, lalu periksa hasilnya.")}</div>${hint ? `<div class="hint">✧ ${esc(hint)}</div>` : ""}<div class="mission-controls">${done ? `<button class="primary" id="next">${m.id === "p08m02" ? "Menara pulih · Lihat rapor" : m.id === "p09m02" ? "Lihat hasil pengayaan" : "Lanjutkan perjalanan →"}</button><button id="replay">Mainkan ulang</button>` : '<button class="primary" id="submit">Periksa jawaban</button><button id="hint">✧ Petunjuk</button><button class="ghost" id="reset">Ulang tugas</button>'}</div></section><aside class="panel side-panel"><h3>Catatan ekspedisi</h3><div class="meter"><span style="width:${(summary.completed / 16) * 100}%"></span></div><div class="metric">Misi inti<strong>${summary.completed} / 16</strong></div><div class="metric">Waktu aktif<strong id="timer">${seconds(s.activeMs)}</strong></div><div class="metric">Pemeriksaan<strong>${s.attempts}</strong></div><div class="metric">Kesalahan<strong>${s.errors}</strong></div><div class="metric">Petunjuk<strong>${s.hints}</strong></div>${done ? `<div class="metric">Nilai terbaru<strong>${s.score}</strong></div>` : ""}<p class="notice">Waktu perjalanan dan tab tersembunyi tidak dinilai. Kesalahan tetap tercatat setelah mengulang.</p><span class="statusbar"><i class="dot"></i><span data-sync>${esc(syncStatus)}</span></span></aside></div>`,
  );
}
function table(rows) {
  if (!rows.length) return "<p>Belum ada data.</p>";
  const keys = Object.keys(rows[0]);
  return `<div class="table-wrap"><table><thead><tr>${keys.map((k) => `<th>${esc(k)}</th>`).join("")}</tr></thead><tbody>${rows.map((r) => `<tr>${keys.map((k) => `<td>${esc(r[k])}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
}
function report(p = progress, identity = auth?.user) {
  reportProgress = p;
  reportIdentity = identity;
  const r = buildReport(p);
  shell(
    `<section class="panel"><div class="topline"><div><div class="eyebrow">Bukti belajar · Rapor ekspedisi</div><h2 style="margin-top:12px">${esc(identity?.realName || identity?.real_name || "Penjelajah")}</h2><p>${esc(identity?.className || identity?.class_name || "")} · ${esc(identity?.alias || "")} · absen ${esc(identity?.attendance || "")}</p></div><button class="ghost" data-nav="${auth?.role === "teacher" ? "teacher" : "map"}">← Kembali</button></div><div class="summary-grid"><div class="summary-card"><small>Misi inti selesai</small><strong>${r.completed}/16</strong></div><div class="summary-card"><small>Nilai inti terbaru</small><strong>${r.score ?? "Belum lengkap"}</strong></div><div class="summary-card"><small>Ketepatan (K)</small><strong>${r.accuracy ?? "—"}</strong></div><div class="summary-card"><small>Total waktu aktif</small><strong>${seconds(r.totals.activeMs)}</strong></div></div><div class="competencies">${r.competencies.map((c, i) => `<div class="competency">${esc(c.name)}${i === 8 ? " (pengayaan)" : ""}<strong>${c.score ?? "Belum lengkap"}</strong></div>`).join("")}</div><p class="notice">Nilai terbaru digunakan untuk rekap dan leaderboard. Pengayaan terpisah dari nilai inti. Ketepatan dibaca bersama jejak tindakan; kecepatan bukan bukti tunggal penguasaan.</p><div class="actions"><button id="csv">Ekspor CSV</button><button id="json">Ekspor JSON lengkap</button>${auth?.role === "participant" ? '<button id="import-json" class="ghost">Pulihkan JSON</button><input id="json-file" type="file" accept="application/json" hidden>' : ""}</div><h3 style="margin-top:30px">Rincian per misi</h3>${table(r.rows)}<h3 style="margin-top:30px">Riwayat sesi dan bukti tindakan</h3><p class="notice">Total ${r.totals.attempts} pemeriksaan · ${r.totals.errors} kesalahan · ${r.totals.resets} ulang · ${r.totals.hints} petunjuk. Metrik ini kumulatif, bukan metrik sesi terbaik.</p>${p.sessions.map((s) => `<details><summary class="notice">${esc(getMission(s.missionId).title)} · ${s.status === "complete" ? `Nilai ${s.score}` : "Belum selesai"} · ${seconds(s.activeMs)} · ${s.errors} kesalahan · ${s.source === "offline" ? "bukti offline" : "bukti perangkat"}${r.bestByMission[s.missionId]?.id === s.id ? " · terbaik" : ""}</summary><pre class="trace">${esc(JSON.stringify({ sessionId: s.id, firstAccuracy: s.firstAccuracy, components: s.components, answer: s.state, events: s.events }, null, 2))}</pre></details>`).join("")}<p class="notice">${r.rows.filter((x) => x.Status !== "Selesai").length} misi belum memiliki bukti penyelesaian. Tugas dengan bantuan/kesalahan berulang layak dikonfirmasi kembali melalui asesmen kinerja guru. Alasan bebas dan keterampilan pada perangkat nyata belum dinilai otomatis.</p></section>`,
  );
}
async function teacher() {
  if (auth?.role !== "teacher") {
    navigate("teacher-login");
    return;
  }
  shell(
    '<section class="panel"><h2>Halaman guru</h2><p>Memuat hasil asesmen…</p></section>',
  );
  try {
    teacherRows = await api("/teacher/participants");
    renderTeacher();
  } catch (e) {
    showError(e.message);
  }
}
function filteredTeachers() {
  const cls = $("#teacher-class")?.value || "",
    query = ($("#teacher-query")?.value || "").toLowerCase(),
    complete = $("#teacher-complete")?.checked;
  return teacherRows.filter(
    (p) =>
      (!cls || p.class_name === cls) &&
      (!query || `${p.real_name} ${p.alias}`.toLowerCase().includes(query)) &&
      (!complete || p.summary.score !== null),
  );
}
function teacherTable() {
  const rows = filteredTeachers();
  $("#teacher-table").innerHTML =
    `<p class="notice">${rows.length} peserta sesuai filter · data terakhir dimuat ${new Date().toLocaleTimeString("id-ID")}</p><div class="table-wrap"><table><thead><tr><th>Nama asli</th><th>Nama samaran</th><th>Kelas</th><th>Absen</th><th>Inti</th><th>Ketepatan</th><th>Nilai inti</th><th>Rapor</th></tr></thead><tbody>${rows.map((p) => `<tr><td>${esc(p.real_name)}</td><td>${esc(p.alias)}</td><td>${esc(p.class_name)}</td><td>${p.attendance}</td><td>${p.summary.completed}/16</td><td>${p.summary.accuracy ?? "—"}</td><td>${p.summary.score ?? "Belum lengkap"}</td><td><button class="small" data-report="${esc(p.id)}">Buka rapor</button></td></tr>`).join("")}</tbody></table></div>`;
}
function renderTeacher() {
  const scores = teacherRows.filter((p) => p.summary.score !== null);
  shell(
    `<section class="panel"><div class="eyebrow">Ruang pendidik</div><h2 style="margin-top:12px">Perjalanan belajar, terlihat.</h2><p>Amati hasil dan bukti tindakan peserta. Data yang belum disinkron dari perangkat peserta belum tercantum di sini.</p><div class="summary-grid"><div class="summary-card"><small>Peserta terdaftar</small><strong>${teacherRows.length}</strong></div><div class="summary-card"><small>Inti tuntas</small><strong>${scores.length}</strong></div><div class="summary-card"><small>Kelas</small><strong>${new Set(teacherRows.map((p) => p.class_name)).size}</strong></div><div class="summary-card"><small>Rata-rata nilai tuntas</small><strong>${scores.length ? Math.round(scores.reduce((a, p) => a + p.summary.score, 0) / scores.length) : "—"}</strong></div></div><div class="inline-form"><label>Kelas<select id="teacher-class"><option value="">Semua kelas</option>${[...new Set(teacherRows.map((p) => p.class_name))].map((c) => `<option>${esc(c)}</option>`).join("")}</select></label><label>Cari peserta<input id="teacher-query" placeholder="Nama asli / samaran"></label><label><input id="teacher-complete" type="checkbox" style="width:auto"> Inti tuntas saja</label></div><div class="actions"><button id="teacher-csv">Ekspor rekap CSV</button><button id="teacher-refresh">Muat ulang data</button></div><div id="teacher-table"></div><details style="margin-top:25px"><summary>Kalibrasi patokan waktu</summary><p class="notice">Pengali 0,5–3 hanya berlaku untuk sesi baru. Nilai sesi lama tidak berubah.</p><div class="inline-form"><label>Pengali waktu<input id="baseline" type="number" min="0.5" max="3" step="0.1" value="1"></label><button id="calibrate">Simpan kalibrasi</button></div><p id="error" role="alert"></p></details></section>`,
  );
  teacherTable();
}
async function leaderboard() {
  shell(
    '<section class="panel"><div class="eyebrow">Penjelajah Menara Awan</div><h2 style="margin-top:12px">Leaderboard inti</h2><p>Memuat peringkat…</p></section>',
  );
  try {
    const rows = await api("/leaderboard");
    shell(
      `<section class="panel"><div class="eyebrow">Penjelajah Menara Awan</div><h2 style="margin-top:12px">Leaderboard inti</h2><p>Hanya ekspedisi dengan 16 misi inti tuntas yang masuk peringkat. Nilai sama memperoleh peringkat sama; pengayaan tidak memengaruhi peringkat.</p>${table(rows.map((r) => ({ Peringkat: r.rank, "Nama samaran": r.alias, "Nilai inti": r.score })))}${rows.length ? "" : '<div class="empty">Belum ada ekspedisi inti yang tuntas. Jadilah penjelajah pertama!</div>'}<div class="actions"><button data-nav="home">Kembali</button></div></section>`,
    );
  } catch (e) {
    showError(e.message);
  }
}
function settings() {
  shell(
    `<section class="panel auth-panel"><div class="eyebrow">Kenyamanan bermain</div><h2 style="margin-top:12px">Pengaturan</h2><div class="group-row"><label for="motion">Kurangi gerakan</label><input id="motion" type="checkbox" style="width:auto" ${localStorage.getItem("pulau:motion") === "true" || matchMedia("(prefers-reduced-motion: reduce)").matches ? "checked" : ""}></div><div class="group-row"><label for="quality">Kualitas efek</label><select id="quality"><option value="normal">Normal</option><option value="low" ${localStorage.getItem("pulau:quality") === "low" ? "selected" : ""}>Rendah</option></select></div><p class="notice">Pengaturan visual dan audio tidak mengubah skor atau waktu asesmen.</p><div class="actions"><button data-nav="home">Kembali</button>${auth?.role === "participant" ? '<button id="clear-local" class="ghost">Hapus cache akun ini</button>' : ""}</div></section>`,
  );
}
function navigate(next) {
  pause();
  travelVersion++;
  world.skip();
  route = next;
  if (next === "home") home();
  else if (["register", "login", "teacher-login"].includes(next))
    authForm(next);
  else if (next === "map") map();
  else if (next === "report") {
    if (auth?.role !== "participant") navigate("login");
    else report();
  } else if (next === "teacher") teacher();
  else if (next === "leaderboard") leaderboard();
  else if (next === "settings") settings();
}
function download(name, text, type) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
app.addEventListener("submit", async (e) => {
  if (e.target.id !== "auth-form") return;
  e.preventDefault();
  const kind = e.target.dataset.kind,
    b = Object.fromEntries(new FormData(e.target));
  if (kind === "register") b.attendance = Number(b.attendance);
  const submit = e.target.querySelector("[type=submit]");
  submit.disabled = true;
  try {
    const data = await api(
      kind === "teacher-login"
        ? "/teacher/login"
        : kind === "register"
          ? "/register"
          : "/login",
      b,
    );
    await activate(data);
    if (data.role === "teacher") navigate("teacher");
    else if (kind === "register") travel(MISSIONS[0]);
    else navigate("map");
  } catch (err) {
    showError(err.message);
    submit.disabled = false;
  }
});
app.addEventListener("click", async (e) => {
  const b = e.target.closest("button");
  if (!b || b.disabled) return;
  audio.unlock();
  audio.play("click");
  try {
    if (b.dataset.nav) {
      navigate(b.dataset.nav);
      return;
    }
    if (b.dataset.action) {
      emit("action", JSON.parse(b.dataset.action));
      return;
    }
    if (b.dataset.array) {
      const op = b.dataset.array;
      emit("action", {
        op,
        index: Number($("#array-index").value),
        value: $("#array-value").value,
      });
      return;
    }
    if (b.dataset.island) {
      const ms = MISSIONS.filter((m) => m.island === Number(b.dataset.island));
      const summary = summarizeProgress(progress);
      travel(ms.find((m) => !summary.latestByMission[m.id]) || ms[0]);
      return;
    }
    if (b.dataset.report) {
      const p = await api(`/teacher/participants/${b.dataset.report}/report`);
      route = "teacher-report";
      report(p, p.participant);
      return;
    }
    switch (b.id) {
      case "mute":
        audio.setMuted(!audio.muted);
        b.textContent = audio.muted ? "♪ Off" : "♪ On";
        b.setAttribute(
          "aria-label",
          audio.muted ? "Aktifkan suara" : "Matikan suara",
        );
        break;
      case "skip":
        world.skip();
        break;
      case "submit":
        emit("submit");
        break;
      case "hint": {
        const s = current(),
          m = getMission(s.missionId);
        hint = m.hints[Math.min(s.hints, m.hints.length - 1)];
        emit("hint");
        break;
      }
      case "reset":
        emit("reset");
        break;
      case "next": {
        const m = getMission(current().missionId);
        if (m.id === "p08m02" || m.id === "p09m02") {
          audio.play("level");
          navigate("report");
        } else travel(MISSIONS[MISSIONS.findIndex((x) => x.id === m.id) + 1]);
        break;
      }
      case "replay":
        openMission(getMission(current().missionId), true);
        break;
      case "csv":
        download(
          "rapor-pulau-logika.csv",
          toCsv(buildReport(reportProgress).rows),
          "text/csv;charset=utf-8",
        );
        break;
      case "json":
        download(
          "bukti-pulau-logika.json",
          exportJson(reportProgress),
          "application/json",
        );
        break;
      case "import-json":
        $("#json-file").click();
        break;
      case "teacher-csv":
        download(
          "rekap-kelas.csv",
          toCsv(
            filteredTeachers().map((p) => ({
              "Nama asli": p.real_name,
              "Nama samaran": p.alias,
              Kelas: p.class_name,
              Absen: p.attendance,
              "Misi inti": p.summary.completed,
              "Nilai inti": p.summary.score ?? "Belum lengkap",
              Ketepatan: p.summary.accuracy ?? "",
            })),
          ),
          "text/csv;charset=utf-8",
        );
        break;
      case "teacher-refresh":
        teacher();
        break;
      case "calibrate":
        await api(
          "/teacher/scoring-config",
          { baselineMultiplier: Number($("#baseline").value) },
          "PUT",
        );
        $("#error").textContent =
          "Patokan waktu untuk sesi baru telah disimpan.";
        break;
      case "clear-local":
        if (
          confirm(
            "Hapus cache lokal akun ini? Ekspor JSON dahulu jika ada data belum tersinkron. Data Neon tidak dihapus.",
          )
        ) {
          store.clear();
          progress = { participantId: auth.user.id, sessions: [] };
          await sync();
          navigate("home");
        }
        break;
      case "logout":
        pause();
        if (
          progress.sessions.some(
            (s) => (s.syncedCount || 0) < s.events.length,
          ) &&
          !confirm(
            "Ada data belum tersinkron. Keluar akan menghapus cache privat; ekspor JSON dahulu jika perlu. Tetap keluar?",
          )
        )
          break;
        await api("/logout", {});
        store?.clear();
        localStorage.removeItem("pulau:last-account");
        auth = null;
        store = null;
        progress = { sessions: [] };
        syncStatus = "Belum masuk";
        navigate("home");
        break;
    }
  } catch (err) {
    showError(err.message);
  }
});
app.addEventListener("change", async (e) => {
  const el = e.target;
  try {
    if (el.dataset.select) {
      const op = el.dataset.select;
      emit("action", {
        op,
        index: Number(el.dataset.index),
        ...(op === "place"
          ? { group: Number(el.value) }
          : op === "boundary"
            ? { value: Number(el.value) }
            : { value: el.value }),
        ...(el.dataset.branch ? { branch: el.dataset.branch } : {}),
      });
    }
    if (["teacher-class", "teacher-complete"].includes(el.id)) teacherTable();
    if (el.id === "motion") {
      localStorage.setItem("pulau:motion", String(el.checked));
      world.setReducedMotion(el.checked);
    }
    if (el.id === "quality") {
      localStorage.setItem("pulau:quality", el.value);
      world.setQuality(el.value);
    }
    if (el.id === "json-file") {
      const text = await el.files[0].text();
      const p = JSON.parse(text);
      if (
        p.schemaVersion !== 1 ||
        p.participantId !== auth.user.id ||
        !Array.isArray(p.sessions) ||
        p.sessions.length > 1000
      )
        throw Error("Cadangan tidak cocok dengan akun ini");
      for (const s of p.sessions) {
        getMission(s.missionId);
        if (
          s.participantId !== auth.user.id ||
          !Array.isArray(s.events) ||
          typeof s.id !== "string"
        )
          throw Error("Sesi cadangan tidak valid");
      }
      if (
        confirm(
          "Ganti progres lokal dari cadangan ini? Data server akan tetap dipertahankan saat sinkronisasi.",
        )
      ) {
        progress = p;
        save();
        await sync();
        report();
      }
    }
  } catch (err) {
    showError(err.message);
  }
});
app.addEventListener("input", (e) => {
  if (e.target.id === "teacher-query") teacherTable();
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) pause();
  else if (route === "mission" && current()?.status === "active") timer.start();
});
window.addEventListener("pagehide", pause);
window.addEventListener("online", sync);
setInterval(() => {
  if (
    route === "mission" &&
    current()?.status === "active" &&
    !document.hidden
  ) {
    emit("checkpoint");
    const el = $("#timer");
    if (el) el.textContent = seconds(timer.readMs());
  }
}, 2000);
world.setQuality(localStorage.getItem("pulau:quality") || "normal");
if (localStorage.getItem("pulau:motion") === "true")
  world.setReducedMotion(true);
home();
(async () => {
  try {
    await activate(await api("/me"));
    if (auth?.role === "teacher") navigate("teacher");
    else home();
  } catch (e) {
    if (!navigator.onLine || e instanceof TypeError) {
      try {
        const cached = JSON.parse(localStorage.getItem("pulau:last-account"));
        if (cached?.role === "participant") {
          auth = cached;
          store = createProgressStore(localStorage, auth.user.id);
          progress = store.load();
          syncStatus = "Mode offline — sinkronisasi tertunda";
          home();
        }
      } catch {}
    }
  }
})();
if ("serviceWorker" in navigator && import.meta.env.PROD)
  navigator.serviceWorker.register("/sw.js").catch(() => {});
