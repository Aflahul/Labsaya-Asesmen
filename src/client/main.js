import { indicatorClassHtml, indicatorStudentReportHtml } from "./ui/indicator-report.js";
import { buildIndicatorClassReport, indicatorExportRows } from "../shared/reports.js";
import { indicatorMissionHtml } from "./ui/indicator-results.js";
import { getIndicatorRubric } from "../shared/indicator-rubrics.js";
import { fallbackNara,buildAssessmentEvidence } from "../shared/indicator-assessment.js";
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
  indicatorThreshold = {threshold: 3, version: 1},
  reportProgress = null,
  reportIdentity = null,
  travelVersion = 0,
  pendingMission = null,
  naraState = { open: true, page: 0, mode: "guide" },
  cacheWarning = "",
  displayedFingerprint = "",
  recoveryCodeToShow = "",
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
              goal: "Aku Nara, teman perjalananmu. Menara Awan di Pulau Program sedang padam. Ayo pulihkan jalur lima pulau agar menara menyala kembali.",
              steps: [
                "Buat akun dengan nama lengkap sesuai daftar kelas, atau gunakan akun dari guru.",
                "Jelajahi lima pulau dan selesaikan misinya.",
                "Lihat rincian nilai di Rapor.",
              ],
              help: "Selesaikan 15 misi inti untuk membuka bos pengayaan. Setiap misi memberi 100 XP sekali; mencoba ulang gratis. Kemampuan dinilai per indikator dari bukti jawaban, terpisah dari XP.",
            }
          : {
              goal: "Pilih pulau yang terbuka untuk masuk ke misi berikutnya. Tujuan terakhir kita adalah Pulau Program, tempat Menara Awan berada.",
              steps: [
                "Pilih pulau yang terbuka.",
                "Misi yang belum selesai akan terbuka lebih dulu.",
                "Selesaikan tiga misi untuk membuka pulau berikutnya.",
              ],
              help: "Selesaikan 15 misi inti untuk membuka Ruang Arsitek di Menara Awan. Setiap misi memberi 100 XP sekali. Kamu boleh mencoba ulang dan memakai petunjuk tanpa kehilangan XP. Lihat perkembangan kemampuanmu di Rapor.",
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
    `<section class="home game-home"><div class="hero"><div class="eyebrow">EKSPEDISI MENARA AWAN · INFORMATIKA KELAS X</div><h1>Hidupkan kembali<br><em>Menara Awan.</em></h1><p>Menara Awan di Pulau Program adalah pusat jaringan lima pulau. Jaringannya terputus dan menara padam. Bantu Nara memulihkannya melalui tantangan data, algoritma, dan pemrograman.</p><div class="actions"><button class="primary" data-nav="${auth?.role === "participant" ? "map" : "login"}">${auth?.role === "participant" ? "Lanjut" : "Masuk"}</button>${auth?.role === "participant" ? "" : '<button class="ghost" data-nav="register">Daftar</button>'}</div><p class="notice">${auth?.role === "participant" ? "Lanjutkan perjalananmu dari peta." : "Belum punya akun? Daftar sendiri atau minta dibuatkan guru."}</p></div><img class="hero-island" src="/game-assets/island-menara-program.webp" alt="Menara Awan berdiri di tengah Pulau Program yang melayang di atas awan"></section>${pageGuide("home")}`,
  );
}
function passwordInput(id, label, autocomplete = "new-password") {
  return `<label for="${id}">${label}</label><div class="password-row"><input id="${id}" name="${id}" type="password" minlength="${autocomplete === "current-password" ? 1 : 12}" maxlength="200" required autocomplete="${autocomplete}"><button type="button" class="ghost small" data-toggle-password="${id}" aria-label="Tampilkan ${label.toLowerCase().replace("kata ", "")}" aria-pressed="false">Tampilkan</button></div>`;
}
function showRecoveryCode(code) {
  recoveryCodeToShow = code;
  route = "recovery-code";
  shell(
    `<section class="panel auth-panel"><div class="eyebrow">Keamanan akun</div><h2>Simpan kode pemulihan</h2><p>Kode ini hanya ditampilkan sekali. Salin dan simpan di tempat pribadi. Gunakan jika suatu saat lupa kata sandi. Kode lama otomatis hangus setelah kamu membuat atau memakai kode baru.</p><label for="recovery-code">Kode pemulihan</label><input id="recovery-code" value="${esc(code)}" readonly autocomplete="off" spellcheck="false"><p class="notice">Jangan berikan kode ini kepada orang lain. Jika kode hilang saat kamu masih bisa masuk, buat kode baru di Pengaturan.</p><div class="actions"><button id="copy-recovery-code" class="ghost">Salin kode</button><button class="primary" data-nav="${auth?.role === "participant" ? "map" : "login"}">${auth?.role === "participant" ? "Lanjut ke peta" : "Masuk"}</button></div><p id="error" role="status" class="notice"></p></section>`,
  );
}
function authForm(kind) {
  const teacher = kind === "teacher-login";
  shell(
    `<section class="panel auth-panel"><div class="eyebrow">${teacher ? "Ruang pendidik" : "Identitas penjelajah"}</div><h2 style="margin-top:12px">${teacher ? "Masuk halaman guru" : "Selamat datang kembali"}</h2><p>${teacher ? "Masuk dengan akun guru yang dibuat administrator sekolah." : "Masuk dengan nama samaran dan kata sandimu."}</p><form id="auth-form" data-kind="${kind}">${teacher ? '<label for="username">Username guru</label><input id="username" name="username" required autocomplete="username">' : '<label for="alias">Nama samaran</label><input id="alias" name="alias" maxlength="100" required autocomplete="username">'}${passwordInput("password", "Kata sandi", "current-password")}<p id="error" role="alert" class="error"></p><div class="actions"><button class="primary" type="submit">Masuk</button><button type="button" class="ghost" data-nav="home">Kembali</button></div></form>${teacher ? "" : '<p class="notice">Belum punya akun? <button type="button" class="ghost small" data-nav="register">Daftar</button> <button type="button" class="ghost small" data-nav="recover">Lupa kata sandi?</button></p>'}</section>`,
  );
}
function registerForm() {
  shell(
    `<section class="panel auth-panel"><div class="eyebrow">Identitas penjelajah</div><h2 style="margin-top:12px">Buat akun murid</h2><p>Isi nama lengkap sesuai daftar kelas untuk rapor. Nama samaran dipakai untuk masuk dan tampil di papan peringkat.</p><form id="auth-form" data-kind="register"><label for="realName">Nama lengkap murid</label><input id="realName" name="realName" maxlength="100" autocomplete="name" required><label for="alias">Nama samaran</label><input id="alias" name="alias" maxlength="100" autocomplete="username" required><label for="className">Kelas</label><input id="className" name="className" maxlength="50" required><label for="attendance">Nomor absen</label><input id="attendance" name="attendance" type="number" min="1" max="999" required>${passwordInput("password", "Kata sandi")}${passwordInput("passwordConfirm", "Ulangi kata sandi")}<p class="notice">Gunakan sedikitnya 12 karakter. Setelah mendaftar, simpan kode pemulihan yang tampil sekali. Guru perlu mencocokkan identitasmu sebelum memakai rapor sebagai nilai sumatif.</p><p id="error" role="alert" class="error"></p><div class="actions"><button class="primary" type="submit">Daftar</button><button type="button" class="ghost" data-nav="login">Sudah punya akun?</button></div></form></section>`,
  );
}
function recoverForm() {
  shell(
    `<section class="panel auth-panel"><div class="eyebrow">Keamanan akun</div><h2>Lupa kata sandi?</h2><p>Masukkan nama samaran dan kode pemulihan yang kamu simpan. Setelah berhasil, kode lama hangus dan kamu akan mendapat kode baru.</p><form id="recover-form"><label for="alias">Nama samaran</label><input id="alias" name="alias" maxlength="100" autocomplete="username" required><label for="code">Kode pemulihan</label><input id="code" name="code" maxlength="100" autocomplete="off" spellcheck="false" required>${passwordInput("newPassword", "Kata sandi baru")}${passwordInput("newPasswordConfirm", "Ulangi kata sandi baru")}<p id="error" role="alert" class="error"></p><div class="actions"><button class="primary" type="submit">Simpan kata sandi baru</button><button type="button" class="ghost" data-nav="login">Kembali</button></div></form><p class="notice">Belum pernah mendapat kode atau kode hilang? Minta bantuan guru untuk mengatur ulang.</p></section>`,
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
    CORE_MISSIONS.find(m=>summary.activeByMission[m.id]) || CORE_MISSIONS.find((m) => !summary.activityCompletedByMission[m.id]) || CORE_MISSIONS[0];
  const selected =
    ISLANDS.find((i) => i.id === (selectedIsland || next.island)) || ISLANDS[0];
  shell(
    `<div class="topline map-heading"><div><div class="eyebrow">EKSPEDISI ${esc(auth.user.alias)}</div><h2>Pulihkan jalur antarpulau.</h2><p>${summary.completed}/15 misi inti selesai${summary.pendingReview ? " · " + summary.pendingReview + " karya menunggu guru" : ""}</p></div><button class="ghost" data-nav="report">Rapor</button></div><div class="map-stage"><div class="island-grid constellation"><svg class="map-links" viewBox="0 0 1000 620" preserveAspectRatio="none" aria-hidden="true"><path/></svg>${ISLANDS.map(
      (i) => {
        const ms = CORE_MISSIONS.filter((m) => m.island === i.id),
          done = ms.filter((m) => summary.activityCompletedByMission[m.id]).length,
          open = unlocked(ms[0], summary);
        return `<section class="island-card ${open ? "" : "locked"} ${selected.id === i.id ? "selected" : ""}"><button class="island-art" data-island="${i.id}" aria-label="${open ? "Masuk ke" : "Lihat syarat membuka"} ${esc(i.name)}"><img src="/game-assets/island-${i.slug}.webp" alt=""></button><div class="island-label"><small>${done === 3 ? "✓ PULIH" : open ? "JALUR TERBUKA" : "TERKUNCI"} · ${done}/3</small><button class="island-name" data-island="${i.id}">${esc(i.name)}</button>${i.id === 5 ? "<small>Lokasi Menara Awan</small>" : ""}</div>${selectedIsland === i.id && !open ? `<div class="island-entry" role="status"><p>Selesaikan tiga misi pulau sebelumnya untuk membuka ${esc(i.name)}.</p></div>` : ""}</section>`;
      },
    ).join(
      "",
    )}</div></div>${summary.completed === 15 ? `<section class="panel ending-card"><img src="/game-assets/ending-network-restored.webp" alt="Jaringan antarpulau kembali bercahaya"><div><div class="eyebrow">EKSPEDISI INTI SELESAI</div><h2>Menara Awan kembali menyala.</h2><p>XP inti: <strong>${summary.xp}</strong>. Lihat hasil kemampuan per indikator di Rapor.</p>${summary.bossUnlocked ? `<p>Portal Ruang Arsitek di dalam Menara Awan terbuka. Di sana, kamu dapat mencoba tantangan pengayaan dengan merancang solusi sendiri.</p><button class="primary" data-mission="${BOSS.id}">Tantang</button><p class="notice">Tantangan ini boleh dilewati. Hasilnya tidak mengurangi nilai kompetensimu.</p>` : '<p class="notice">Ingin mencoba lagi? Kamu bisa mengulang misi. Riwayat perkembanganmu tetap disimpan.</p>'}</div></section>` : ""}`,
  );
  app.querySelector("main").insertAdjacentHTML("beforeend", pageGuide("map"));
  disconnectMap = connectIslands($(".constellation"));
}
async function travel(m) {
  if (!unlocked(m, summarizeProgress(progress))) return;
  selectedIsland = null;
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
function openMission(m, replay = false, masteryCheck = false) {
  const summary = summarizeProgress(progress);
  if (!unlocked(m, summary)) return;
  let s =
    !replay &&
    (progress.sessions.findLast(
      (x) =>
        x.missionId === m.id && ["active", "pending_review"].includes(x.status),
    ) ||
      summary.activityCompletedByMission[m.id] || summary.bestByMission[m.id]);
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
    s = newSession(m, auth.user.id, {baselineMultiplier: 1, assessmentPolicy: "indicator-v1", masteryCheck, previousCheckExposure: progress.sessions.some(x=>x.missionId===m.id && x.masteryCheck && (x.activityCompletedAt || x.masteryCheck.hints)), previousExposure: progress.sessions.some(x=>x.missionId===m.id && (x.activityCompletedAt || x.status === "complete" || x.hints || x.events?.some(e=>e.type === "run")))});
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
    feedback: s.feedback,
    aiGrade: s.aiGrade,
    review: s.review,
    indicatorAssessment: s.indicatorAssessment,
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
  if (s.assessmentPolicy === "indicator-v1") {
    shell(indicatorMissionHtml(m,s,summary,naraToast(m,naraState,naraState.mode === "hint" ? hint : s.feedback)));
    if (focusedId) document.getElementById(focusedId)?.focus({preventScroll: true});
    return;
  }
  shell(
    `<div class="topline"><button class="ghost small" data-nav="map">← Peta</button></div><div class="mission-layout"><section class="panel mission-panel"><div class="mission-title"><div><div class="eyebrow">${esc(m.islandName)} · ${m.enrichment ? "BOS OPSIONAL" : m.meeting + " · Misi " + Number(m.id.slice(-2)) + "/3"}</div><h2 id="mission-heading" tabindex="-1">${esc(m.title)}</h2></div><span class="badge">${done ? (s.review?.source === "ai" ? "✓ Dinilai Nara" : "✓ Dinilai") : pending ? "◷ Menunggu nilai" : "Sedang dimainkan"}</span></div><div class="mission-progress"><span>Misi ${summary.completed}/15</span><span>Waktu <strong id="timer">${seconds(s.activeMs)}</strong></span><progress max="15" value="${summary.completed}" aria-label="Misi inti selesai"></progress></div><div class="instruction"><strong>Misi kita</strong><p>${esc(s.assessmentRevision < 2 && m.priorInstructions ? m.priorInstructions : m.instructions)}</p><details class="report-question"><summary>Acuan waktu skor permainan arsip: ${s.scoringConfig?.timeBudgetSeconds || m.timeBudgetSeconds} detik</summary><div class="report-answer"><p>${esc(m.timeBudgetReason || "Acuan waktu sesuai beban misi.")}</p><p>Poin waktu permainan penuh sampai batas ini; nilai kompetensi tidak dipotong oleh waktu. Setelahnya, poin turun bertahap hingga 0 pada ${3 * (s.scoringConfig?.timeBudgetSeconds || m.timeBudgetSeconds)} detik. Misi tetap bisa diselesaikan. Sesi yang sudah dimulai memakai acuan saat sesi dibuat.</p></div></details></div><div class="activity" ${done || pending ? "inert" : ""}>${m.missionVersion === 2 ? v2ActivityHtml(m, draftState(s)) : activityHtml(m, s.state)}</div>${done ? `${scoreBreakdown(s, summary.missionGrades[m.id], summary.gameMissionGrades[m.id])}` : pending ? `<p class="feedback" role="status">${s.aiGrade?.status === "unavailable" ? "Penilaian Nara belum tersedia. Tekan Periksa untuk mencoba lagi; guru juga dapat menilai jawabanmu." : "Jawabanmu sudah terkirim. Nara sedang memeriksanya."}</p>` : `<p id="error" class="error" role="alert"></p>`}<div class="mission-controls">${done ? '<button class="primary" id="next">Next</button><button id="replay" title="Mengulang gratis; hasil baru dinilai per indikator">Ulang</button>' : pending ? '<button class="primary" data-nav="map">← Peta</button><button id="refresh-progress">Periksa</button><button data-nav="report">Rapor</button>' : `${!m.written ? '<button id="run">Coba</button>' : ""}<button class="primary" id="submit">Kirim</button><button id="hint">Petunjuk</button><button class="ghost" id="reset">Bersihkan</button>`}</div></section></div>${naraToast(m, naraState, naraState.mode === "hint" ? hint : pending && s.aiGrade?.status === "unavailable" ? "Penilaian otomatis belum tersedia. Jawabanmu aman; tekan Periksa lagi atau minta guru menilai." : done && s.review?.source === "ai" ? s.feedback : done && s.score < 100 ? "Ini arsip hasil sebelumnya. Kamu boleh mencoba lagi tanpa kehilangan XP; jawaban baru akan dinilai per indikator." : s.feedback)}`,
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
  shell(indicatorStudentReportHtml(r,p,identity,auth?.role === "teacher"));
  const archives=p.sessions.filter(s=>s.assessmentPolicy !== "indicator-v1");
  if (archives.length) {
    const holder=document.createElement("details");holder.innerHTML='<summary>Arsiv nilai lama</summary>'.replace('Arsiv','Arsip') + table(buildReport({...p,sessions:archives}).rows);
    document.querySelector('main .panel')?.append(holder);
  }
  if (auth?.role === "teacher" && archives.length) document.querySelector('main .panel')?.insertAdjacentHTML('beforeend',reviewHtml({sessions:archives.map(s=>({...s,mission:getMission(s.missionId)}))}));
  return;
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
    const indicatorReport = await api("/teacher/indicators");
    indicatorThreshold = {threshold: indicatorReport.threshold, version: indicatorReport.thresholdVersion};
    if (route !== "teacher") return;
    renderTeacher();
  } catch (e) {
    if (route !== "teacher") return;
    shell(
      `<section class="panel"><div class="eyebrow">Ruang pendidik</div><h2 style="margin-top:12px">Hasil asesmen belum dapat dimuat</h2><p class="error" role="alert">${esc(e.message)}</p><div class="actions"><button data-nav="teacher">Coba lagi</button></div></section>`,
    );
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
      (!complete || p.summary.completed === 15),
  );
}
function teacherTable() {
  const rows = filteredTeachers();
  const cls=$("#teacher-class")?.value||"";
  const container=$("#teacher-indicators");
  if(container)container.innerHTML=indicatorClassHtml(buildIndicatorClassReport(teacherRows,{className:cls,threshold:indicatorThreshold.threshold,thresholdVersion:indicatorThreshold.version}));
  $("#teacher-table").innerHTML =
    `<p class="notice">${rows.length} peserta sesuai filter · data terakhir dimuat ${new Date().toLocaleTimeString("id-ID")}</p><div class="table-wrap"><table><thead><tr><th>Nama lengkap</th><th>Nama samaran</th><th>Kelas</th><th>Absen</th><th>Inti</th><th>XP inti</th><th>Memenuhi mandiri</th><th>Perlu penguatan</th><th>Rapor</th><th>Akses</th></tr></thead><tbody>${rows.map((p) => `<tr><td>${esc(p.real_name)}</td><td>${esc(p.alias)}</td><td>${esc(p.class_name)}</td><td>${p.attendance}</td><td>${p.summary.completed}/15</td><td>${p.summary.xp}</td><td>${p.summary.indicatorResults.filter(i=>!i.enrichment && i.group === "independent").length}</td><td>${p.summary.indicatorResults.filter(i=>!i.enrichment && i.group === "needs_support").length}</td><td><button class="small" data-report="${esc(p.id)}">Buka</button></td><td><button class="small" data-reset-password="${esc(p.id)}">${p.hasPassword ? "Atur ulang" : "Buat sandi"}</button></td></tr>`).join("")}</tbody></table></div>`;
}
function showStudentCredential(result, title) {
  const box = $("#student-credentials");
  if (!box) return;
  box.hidden = false;
  box.replaceChildren();
  const heading = document.createElement("strong");
  heading.textContent = title + " · " + result.participant.real_name;
  const info = document.createElement("p");
  info.textContent = `Nama samaran: ${result.participant.alias} · Kata sandi: ${result.password}`;
  const note = document.createElement("p");
  note.textContent =
    "Salin sekarang dan berikan kepada murid secara pribadi. Kata sandi ini tidak ditampilkan lagi.";
  box.append(heading, info, note);
}
function renderTeacher() {
  const scores = teacherRows.filter((p) => p.summary.completed === 15);
  shell(
    `<section class="panel"><div class="eyebrow">Ruang pendidik</div><h2 style="margin-top:12px">Perkembangan belajar murid</h2><p>Lihat hasil misi dan jawaban murid. Cocokkan nama lengkap, kelas, dan nomor absen akun yang didaftarkan mandiri sebelum memakai rapor sebagai nilai sumatif. Jawaban yang belum terkirim dari perangkat murid belum muncul di halaman ini.</p><div class="summary-grid"><div class="summary-card"><small>Peserta terdaftar</small><strong>${teacherRows.length}</strong></div><div class="summary-card"><small>Inti tuntas</small><strong>${scores.length}</strong></div><div class="summary-card"><small>Kelas</small><strong>${new Set(teacherRows.map((p) => p.class_name)).size}</strong></div><div class="summary-card"><small>Murid perlu penguatan</small><strong>${teacherRows.filter(p=>p.summary.indicatorResults.some(i=>!i.enrichment&&i.group === "needs_support")).length}</strong></div></div><div class="inline-form"><label>Kelas<select id="teacher-class"><option value="">Semua kelas</option>${[...new Set(teacherRows.map((p) => p.class_name))].map((c) => `<option>${esc(c)}</option>`).join("")}</select></label><label>Cari peserta<input id="teacher-query" placeholder="Nama lengkap / samaran"></label><label><input id="teacher-complete" type="checkbox" style="width:auto"> Inti tuntas saja</label></div><div class="actions"><button id="teacher-csv">Unduh</button><button id="teacher-refresh">Segarkan</button></div><details class="report-question"><summary>Buat akun murid</summary><p class="notice">Isi nama lengkap untuk rapor asesmen. Nama samaran digunakan untuk masuk dan tampil di papan peringkat publik. Sistem membuat kata sandi acak; berikan kepada murid secara pribadi.</p><form id="student-create-form"><label>Nama lengkap murid<input name="realName" required maxlength="100" autocomplete="name"></label><label>Nama samaran untuk peringkat<input name="alias" required maxlength="100"></label><label>Kelas<input name="className" required maxlength="50"></label><label>Nomor absen<input name="attendance" type="number" min="1" max="999" required></label><p role="alert" class="error"></p><button class="primary" type="submit">Buat akun</button></form></details><div id="student-credentials" class="hint" role="status" hidden></div><div id="teacher-table"></div><div class="actions"><label>Ambang indikator<select id="indicator-threshold">${[1,2,3,4].map(n=>`<option value="${n}" ${n===indicatorThreshold.threshold?"selected":""}>Tingkat ${n}</option>`).join("")}</select></label><button id="save-threshold">Simpan Ambang</button><button id="indicator-csv">Ekspor Indikator</button></div><div id="teacher-indicators"></div><details style="margin-top:25px"><summary>Kalibrasi waktu versi lama</summary><p class="notice">Pengaturan ini hanya untuk misi versi lama. Ekspedisi lima pulau memakai acuan waktu per misi dengan bobot 10%.</p><div class="inline-form"><label>Pengali waktu<input id="baseline" type="number" min="0.5" max="3" step="0.1" value="1"></label><button id="calibrate">Simpan</button></div><p id="error" role="alert"></p></details></section>`,
  );
  teacherTable();
}
async function leaderboard() {
  shell(
    '<section class="panel"><div class="eyebrow">Penjelajah Menara Awan</div><h2 style="margin-top:12px">Peringkat penjelajah</h2><p>Memuat peringkat…</p></section>',
  );
  try {
    const rows = await api("/leaderboard");
    if (route !== "leaderboard") return;
    shell(
      `<section class="panel"><div class="eyebrow">Penjelajah Menara Awan</div><h2 style="margin-top:12px">Peringkat penjelajah</h2><p>Hanya nama samaran yang ditampilkan di sini; nama lengkap digunakan pada rapor asesmen yang dapat dilihat murid terkait dan guru. Peringkat memakai XP dari misi inti yang selesai. XP yang sama memperoleh peringkat sama; pengayaan tidak memengaruhi peringkat.</p>${table(rows.map((r) => ({ Peringkat: r.rank, "Nama samaran": r.alias, "XP inti": r.score })))}${rows.length ? "" : '<div class="empty">Belum ada ekspedisi inti yang tuntas. Jadilah penjelajah pertama!</div>'}<div class="actions"><button data-nav="home">Kembali</button></div></section>`,
    );
  } catch (e) {
    if (route !== "leaderboard") return;
    shell(
      `<section class="panel"><div class="eyebrow">Penjelajah Menara Awan</div><h2 style="margin-top:12px">Peringkat penjelajah</h2><p class="error" role="alert">${esc(e.message)}</p><div class="actions"><button data-nav="leaderboard">Coba lagi</button><button data-nav="home">Kembali</button></div></section>`,
    );
  }
}
function settings() {
  shell(
    `<section class="panel auth-panel"><div class="eyebrow">Kenyamanan bermain</div><h2 style="margin-top:12px">Pengaturan</h2><div class="group-row"><label for="motion">Kurangi gerakan</label><input id="motion" type="checkbox" style="width:auto" ${localStorage.getItem("pulau:motion") === "true" || matchMedia("(prefers-reduced-motion: reduce)").matches ? "checked" : ""}></div><div class="group-row"><label for="quality">Kualitas efek</label><select id="quality"><option value="normal">Normal</option><option value="low" ${localStorage.getItem("pulau:quality") === "low" ? "selected" : ""}>Rendah</option></select></div><p class="notice">Sesuaikan gerakan dan efek agar nyaman dimainkan di perangkatmu.</p>${auth?.role === "participant" ? `<form id="rotate-recovery-form"><h3>Ganti kode pemulihan</h3><p>Jika kode sebelumnya hilang, buat kode baru. Kode lama langsung hangus.</p>${passwordInput("password", "Kata sandi saat ini", "current-password")}<p id="error" role="alert" class="error"></p><button type="submit">Buat kode baru</button></form>` : ""}<div class="actions"><button data-nav="home">Kembali</button>${auth?.role === "participant" ? '<button id="download-raw" class="ghost">Cadangan</button><button id="clear-local" class="ghost">Hapus</button>' : ""}</div></section>`,
  );
}
function navigate(next) {
  pause();
  travelVersion++;
  pendingMission = null;
  world.skip();
  world.reset();
  if (next !== "recovery-code") recoveryCodeToShow = "";
  route = next;
  if (next === "home") home();
  else if (["login", "teacher-login"].includes(next)) authForm(next);
  else if (next === "register") registerForm();
  else if (next === "recover") recoverForm();
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
  if (e.target.id === "recover-form") {
    e.preventDefault();
    const form = e.target;
    const body = Object.fromEntries(new FormData(form));
    if (body.newPassword !== body.newPasswordConfirm) {
      showError("Kata sandi baru belum sama");
      return;
    }
    delete body.newPasswordConfirm;
    const submit = form.querySelector('[type="submit"]');
    submit.disabled = true;
    try {
      const result = await api("/recover-password", body);
      showRecoveryCode(result.recoveryCode);
    } catch (err) {
      showError(err.message);
      submit.disabled = false;
    }
    return;
  }
  if (e.target.id === "rotate-recovery-form") {
    e.preventDefault();
    const form = e.target;
    const submit = form.querySelector('[type="submit"]');
    submit.disabled = true;
    try {
      const result = await api(
        "/recovery-code",
        Object.fromEntries(new FormData(form)),
      );
      showRecoveryCode(result.recoveryCode);
    } catch (err) {
      showError(err.message);
      submit.disabled = false;
    }
    return;
  }
  if (e.target.matches(".indicator-review-form")) {
    e.preventDefault();
    const form=e.target,data=new FormData(form),session=reportProgress.sessions.find(s=>s.id===form.dataset.review),button=form.querySelector('button[type=submit]');button.disabled=true;
    try {
      await api(`/teacher/sessions/${session.id}/review`,{indicators:getIndicatorRubric(session.missionId).indicators.map(i=>({id:i.id,level:data.get(i.id)===''?null:Number(data.get(i.id)),reason:data.get('reason:'+i.id)})),comment:data.get('comment'),independent:data.get('independent')==='on'});
      const fresh=await api(`/teacher/participants/${session.participantId}/report`);report(fresh,fresh.participant);
    } catch(err){form.querySelector('[role=status]').textContent=err.message;button.disabled=false;}
    return;
  }
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
  if (e.target.id === "student-create-form") {
    e.preventDefault();
    const form = e.target;
    const submit = form.querySelector("[type=submit]");
    submit.disabled = true;
    try {
      const body = Object.fromEntries(new FormData(form));
      body.attendance = Number(body.attendance);
      const result = await api("/teacher/participants", body);
      teacherRows = await api("/teacher/participants");
      renderTeacher();
      showStudentCredential(result, "Akun dibuat");
    } catch (err) {
      form.querySelector("[role=alert]").textContent = err.message;
      submit.disabled = false;
    }
    return;
  }
  if (e.target.id !== "auth-form") return;
  e.preventDefault();
  const kind = e.target.dataset.kind,
    b = Object.fromEntries(new FormData(e.target));
  if (kind === "register") {
    if (b.password !== b.passwordConfirm) {
      showError("Kata sandi belum sama");
      return;
    }
    delete b.passwordConfirm;
    b.attendance = Number(b.attendance);
  }
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
    const { recoveryCode, ...sessionData } = data;
    await activate(sessionData);
    if (data.role === "teacher") navigate("teacher");
    else if (kind === "register") showRecoveryCode(recoveryCode);
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
    if (b.dataset.togglePassword) {
      const input = document.getElementById(b.dataset.togglePassword);
      if (!input) return;
      const visible = input.type === "password";
      input.type = visible ? "text" : "password";
      b.textContent = visible ? "Sembunyikan" : "Tampilkan";
      b.setAttribute(
        "aria-label",
        `${visible ? "Sembunyikan" : "Tampilkan"} ${(input.labels?.[0]?.textContent?.toLowerCase() || "sandi").replace("kata ", "")}`,
      );
      b.setAttribute("aria-pressed", String(visible));
      return;
    }
    if (b.id === "copy-recovery-code") {
      await navigator.clipboard.writeText(recoveryCodeToShow);
      b.textContent = "Tersalin";
      return;
    }
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
    if (b.dataset.island) {
      const islandId = Number(b.dataset.island);
      const ms = CORE_MISSIONS.filter((m) => m.island === islandId);
      const summary = summarizeProgress(progress);
      if (unlocked(ms[0], summary)) {
        travel(ms.find(m=>summary.activeByMission[m.id]) || ms.find((m) => !summary.activityCompletedByMission[m.id]) || ms[0]);
      } else {
        selectedIsland = islandId;
        map();
      }
      return;
    }
    if (b.dataset.resetPassword) {
      b.disabled = true;
      try {
        const result = await api(
          `/teacher/participants/${b.dataset.resetPassword}/reset-password`,
          {},
        );
        const row = teacherRows.find((p) => p.id === b.dataset.resetPassword);
        if (row) row.hasPassword = true;
        teacherTable();
        showStudentCredential(result, "Kata sandi baru");
      } catch (err) {
        showError(err.message);
        b.disabled = false;
      }
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
        if (
          route === "mission" &&
          (current()?.status === "pending_review" || current()?.indicatorAssessment) &&
          navigator.onLine
        ) {
          try {
            await api(`/sessions/${current().id}/grade`, {});
          } catch (error) {
            showError(error.message);
          }
        }
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
        hint = s.assessmentPolicy === "indicator-v1" ? (s.masteryCheck ? "Lies lagi aturan pada kasus baru. Pisahkan data yang masuk, langkah menghitung, dan hasil yang diminta. Mulai dari satu bagian yang kamu pahami, lalu jelaskan alasanmu. Karena kamu memakai petunjuk, jawaban ini akan dicatat sebagai latihan dengan bantuan; kamu boleh mencoba Uji Mandiri lagi.".replace("Lies", "Baca") : fallbackNara(getIndicatorRubric(m.id),buildAssessmentEvidence(m,s))) : m.guidance?.hint || m.hints[Math.min(s.hints, m.hints.length - 1)];
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
      case "mastery-check":
        openMission(getMission(current().missionId), true, true);
        break;
      case "replay":
        openMission(getMission(current().missionId), true);
        break;
      case "csv":
        download(
          "rapor-pulau-logika.csv",
          toCsv(buildReport(reportProgress).indicatorRows.map(i=>({Misi:i.missionTitle,Indikator:i.id,Kemampuan:i.label,Tingkat:i.level??"",Status:i.group,TP:i.tpLinks.map(x=>x.tp).join("; "),Bukti:i.references.map(x=>x.quote).join("; ")}))),
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
      case "save-threshold": {
        const config=await api('/teacher/indicator-config',{threshold:Number($("#indicator-threshold").value)},'PUT');indicatorThreshold={threshold:config.threshold,version:config.version};teacherRows=await api("/teacher/participants");const cls=$("#teacher-class")?.value||"";renderTeacher();$("#teacher-class").value=cls;teacherTable();break;
      }
      case "indicator-csv": {
        const r=buildIndicatorClassReport(teacherRows,{className:$("#teacher-class")?.value||'',threshold:indicatorThreshold.threshold,thresholdVersion:indicatorThreshold.version});download('indikator-kelas.csv',toCsv(indicatorExportRows(r)),'text/csv;charset=utf-8');break;
      }
      case "teacher-csv": {
        const params = new URLSearchParams();
        const cls = $("#teacher-class")?.value || "";
        const query = $("#teacher-query")?.value || "";
        if (cls) params.set("class", cls);
        if (query) params.set("query", query);
        if ($("#teacher-complete")?.checked) params.set("complete", "true");
        const response = await fetch("/api/teacher/export?" + params, {
          credentials: "same-origin",
        });
        if (!response.ok) throw Error("Rekap kelas gagal diunduh");
        download(
          "rekap-kelas.csv",
          await response.text(),
          "text/csv;charset=utf-8",
        );
        break;
      }
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
