import {esc} from './activities.js';
const time=seconds=>seconds===null||seconds===undefined?'Belum tercatat':`${Math.floor(seconds/60)} m ${seconds%60} dtk`;
const tier=row=>row.sepuh?'sepuh':row.rank===1?'gold':row.rank===2?'silver':row.rank===3?'bronze':row.rank<=10?'elite':'explorer';
function awardIcon(kind,rank) {
 const index={gold:0,silver:1,bronze:2,elite:3,explorer:4,sepuh:5}[kind];
 const symbol=kind==='sepuh'?'S':String(rank);
 const centerY=kind==='gold'?276:kind==='sepuh'?282:256;
 const fontSize=Math.min(108,234/symbol.length);
 return `<svg class="award-art" viewBox="64 40 384 432" role="img" aria-label="${kind==='sepuh'?'Gelar Sepuh':`Peringkat ${esc(rank)}`}" focusable="false"><image href="/game-assets/leaderboard-awards.png" x="${-512*index}" y="0" width="3072" height="512"/><text class="${kind==='sepuh'?'sepuh-letter':'rank-number'}" x="256" y="${centerY}" text-anchor="middle" dominant-baseline="central" font-size="${fontSize}" aria-hidden="true">${esc(symbol)}</text></svg>`;
}
function rankCard(row) {
 const kind=tier(row);
 return `<li class="rank-card rank-${kind}" ${row.sepuh?'':`value="${esc(row.rank)}"`}>
  <div class="rank-award">${awardIcon(kind,row.rank)}${row.sepuh?'<span class="sepuh-badge">Sepuh</span>':''}</div>
  <div class="rank-player"><h3>${esc(row.alias)}</h3><dl class="rank-stats"><div data-stat="time"><dt>Waktu bermain</dt><dd>${esc(time(row.activeSeconds))}</dd></div><div data-stat="hints"><dt>Petunjuk</dt><dd>${esc(row.hints??'Belum tercatat')}</dd></div><div data-stat="attempts"><dt>Percobaan</dt><dd>${esc(row.attempts??'Belum tercatat')}</dd></div></dl></div>
  <div class="rank-xp">${row.sepuh?`<strong class="rank-bonus">${row.enrichmentXp==null?'Menyusul':'+'+esc(row.enrichmentXp)}</strong><span>XP pengayaan</span><small>${esc(row.score)} XP inti</small>`:`<strong>${esc(row.score)}</strong><span>XP inti</span>`}</div>
 </li>`;
}
export function leaderboardHtml(rows) {
 const sepuh=rows.filter(row=>row.sepuh),regular=rows.filter(row=>!row.sepuh);
 return `<section class="panel leaderboard"><div class="leaderboard-banner"><div><div class="eyebrow">Jejak para penjelajah</div><h1>Peringkat penjelajah</h1><p>Lihat pencapaianmu di antara para penjelajah.</p></div><span class="leaderboard-count">${rows.length} penjelajah</span></div>
 <p class="leaderboard-invitation">Tuntaskan pengayaan untuk meraih gelar <strong>Sepuh</strong>.</p>
 <details><summary>Bagaimana urutannya?</summary><p><strong>Sepuh di puncak!</strong> XP pengayaan tertinggi berada paling atas. Bonus 10–100 XP dinilai dari jawaban pengayaan pertama. Jika sama, waktu, petunjuk, dan percobaan menjadi pembeda.</p><p>Peserta lain diurutkan dari waktu bermain paling singkat, petunjuk paling sedikit, percobaan paling sedikit, lalu siapa yang selesai lebih dulu.</p><p>Yang dicatat adalah penyelesaian pertama tiap misi. Berlatih ulang setelah selesai bebas; menunggu hasil dan meninggalkan tab tidak dihitung.</p><p>Nama samaranmu tampil di sini. Hasil kemampuanmu tetap ada di Rapor; peringkat ini tidak mengubah nilainya.</p></details>
 ${sepuh.length?`<section class="leaderboard-group sepuh-group" aria-label="Penjelajah Sepuh"><h2>Gelar Sepuh <span>XP pengayaan tertinggi</span></h2><ul class="rank-list">${sepuh.map(rankCard).join('')}</ul></section>`:''}
 ${regular.length?`<section class="leaderboard-group" aria-label="Peringkat utama"><h2>Peringkat utama</h2><ol class="rank-list">${regular.map(rankCard).join('')}</ol></section>`:''}
 ${rows.length?'':'<div class="empty">Belum ada ekspedisi inti yang tuntas. Jadilah penjelajah pertama!</div>'}<div class="actions"><button data-nav="home">Kembali</button></div></section>`;
}
