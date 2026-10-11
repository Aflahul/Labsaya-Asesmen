import { reportHelp } from "./ui/report-help.js";
import { connectIslands } from "./ui/map-links.js";
import { scoreBreakdown } from "./ui/score-breakdown.js";
import "./styles.css";
import "./game.css";
import { updateDraft, drainDrafts, draftState } from "./drafts.js";
import { v2ActivityHtml, reviewHtml } from "./ui/v2-activities.js";
import {
  MISSIONS,
  CORE_MISSIONS,
  ISLANDS,
  BOSS,
  getMission,
} from "../shared/missions.js";
import { newSession, reduceSession } from "../shared/assessment.js";
import { summarizeProgress, unlocked } from "../shared/progress.js";
import { buildReport, toCsv, exportJson } from "../shared/reports.js";
import { createProgressStore } from "./storage.js";
import { syncProgress } from "./sync.js";
import { validateImport } from "./import.js";
import { canonicalJson } from "../shared/contracts.js";
import { createActiveTimer } from "./timer.js";
import { naraToast } from "./ui/nara-toast.js";
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
  selectedIsland = null,
  hint = "",
  syncStatus = "Belum masuk",
  syncRunning = false,
  syncAgain = false,
  syncTimeout,
  teacherRows = [],
  reportProgress = null,
  reportIdentity = null,
  travelVersion = 0,
  pendingMission = null,
  naraState = { open: true, page: 0, mode: "guide" },
  cacheWarning = "",
  displayedFingerprint = "",
  disconnectMap = () => {};
