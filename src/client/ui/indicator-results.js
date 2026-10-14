import {assessmentDetailHtml} from './assessment-detail.js';
import {esc} from './activities.js';
import {getIndicatorRubric} from '../../shared/indicator-rubrics.js';
import {v2ActivityHtml} from './v2-activities.js';
import {draftState} from '../drafts.js';
export const assessmentStatus={pending:'Jawabanmu sedang diperiksa',grading:'Jawabanmu sedang diperiksa',unavailable:'Jawaban tersimpan. Hasil kemampuan menyusul.',partial:'Hasil sementara',provisional:'Hasil sementara',needs_review:'Hasil akan ditinjau guru',single:'Penilaian selesai',agreed:'Penilaian selesai',teacher:'Ditinjau guru'};
export const levelLabel={1:'Perlu latihan',2:'Mulai berkembang',3:'Sudah memahami pada misi ini',4:'Bisa menerapkan pada kasus baru'};
const goalLabel=i=>({'v2p01m01.types':'Memilih tipe data untuk nomor telepon dan berat kargo','v2p01m01.values':'Mengisi jumlah paket dan status persetujuan'})[i.id]||i.label;
export function rubricHtml(m) {
 return `<details class="indicator-rubric"><summary>Yang dinilai</summary><ul>${getIndicatorRubric(m.id).indicators.map(i=>`<li>${esc(goalLabel(i))}</li>`).join('')}</ul></details>`;
}
export function indicatorResultsHtml(m,assessment={},session) {
 return `<section class="indicator-results" aria-label="Hasil kemampuan"><h3>Kemampuanmu</h3>${['agreed','single','teacher'].includes(assessment.status)?'':`<p role="status">${esc(assessmentStatus[assessment.status]||'Jawabanmu sedang diperiksa')}</p>`}${getIndicatorRubric(m.id).indicators.map(i=>{
  const r=assessment.indicators?.find(x=>x.id===i.id);
  return `<article class="indicator-card"><h4>${esc(i.label)}</h4><strong>${r?.level?levelLabel[r.level]:'Belum cukup bukti'}</strong><p>${esc(r?.reason||'Jawabanmu tersimpan. Hasil kemampuan menyusul.')}</p>${r?assessmentDetailHtml(m.id,r,session):''}</article>`;
 }).join('')}</section>`;
}
export function indicatorMissionHtml(m,s,summary,naraHtml) {
 const done=s.status==='complete',check=s.masteryCheck;
 const content=check?`<p class="notice">${s.scoringConfig?.previousCheckExposure ? "Kasus ini pernah dicoba; hasil berikut dicatat sebagai latihan. Guru dapat memastikan kemampuan mandiri lewat kasus lain." : "Kasus baru untuk pemeriksaan mandiri."} Petunjuk tetap boleh dipakai; jika digunakan, hasil dicatat sebagai latihan dengan bantuan.</p><p>${esc(check.prompt)}</p><label for="answer-response">Jawabanmu</label><textarea id="answer-response" data-answer="response" rows="6" maxlength="5000">${esc(draftState(s).answers.response||'')}</textarea>`:v2ActivityHtml(m,draftState(s),false);
 const canRetry=['partial','unavailable','pending','grading'].includes(s.indicatorAssessment?.status);
 return `<div class="topline"><button class="ghost small" data-nav="map">← Peta</button></div><div class="mission-layout"><section class="panel mission-panel"><div class="mission-title"><div><div class="eyebrow">${esc(m.islandName)} · ${check?'UJI MANDIRI':m.enrichment?'PENGAYAAN':'MISI INTI'}</div><h2 id="mission-heading" tabindex="-1">${esc(m.title)}</h2></div><span class="badge">${done?'✓ Aktivitas selesai':'Sedang dimainkan'}</span></div><div class="mission-progress"><span>Misi ${summary.completed}/15</span><span>Waktu <strong id="timer">${Math.floor(s.activeMs/1000)} detik</strong></span><progress max="15" value="${summary.completed}" aria-label="Misi inti selesai"></progress></div><div class="instruction"><strong>Misi kita</strong><p>${esc(m.instructions)}</p></div>${rubricHtml(m)}<div class="activity" ${done?'inert':''}>${content}</div>${done?`<section class="score-breakdown"><p><strong>${m.enrichment?'Penghargaan pengayaan':'Pencapaian misi'}: 100 XP · sekali per misi</strong></p><p>Total XP inti: ${summary.xp}</p></section>${indicatorResultsHtml(m,s.indicatorAssessment,s)}`:'<p id="error" class="error" role="alert"></p>'}<div class="mission-controls">${done?`<button class="primary" id="next">Lanjut</button><button id="replay">Ulang</button><button id="mastery-check">Uji Mandiri</button>${canRetry?'<button id="refresh-progress">Periksa</button>':''}`:`${!m.written&&!check?'<button id="run">Coba</button>':''}<button class="primary" id="submit">Kirim</button><button id="hint">Petunjuk</button><button class="ghost" id="reset">Bersihkan</button>`}</div></section></div>${naraHtml}`;
}
