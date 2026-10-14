import {esc} from './activities.js';
const time=seconds=>seconds===null||seconds===undefined?'Belum tercatat':`${Math.floor(seconds/60)} m ${seconds%60} dtk`;
const tier=row=>row.sepuh?'sepuh':row.rank===1?'gold':row.rank===2?'silver':row.rank===3?'bronze':row.rank<=10?'elite':'explorer';
function awardIcon(kind) {
 const shape=kind==='gold'
  ? '<path d="m7 13 9 7 8-13 8 13 9-7-4 23H11Z" fill="currentColor" fill-opacity=".3"/><path d="m7 13 9 7 8-13 8 13 9-7-4 23H11Z"/><path d="M12 41h24M18 29h12"/>'
  : kind==='sepuh'
  ? '<path d="m17 23-13-9 3 13 11 5m13-9 13-9-3 13-11 5"/><path d="M14 34h21a7 7 0 0 0 0-14 11 11 0 0 0-21-1 8 8 0 0 0 0 15Z" fill="currentColor" fill-opacity=".2"/><path d="m24 12 3 7-3 7-3-7Z"/>'
  : kind==='silver'||kind==='bronze'
  ? '<path d="m14 7 10 9L34 7l4 11-14 10-14-10Z" fill="currentColor" fill-opacity=".25"/><circle cx="24" cy="30" r="12"/><path d="m24 22 2.5 5 5.5.8-4 4 1 5.5-5-2.5-5 2.5 1-5.5-4-4 5.5-.8Z" fill="currentColor" stroke="none"/>'
  : `${kind==='elite'?'<path d="m24 3 17 10v22L24 45 7 35V13Z" fill="currentColor" fill-opacity=".15"/>':''}<circle cx="24" cy="24" r="15"/><path d="m30 18-4 10-8 2 4-10Z" fill="currentColor" fill-opacity=".4"/><path d="M24 6V3m0 42v-3M6 24H3m42 0h-3"/>`;
 return `<svg viewBox="0 0 48 48" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${shape}</svg>`;
}
function rankCard(row) {
 const kind=tier(row);
 return `<li class="rank-card rank-${kind}" ${row.sepuh?'':`value="${esc(row.rank)}"`}>
  <div class="rank-award" aria-label="${row.sepuh?'Gelar Sepuh':`Peringkat ${esc(row.rank)}`}">${awardIcon(kind)}${row.sepuh?'<span class="sepuh-badge">Sepuh</span>':`<span class="rank-number">${esc(row.rank)}</span>`}</div>
  <div class="rank-player"><h3>${esc(row.alias)}</h3><dl class="rank-stats"><div data-stat="time"><dt>Waktu bermain</dt><dd>${esc(time(row.activeSeconds))}</dd></div><div data-stat="hints"><dt>Petunjuk</dt><dd>${esc(row.hints??'Belum tercatat')}</dd></div><div data-stat="attempts"><dt>Percobaan</dt><dd>${esc(row.attempts??'Belum tercatat')}</dd></div></dl></div>
  <div class="rank-xp"><strong>${esc(row.score)}</strong><span>XP inti</span></div>
 </li>`;
}
export function leaderboardHtml(rows) {
 const sepuh=rows.filter(row=>row.sepuh),regular=rows.filter(row=>!row.sepuh);
 return `<section class="panel leaderboard"><div class="leaderboard-banner"><div><div class="eyebrow">Jejak para penjelajah</div><h1>Peringkat penjelajah</h1><p>Lihat pencapaianmu di antara para penjelajah.</p></div><span class="leaderboard-count">${rows.length} penjelajah</span></div>
 <p class="leaderboard-invitation">Tuntaskan pengayaan untuk meraih gelar <strong>Sepuh</strong>.</p>
 <details><summary>Bagaimana urutannya?</summary><p><strong>Sepuh di puncak!</strong> Badge ini menggantikan nomor di atas peringkat 1, tanpa tambahan XP.</p><p>Peserta lain diurutkan dari waktu bermain paling singkat, petunjuk paling sedikit, percobaan paling sedikit, lalu siapa yang selesai lebih dulu.</p><p>Yang dicatat adalah penyelesaian pertama tiap misi. Berlatih ulang setelah selesai bebas; menunggu hasil dan meninggalkan tab tidak dihitung.</p><p>Nama samaranmu tampil di sini. Hasil kemampuanmu tetap ada di Rapor; peringkat ini tidak mengubah nilainya.</p></details>
 ${sepuh.length?`<section class="leaderboard-group sepuh-group" aria-label="Penjelajah Sepuh"><h2>Gelar Sepuh <span>Pengayaan tuntas</span></h2><ul class="rank-list">${sepuh.map(rankCard).join('')}</ul></section>`:''}
 ${regular.length?`<section class="leaderboard-group" aria-label="Peringkat utama"><h2>Peringkat utama</h2><ol class="rank-list">${regular.map(rankCard).join('')}</ol></section>`:''}
 ${rows.length?'':'<div class="empty">Belum ada ekspedisi inti yang tuntas. Jadilah penjelajah pertama!</div>'}<div class="actions"><button data-nav="home">Kembali</button></div></section>`;
}