const pageNara = {
  home: { open: true, page: 0, mode: "guide" },
  map: { open: true, page: 0, mode: "guide" },
};
function pageGuide(page) {
  return naraToast(
    {
      guidance:
        page === "home"
          ? {
              goal: "Aku Nara, teman perjalananmu. Siap menjelajahi pulau pertama? Daftar untuk memulai, atau Masuk untuk melanjutkan perjalananmu.",
              steps: [
                "Daftar dengan identitasmu.",
                "Jelajahi lima pulau dan selesaikan misinya.",
                "Lihat rincian nilai di Rapor.",
              ],
              help: "Ketepatan bernilai 60%. Petunjuk, percobaan, kesalahan, dan waktu masing-masing 10%. Selesaikan 15 misi dengan rata-rata minimal 90 untuk membuka bos pengayaan.",
            }
          : {
              goal: "Pilih pulau, lalu tekan Masuk.",
              steps: [
                "Pilih pulau yang terbuka.",
                "Tekan Masuk di samping pulau.",
                "Selesaikan tiga misi untuk membuka pulau berikutnya.",
              ],
              help: "Nilai sesi terbaik dikurangi 1 poin per Ulang menjadi nilai misi. Nilai akhir adalah rata-rata nilai lima pulau. Setelah 15 misi dinilai dan rata-ratanya minimal 90, portal Ruang Arsitek terbuka.",
            },
    },
    pageNara[page],
  );
}
function redrawNara() {
  if (route === "home") home();
  else if (route === "map") map();
  else renderMission();
}
function activeNaraState() {
  return pageNara[route] || naraState;
}
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
    throw Error(
      "Layanan belum bisa dihubungi. Coba lagi sebentar, atau beri tahu gurumu jika masalah berlanjut.",
    );
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
    if (
      route === "mission" &&
      current() &&
      fingerprint(current()) !== displayedFingerprint
    ) {
      if (current().status === "complete") timer.pause();
      else if (current().activeMs > timer.readMs()) {
        timer.set(current().activeMs);
        if (!document.hidden) timer.start();
      }
      renderMission();
    }
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
  syncStatus = navigator.onLine
    ? "Perubahan tersimpan lokal — menunggu sinkronisasi"
    : "Mode offline — tersimpan lokal";
  updateStatus();
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
function flushDrafts() {
  const s = current();
  if (s?.status === "active")
    for (const action of drainDrafts(s)) emit("action", action, false);
}
function emit(type, payload = {}, redraw = true) {
  if (["run", "submit"].includes(type)) flushDrafts();
  const s = current();
  if (!s || s.status !== "active") return;
  if (type === "reset") delete s.draftAnswers;
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
  if (["run", "submit"].includes(type))
    naraState = { open: true, page: 0, mode: "feedback" };
  if (type === "hint") naraState = { open: true, page: 0, mode: "hint" };
  if (type === "reset") naraState = { open: true, page: 0, mode: "guide" };
  save();
  scheduleSync();
  if (s.status !== "active") {
    timer.pause();
    audio.play("success");
    world.islandRecovered(getMission(s.missionId).island);
  }
  if (type !== "checkpoint") {
    if (redraw && s.feedback)
      audio.play(s.status === "complete" ? "right" : "wrong");
    else if (redraw) audio.play("move");
    if (redraw) renderMission();
    else displayedFingerprint = fingerprint(s);
  }
}
function pause() {
  if (route === "mission" && current()?.status === "active") {
    timer.pause();
    flushDrafts();
    emit("checkpoint");
  }
}
function shell(content) {
  disconnectMap();
  disconnectMap = () => {};
  document.body.dataset.route = route;
  document.body.classList.toggle(
    "nara-is-open",
    ["home", "map", "mission"].includes(route) && activeNaraState().open,
  );
  app.innerHTML = `<header><button class="brand" data-nav="home"><span class="brand-mark">✧</span><span>Pulau Logika</span></button><nav>${auth?.role === "participant" ? '<button class="navbtn" data-nav="map">Peta</button><button class="navbtn" data-nav="report">Rapor</button>' : ""}${auth?.role === "teacher" ? '<button class="navbtn" data-nav="teacher">Guru</button>' : ""}<button class="navbtn" data-nav="leaderboard">Peringkat</button><button class="navbtn" data-nav="${auth?.role === "teacher" ? "teacher" : "teacher-login"}">Guru</button><button class="small ghost" id="mute" aria-label="${audio.muted ? "Aktifkan suara" : "Matikan suara"}">${audio.muted ? "♪ Off" : "♪ On"}</button><button class="small ghost" data-nav="settings" aria-label="Pengaturan">⚙</button>${auth ? '<button class="small ghost" id="logout">Keluar</button>' : ""}</nav></header><main>${cacheWarning ? `<p class="panel error" role="alert">${esc(cacheWarning)}</p>` : ""}${content}</main><footer class="footer"><span>ASESMEN INFORMATIKA · FASE E</span><span class="footer-credit">Created by <a href="https://aflahul.vercel.app/" target="_blank" rel="noopener noreferrer">Aflahul Mukmin</a></span>${route === "mission" || route === "travel" ? "" : `<span class="footer-sync" data-sync>${esc(syncStatus)}</span>`}</footer>`;
}
function home() {
  world.reset();
  shell(
    `<section class="home game-home"><div class="hero"><div class="eyebrow">EKSPEDISI MENARA AWAN · INFORMATIKA KELAS X</div><h1>Hidupkan kembali<br><em>Menara Awan.</em></h1><p>Jaringan penghubung lima pulau terputus. Bantu Nara menyambungkannya kembali dengan menyelesaikan tantangan data, algoritma, dan pemrograman.</p><div class="actions"><button class="primary" data-nav="${auth?.role === "participant" ? "map" : "register"}">${auth?.role === "participant" ? "Lanjut" : "Daftar"}</button>${!auth ? '<button data-nav="login">Masuk</button>' : ""}</div><p class="notice">${auth?.role === "participant" ? "Lanjutkan perjalananmu dari peta." : "Daftar untuk memulai petualangan bersama Nara."}</p></div><img class="hero-island" src="/game-assets/island-menara-program.webp" alt="Menara Program melayang di atas awan"></section>${pageGuide("home")}`,
  );
}
function authForm(kind) {
  const register = kind === "register",
    teacher = kind === "teacher-login";
  shell(
    `<section class="panel auth-panel"><div class="eyebrow">${teacher ? "Ruang pendidik" : "Identitas penjelajah"}</div><h2 style="margin-top:12px">${register ? "Mulai ekspedisimu" : teacher ? "Masuk halaman guru" : "Selamat datang kembali"}</h2><p>${teacher ? "Masuk dengan akun guru yang dibuat administrator sekolah. Akun murid tidak dapat digunakan di sini." : register ? "Gunakan nama asli untuk rapor dan nama samaran untuk papan peringkat." : "Masuk dengan nama asli dan nama samaran yang sama saat mendaftar."}</p><form id="auth-form" data-kind="${kind}">${teacher ? '<label for="username">Username guru</label><input id="username" name="username" required autocomplete="username"><label for="password">Kata sandi</label><input id="password" name="password" type="password" required autocomplete="current-password">' : '<label for="realName">Nama asli</label><input id="realName" name="realName" maxlength="100" required autocomplete="name"><label for="alias">Nama samaran</label><input id="alias" name="alias" maxlength="100" required autocomplete="username">'}${register ? '<label for="className">Kelas / rombel</label><input id="className" name="className" maxlength="50" required placeholder="Contoh: X RPL 1"><label for="attendance">Nomor absen</label><input id="attendance" name="attendance" type="number" min="1" max="999" required aria-describedby="attendance-help"><p id="attendance-help" class="notice">Masukkan nomor absenmu. Untuk absen 01, cukup tulis 1.</p>' : ""}<p id="error" role="alert" class="error"></p>${!teacher ? '<p class="notice">Nama asli dan nama samaran dipakai untuk masuk. Siapa pun yang mengetahui keduanya dapat mengakses akun ini. Jangan gunakan kata sandi akun lain sebagai nama samaran.</p>' : ""}<div class="actions"><button class="primary" type="submit">${register ? "Daftar" : "Masuk"}</button><button type="button" class="ghost" data-nav="home">Kembali</button></div></form><p class="notice">${teacher ? "Akun guru disediakan oleh pengelola aplikasi." : "Catat nama asli dan nama samaran yang kamu gunakan untuk masuk kembali."}</p></section>`,
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
      cacheWarning = e.message;
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
  const next =
    CORE_MISSIONS.find((m) => !summary.bestByMission[m.id]) || CORE_MISSIONS[0];
  const selected =
    ISLANDS.find((i) => i.id === (selectedIsland || next.island)) || ISLANDS[0];
  shell(
    `<div class="topline map-heading"><div><div class="eyebrow">EKSPEDISI ${esc(auth.user.alias)}</div><h2>Pulihkan jalur antarpulau.</h2><p>${summary.completed}/15 misi inti selesai${summary.pendingReview ? " · " + summary.pendingReview + " karya menunggu guru" : ""}</p></div><button class="ghost" data-nav="report">Rapor</button></div><div class="map-stage"><div class="island-grid constellation"><svg class="map-links" viewBox="0 0 1000 620" preserveAspectRatio="none" aria-hidden="true"><path/></svg>${ISLANDS.map(
      (i) => {
        const ms = CORE_MISSIONS.filter((m) => m.island === i.id),
          done = ms.filter((m) => summary.bestByMission[m.id]).length,
          open = unlocked(ms[0], summary);
        return `<section class="island-card ${open ? "" : "locked"} ${selected.id === i.id ? "selected" : ""}"><button class="island-art" data-island="${i.id}" aria-pressed="${selected.id === i.id}" aria-label="Pilih ${esc(i.name)}${open ? "" : " · terkunci"}"><img src="/game-assets/island-${i.slug}.webp" alt=""></button><div class="island-label"><small>${done === 3 ? "✓ PULIH" : open ? "JALUR TERBUKA" : "TERKUNCI"} · ${done}/3</small><button class="island-name" data-island="${i.id}">${esc(i.name)}</button></div>${selectedIsland === i.id ? `<div class="island-entry" role="region" aria-label="Informasi ${esc(i.name)}"><div class="island-entry-heading"><strong>${esc(i.name)}</strong><button class="ghost small" data-close-island="${i.id}" aria-label="Tutup informasi pulau">×</button></div><p>${esc(i.topic)}</p>${open ? `<button class="primary" data-enter-island="${i.id}">Masuk</button><div class="mission-list">${ms.map((m, n) => `<article class="mission-choice"><div><strong>${n + 1}. ${esc(m.title)}</strong><small>${summary.bestByMission[m.id] ? "Nilai " + summary.missionGrades[m.id].score : progress.sessions.some((s) => s.missionId === m.id && s.status === "pending_review") ? "Menunggu guru" : "Belum selesai"}</small></div><button class="small" data-mission="${m.id}" aria-label="Buka ${esc(m.title)}">Buka</button></article>`).join("")}</div>` : `<p>Selesaikan tiga misi pulau sebelumnya untuk membuka pulau ini.</p>`}</div>` : ""}</section>`;
      },
    ).join(
      "",
    )}</div></div>${summary.completed === 15 ? `<section class="panel ending-card"><img src="/game-assets/ending-network-restored.webp" alt="Jaringan antarpulau kembali bercahaya"><div><div class="eyebrow">EKSPEDISI INTI SELESAI</div><h2>Menara Awan kembali menyala.</h2><p>Nilai inti: <strong>${summary.score}</strong>. Lihat hasil seluruh misimu di Rapor.</p>${summary.bossUnlocked ? `<p>Sebuah portal terbuka. Ruang Arsitek menantangmu membuat solusi sendiri.</p><button class="primary" data-mission="${BOSS.id}">Tantang</button><p class="notice">Tantangan ini boleh dilewati. Hasilnya tidak mengurangi nilai intimu.</p>` : '<p class="notice">Ingin mencoba lagi? Kamu bisa mengulang misi. Nilai terbaikmu tetap disimpan.</p>'}</div></section>` : ""}`,
  );
  app.querySelector("main").insertAdjacentHTML("beforeend", pageGuide("map"));
  disconnectMap = connectIslands($(".constellation"));
}
async function travel(m) {
  if (!unlocked(m, summarizeProgress(progress))) return;
  const previous =
    route === "mission" && current() ? getMission(current().missionId) : null;
  const kind = m.enrichment
    ? "boss"
    : previous
      ? previous.island === m.island
        ? "task"
        : "island"
      : "enter";
  pause();
  const version = ++travelVersion;
  pendingMission = null;
  route = "travel";
  if (kind !== "task") audio.play("travel");
  const heading =
    kind === "task"
      ? "Siap untuk tugas berikutnya?"
      : kind === "island"
        ? "Menuju " + m.islandName
        : kind === "boss"
          ? "Portal Ruang Arsitek terbuka"
          : "Memasuki " + m.islandName;
  shell(
    `<section class="travel arrival" data-transition="${kind}"><div class="panel arrival-card"><div class="eyebrow">${kind === "task" ? "Masih di " + esc(m.islandName) : kind === "island" ? "Perjalanan antarpulau" : kind === "boss" ? "Pengayaan opsional" : "Mendarat di pulau"}</div><h2 tabindex="-1" id="arrival-heading">${esc(heading)}</h2><div class="arrival-nara"><img src="/game-assets/character-nara-idle.webp" alt=""><div><strong>Nara · pemandumu</strong><p>${esc(m.guidance.goal)} Baca dulu misi berikutnya. Tekan Mulai saat kamu siap.</p></div></div><p>Misi berikutnya: <strong>${esc(m.title)}</strong></p><div id="arrival-actions"><button id="skip">Lewati</button></div><button class="ghost" data-nav="map">← Peta</button></div></section>`,
  );
  $("#arrival-heading").focus({ preventScroll: true });
  await world.travelTo(m.scene || m.slug, kind);
  if (version !== travelVersion || route !== "travel") return;
  pendingMission = m;
  const skippedWithKeyboard = document.activeElement?.id === "skip";
  $("#arrival-actions").innerHTML =
    '<button id="begin-mission" class="primary">Mulai</button>';
  if (skippedWithKeyboard) $("#begin-mission").focus({ preventScroll: true });
}
function openMission(m, replay = false) {
  const summary = summarizeProgress(progress);
  if (!unlocked(m, summary)) return;
  let s =
    !replay &&
    (progress.sessions.findLast(
      (x) =>
        x.missionId === m.id && ["active", "pending_review"].includes(x.status),
    ) ||
      summary.bestByMission[m.id]);
  if (
    replay &&
    progress.sessions.some(
      (x) => x.missionId === m.id && x.status === "pending_review",
    )
  ) {
    showError("Karya masih menunggu penilaian guru.");
    return;
  }
  if (!s) {
    s = newSession(m, auth.user.id);
    s.source = navigator.onLine ? "online" : "offline";
    progress.sessions.push(s);
  }
  active = s.id;
  naraState = { open: true, page: 0, mode: "guide" };
  route = "mission";
  hint = "";
  timer.set(s.activeMs);
  if (!document.hidden && s.status === "active") timer.start();
  save();
  renderMission();
  $("#mission-heading")?.focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: "instant" });
  scheduleSync();
}
function fingerprint(s) {
  return canonicalJson({
    state: draftState(s),
    status: s.status,
    attempts: s.attempts,
    errors: s.errors,
    resets: s.resets,
    hints: s.hints,
    score: s.score,
  });
}
function renderMission() {
  const focusedId = document.activeElement?.id;
  const s = current();
  if (!s) return;
  displayedFingerprint = fingerprint(s);
  const m = getMission(s.missionId),
    summary = summarizeProgress(progress),
    done = s.status === "complete",
    pending = s.status === "pending_review";
  world.setScene(m.scene || m.slug);
  world.setProp(m.prop);
  shell(
    `<div class="topline"><button class="ghost small" data-nav="map">← Peta</button></div><div class="mission-layout"><section class="panel mission-panel"><div class="mission-title"><div><div class="eyebrow">${esc(m.islandName)} · ${m.enrichment ? "BOS OPSIONAL" : m.meeting + " · Misi " + Number(m.id.slice(-2)) + "/3"}</div><h2 id="mission-heading" tabindex="-1">${esc(m.title)}</h2></div><span class="badge">${done ? "✓ Dinilai" : pending ? "◷ Menunggu guru" : "Sedang dimainkan"}</span></div><div class="mission-progress"><span>Misi ${summary.completed}/15</span><span>Waktu <strong id="timer">${seconds(s.activeMs)}</strong></span><progress max="15" value="${summary.completed}" aria-label="Misi inti selesai"></progress></div><div class="instruction"><strong>Misi kita</strong><p>${esc(m.instructions)}</p><details class="report-question"><summary>Waktu untuk 10 poin: ${s.scoringConfig?.timeBudgetSeconds || m.timeBudgetSeconds} detik</summary><div class="report-answer"><p>${esc(m.timeBudgetReason || "Acuan waktu sesuai beban misi.")}</p><p>Poin waktu penuh sampai batas ini. Setelahnya, poin turun bertahap hingga 0 pada ${3 * (s.scoringConfig?.timeBudgetSeconds || m.timeBudgetSeconds)} detik. Misi tetap bisa diselesaikan. Sesi yang sudah dimulai memakai acuan saat sesi dibuat.</p></div></details></div><div class="activity" ${done || pending ? "inert" : ""}>${m.missionVersion === 2 ? v2ActivityHtml(m, draftState(s)) : activityHtml(m, s.state)}</div>${done ? `<p class="feedback" role="status">Nilai sesi ini: <strong>${s.score}</strong></p>${scoreBreakdown(s, summary.missionGrades[m.id])}` : pending ? `<p class="feedback" role="status">Jawabanmu sudah terkirim. Tunggu penilaian guru di Rapor.</p>` : `<p id="error" class="error" role="alert"></p>`}<div class="mission-controls">${done ? '<button class="primary" id="next">Next</button><button id="replay" title="Mengulang mengurangi nilai misi 1 poin">Ulang −1</button>' : pending ? '<button class="primary" data-nav="map">← Peta</button><button id="refresh-progress">Periksa</button><button data-nav="report">Rapor</button>' : `${!m.written ? '<button id="run">Coba</button>' : ""}<button class="primary" id="submit">Kirim</button><button id="hint">Petunjuk</button><button class="ghost" id="reset">Bersihkan</button>`}</div></section></div>${naraToast(m, naraState, naraState.mode === "hint" ? hint : done && s.score < 100 ? "Jawaban sudah dinilai. Kamu boleh mencoba lagi untuk memperbaikinya; nilai terbaik tetap tersimpan, tetapi setiap Ulang mengurangi nilai misi 1 poin." : s.feedback)}`,
  );
  if (focusedId)
    document.getElementById(focusedId)?.focus({ preventScroll: true });
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
    `<section class="panel"><div class="topline"><div><div class="eyebrow">Bukti belajar · Rapor ekspedisi</div><h2 style="margin-top:12px">${esc(identity?.realName || identity?.real_name || "Penjelajah")}</h2><p>${esc(identity?.className || identity?.class_name || "")} · ${esc(identity?.alias || "")} · absen ${esc(identity?.attendance || "")}</p></div><button class="ghost" data-nav="${auth?.role === "teacher" ? "teacher" : "map"}">← Kembali</button></div><div class="summary-grid"><div class="summary-card"><small>Misi inti selesai</small><strong>${r.completed}/15</strong></div><div class="summary-card"><small>Nilai akhir · rata-rata 5 pulau</small><strong>${r.score ?? "Belum lengkap"}</strong></div><div class="summary-card"><small>Ketepatan jawaban</small><strong>${r.accuracy ?? "—"}</strong></div><div class="summary-card"><small>Total waktu aktif</small><strong>${seconds(r.totals.activeMs)}</strong></div></div><div class="competencies">${r.competencies.map((c) => `<div class="competency">${esc(c.name)}<strong>${c.score ?? "Belum lengkap"}</strong></div>`).join("")}</div>${reportHelp(r, auth?.role === "teacher")}<div class="actions"><button id="csv">Rekap</button><button id="json">Cadangan</button>${auth?.role === "participant" ? '<button id="import-json" class="ghost">Pulihkan</button><input id="json-file" type="file" accept="application/json" hidden>' : ""}</div>${auth?.role === "teacher" ? reviewHtml({ sessions: p.sessions.map((s) => ({ ...s, mission: getMission(s.missionId) })) }) : ""}${
      p.sessions.some((s) => s.review)
        ? `<section class="review-feedback"><h3>Umpan balik guru</h3>${p.sessions
            .filter((s) => s.review)
            .map(
              (s) =>
                `<article class="hint"><strong>${esc(getMission(s.missionId).title)} · ${s.score}</strong><p>${esc(s.review.comment)}</p></article>`,
            )
            .join("")}</section>`
        : ""
    }${r.legacyCount ? `<p class="notice">Hasil permainan sebelumnya juga tersedia di rapor ini.</p>` : ""}<h3 style="margin-top:30px">Rincian per misi</h3>${table(auth?.role === "teacher" ? r.rows : r.rows.map(({ Misi, Jenis, Status, Nilai, NilaiSesiTerbaik, Pengulangan, PotonganUlang, K, H, P, E, W }) => ({ Misi, Jenis, Status, "Nilai misi": Nilai, "Sesi terbaik": NilaiSesiTerbaik, Pengulangan, "Potongan Ulang": PotonganUlang, "Ketepatan (maks. 60 poin)": Number.isFinite(K) ? Math.round(K * 0.6 * 100) / 100 : K, "Petunjuk (maks. 10 poin)": Number.isFinite(H) ? Math.round(H * 0.1 * 100) / 100 : H, "Percobaan (maks. 10 poin)": Number.isFinite(P) ? Math.round(P * 0.1 * 100) / 100 : P, "Kesalahan (maks. 10 poin)": Number.isFinite(E) ? Math.round(E * 0.1 * 100) / 100 : E, "Waktu (maks. 10 poin)": Number.isFinite(W) ? Math.round(W * 0.1 * 100) / 100 : W })))}${auth?.role === "teacher" ? `<h3 style="margin-top:30px">Riwayat sesi dan bukti tindakan</h3>${p.conflicts?.length ? `<p class="error">${p.conflicts.length} konflik perangkat dicadangkan. Ekspor JSON untuk bukti lokal yang belum menjadi nilai server; lanjutkan dari keadaan server atau mainkan ulang.</p>` : ""}<p class="notice">Total ${r.totals.attempts} pemeriksaan · ${r.totals.errors} kesalahan · ${r.totals.resets} ulang · ${r.totals.hints} petunjuk. Metrik ini kumulatif, bukan metrik sesi terbaik.</p>${p.sessions.map((s) => `<details><summary class="notice">${esc(getMission(s.missionId).title)} · ${s.status === "complete" ? `Nilai ${s.score}` : s.status === "pending_review" ? "Menunggu penilaian guru" : "Belum selesai"} · ${seconds(s.activeMs)} · ${s.errors} kesalahan · ${s.source === "offline" ? "bukti offline" : "bukti perangkat"}${r.bestByMission[s.missionId]?.id === s.id ? " · terbaik" : ""}</summary><pre class="trace">${esc(JSON.stringify({ sessionId: s.id, firstAccuracy: s.firstAccuracy, components: s.components, answer: s.state, events: s.events }, null, 2))}</pre></details>`).join("")}<p class="notice">${r.rows.filter((x) => x.Status !== "Selesai").length} misi belum memiliki bukti penyelesaian. Tugas dengan bantuan/kesalahan berulang layak dikonfirmasi kembali melalui asesmen kinerja guru. C5 dan C6 dinilai guru melalui rubrik. Keterampilan pada perangkat nyata dapat dikonfirmasi melalui praktik.</p>` : ""}</section>`,
  );
}
async function teacher() {
  if (auth?.role !== "teacher") {
    navigate("teacher-login");
    return;
  }
  shell(
    '<section class="panel"><h2>Guru</h2><p>Memuat hasil asesmen…</p></section>',
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
    `<p class="notice">${rows.length} peserta sesuai filter · data terakhir dimuat ${new Date().toLocaleTimeString("id-ID")}</p><div class="table-wrap"><table><thead><tr><th>Nama asli</th><th>Nama samaran</th><th>Kelas</th><th>Absen</th><th>Inti</th><th>Ketepatan</th><th>Nilai inti</th><th>Rapor</th></tr></thead><tbody>${rows.map((p) => `<tr><td>${esc(p.real_name)}</td><td>${esc(p.alias)}</td><td>${esc(p.class_name)}</td><td>${p.attendance}</td><td>${p.summary.completed}/15</td><td>${p.summary.accuracy ?? "—"}</td><td>${p.summary.score ?? "Belum lengkap"}</td><td><button class="small" data-report="${esc(p.id)}">Buka</button></td></tr>`).join("")}</tbody></table></div>`;
}
function renderTeacher() {
  const scores = teacherRows.filter((p) => p.summary.score !== null);
  shell(
    `<section class="panel"><div class="eyebrow">Ruang pendidik</div><h2 style="margin-top:12px">Perkembangan belajar murid</h2><p>Lihat hasil misi dan jawaban murid. Jawaban yang belum terkirim dari perangkat murid belum muncul di halaman ini.</p><div class="summary-grid"><div class="summary-card"><small>Peserta terdaftar</small><strong>${teacherRows.length}</strong></div><div class="summary-card"><small>Inti tuntas</small><strong>${scores.length}</strong></div><div class="summary-card"><small>Kelas</small><strong>${new Set(teacherRows.map((p) => p.class_name)).size}</strong></div><div class="summary-card"><small>Rata-rata nilai tuntas</small><strong>${scores.length ? Math.round(scores.reduce((a, p) => a + p.summary.score, 0) / scores.length) : "—"}</strong></div></div><div class="inline-form"><label>Kelas<select id="teacher-class"><option value="">Semua kelas</option>${[...new Set(teacherRows.map((p) => p.class_name))].map((c) => `<option>${esc(c)}</option>`).join("")}</select></label><label>Cari peserta<input id="teacher-query" placeholder="Nama asli / samaran"></label><label><input id="teacher-complete" type="checkbox" style="width:auto"> Inti tuntas saja</label></div><div class="actions"><button id="teacher-csv">Unduh</button><button id="teacher-refresh">Segarkan</button></div><div id="teacher-table"></div><details style="margin-top:25px"><summary>Kalibrasi waktu versi lama</summary><p class="notice">Pengaturan ini hanya untuk misi versi lama. Ekspedisi lima pulau memakai acuan waktu per misi dengan bobot 10%.</p><div class="inline-form"><label>Pengali waktu<input id="baseline" type="number" min="0.5" max="3" step="0.1" value="1"></label><button id="calibrate">Simpan</button></div><p id="error" role="alert"></p></details></section>`,
  );
  teacherTable();
}
async function leaderboard() {
  shell(
    '<section class="panel"><div class="eyebrow">Penjelajah Menara Awan</div><h2 style="margin-top:12px">Peringkat penjelajah</h2><p>Memuat peringkat…</p></section>',
  );
  try {
    const rows = await api("/leaderboard");
    shell(
      `<section class="panel"><div class="eyebrow">Penjelajah Menara Awan</div><h2 style="margin-top:12px">Peringkat penjelajah</h2><p>Hanya ekspedisi dengan 15 misi inti tuntas yang masuk peringkat. Nilai sama memperoleh peringkat sama; pengayaan tidak memengaruhi peringkat.</p>${table(rows.map((r) => ({ Peringkat: r.rank, "Nama samaran": r.alias, "Nilai inti": r.score })))}${rows.length ? "" : '<div class="empty">Belum ada ekspedisi inti yang tuntas. Jadilah penjelajah pertama!</div>'}<div class="actions"><button data-nav="home">Kembali</button></div></section>`,
    );
  } catch (e) {
    showError(e.message);
  }
}
function settings() {
  shell(
    `<section class="panel auth-panel"><div class="eyebrow">Kenyamanan bermain</div><h2 style="margin-top:12px">Pengaturan</h2><div class="group-row"><label for="motion">Kurangi gerakan</label><input id="motion" type="checkbox" style="width:auto" ${localStorage.getItem("pulau:motion") === "true" || matchMedia("(prefers-reduced-motion: reduce)").matches ? "checked" : ""}></div><div class="group-row"><label for="quality">Kualitas efek</label><select id="quality"><option value="normal">Normal</option><option value="low" ${localStorage.getItem("pulau:quality") === "low" ? "selected" : ""}>Rendah</option></select></div><p class="notice">Sesuaikan gerakan dan efek agar nyaman dimainkan di perangkatmu.</p><div class="actions"><button data-nav="home">Kembali</button>${auth?.role === "participant" ? '<button id="download-raw" class="ghost">Cadangan</button><button id="clear-local" class="ghost">Hapus</button>' : ""}</div></section>`,
  );
}
function navigate(next) {
  pause();
  travelVersion++;
  pendingMission = null;
  world.skip();
  world.reset();
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
  if (e.target.matches(".review-form")) {
    e.preventDefault();
    const form = e.target,
      session = reportProgress.sessions.find(
        (s) => s.id === form.dataset.review,
      ),
      m = getMission(session.missionId),
      data = new FormData(form),
      marks = Object.fromEntries(
        m.rubric.map(([key]) => [key, Number(data.get(key))]),
      );
    const button = form.querySelector("button[type=submit]");
    button.disabled = true;
    try {
      await api(`/teacher/sessions/${session.id}/review`, {
        marks,
        comment: data.get("comment"),
      });
      const fresh = await api(
        `/teacher/participants/${session.participantId}/report`,
      );
      report(fresh, fresh.participant);
    } catch (err) {
      form.querySelector("[role=status]").textContent = err.message;
      button.disabled = false;
    }
    return;
  }
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
    if (b.dataset.mission) {
      travel(getMission(b.dataset.mission));
      return;
    }
    if (b.dataset.enterIsland) {
      const ms = CORE_MISSIONS.filter(
        (m) => m.island === Number(b.dataset.enterIsland),
      );
      const summary = summarizeProgress(progress);
      travel(ms.find((m) => !summary.bestByMission[m.id]) || ms[0]);
      return;
    }
    if (b.dataset.closeIsland) {
      const id = b.dataset.closeIsland;
      selectedIsland = null;
      const position = window.scrollY;
      map();
      document
        .querySelector(`.island-art[data-island="${id}"]`)
        ?.focus({ preventScroll: true });
      window.scrollTo({ top: position, behavior: "instant" });
      return;
    }
    if (b.dataset.island) {
      selectedIsland = Number(b.dataset.island);
      const position = window.scrollY;
      map();
      document
        .querySelector(`[data-enter-island="${selectedIsland}"]`)
        ?.focus({ preventScroll: true });
      window.scrollTo({ top: position, behavior: "instant" });
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
      case "nara-close":
      case "nara-dismiss":
        activeNaraState().open = false;
        redrawNara();
        $("#nara-open")?.focus({ preventScroll: true });
        break;
      case "nara-open":
      case "nara-guide":
        Object.assign(activeNaraState(), {
          open: true,
          page: 0,
          mode: "guide",
        });
        redrawNara();
        $("#nara-close")?.focus({ preventScroll: true });
        break;
      case "nara-next":
      case "nara-back":
        activeNaraState().page = Math.max(
          0,
          Math.min(2, activeNaraState().page + (b.id === "nara-next" ? 1 : -1)),
        );
        redrawNara();
        if (!document.activeElement?.id)
          $("#nara-dismiss")?.focus({ preventScroll: true });
        break;
      case "begin-mission": {
        const m = pendingMission;
        pendingMission = null;
        if (m && route === "travel") openMission(m);
        break;
      }
      case "skip":
        world.skip();
        break;
      case "refresh-progress":
        await sync();
        if (route === "mission") renderMission();
        else if (route === "map") map();
        else if (route === "report") report();
        break;
      case "run":
        emit("run");
        break;
      case "submit":
        emit("submit");
        if (current()?.status === "active") {
          const empty = [
            ...app.querySelectorAll(".activity select, .activity textarea"),
          ].find((el) => !el.value.trim());
          empty?.focus();
        }
        break;
      case "hint": {
        const s = current(),
          m = getMission(s.missionId);
        hint =
          m.guidance?.hint || m.hints[Math.min(s.hints, m.hints.length - 1)];
        emit("hint");
        break;
      }
      case "reset":
        emit("reset");
        break;
      case "next": {
        const m = getMission(current().missionId);
        if (m.id === CORE_MISSIONS.at(-1).id || m.enrichment) {
          audio.play("level");
          navigate("map");
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
      case "download-raw":
        download("cache-lokal-asli.txt", store.raw() || "", "text/plain");
        break;
      case "clear-local":
        if (
          confirm(
            "Hapus data akun ini dari perangkat? Unduh Cadangan terlebih dahulu jika jawaban belum terkirim. Data yang sudah tersimpan di akun tetap ada.",
          )
        ) {
          store.clear();
          cacheWarning = "";
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
            "Sebagian jawaban belum terkirim. Jika keluar, salinan di perangkat ini akan dihapus. Unduh Cadangan di Rapor terlebih dahulu agar jawaban tidak hilang. Tetap keluar?",
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
  } finally {
    if (
      route === "mission" &&
      current()?.status === "active" &&
      !document.hidden
    )
      timer.start();
  }
});
app.addEventListener("change", async (e) => {
  const el = e.target;
  try {
    if (el.matches("textarea[data-answer]")) {
      flushDrafts();
      return;
    }
    if (el.matches("select[data-answer]")) {
      emit("action", { op: "answer", key: el.dataset.answer, value: el.value });
      return;
    }
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
      const restored = validateImport(p, auth.user.id);
      if (
        confirm(
          "Ganti progres di perangkat ini dengan cadangan yang dipilih? Progres yang sudah tersimpan di akun tetap dipertahankan.",
        )
      ) {
        store.allowReplace();
        cacheWarning = "";
        progress = restored;
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
  if (e.target.matches("textarea[data-answer]")) {
    try {
      const s = current();
      updateDraft(
        s,
        getMission(s.missionId),
        e.target.dataset.answer,
        e.target.value,
      );
      syncStatus = "Draf tersimpan di perangkat ini";
      save();
      updateStatus();
      displayedFingerprint = fingerprint(s);
    } catch (err) {
      showError(err.message);
    }
  }
  if (e.target.id === "teacher-query") teacherTable();
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) pause();
  else if (route === "mission" && current()?.status === "active") timer.start();
});
window.addEventListener("pagehide", pause);
window.addEventListener("online", sync);
window.addEventListener("focus", async () => {
  await sync();
  if (route === "map") map();
  else if (route === "report") report();
});
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
