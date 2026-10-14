import {esc} from './activities.js';
import {getMission} from '../../shared/missions.js';
import {getIndicatorRubric} from '../../shared/indicator-rubrics.js';

export function assessmentDetailHtml(missionId,row,session) {
 const mission=getMission(missionId),rubric=getIndicatorRubric(missionId).indicators.find(i=>i.id===row.id);
 const teacher=row.status==='teacher'||session?.indicatorAssessment?.source==='teacher';
 const review=teacher?'Sudah ditinjau guru':row.status==='needs_review'?'Menunggu tinjauan guru':'Belum ditinjau guru';
 const references=row.references||[];
 return `<details class="assessment-detail"><summary>Dasar penilaian</summary><p>${review}</p>${row.group==='pending'&&row.level!==null?'<p>Bukti sebelumnya. Jawaban terbaru masih diperiksa.</p>':''}<h5>Bukti jawabanmu</h5>${references.length?references.map(ref=>`<p>${esc(ref.key==='response'?'Jawaban kasus baru':(mission.rules.fields.find(f=>f.key===ref.key)?.label||'Jawaban').replaceAll('_',' '))}</p><blockquote>${esc(ref.quote)}</blockquote>`).join(''):'<p>Belum ada bukti yang dapat ditampilkan.</p>'}<p>${esc(row.reason||'Jawaban belum selesai dinilai.')}</p><details><summary>Acuan kemampuan</summary><ol>${Object.values(rubric.descriptors).map(d=>`<li>${esc(d)}</li>`).join('')}</ol></details>${teacher?`<p>Catatan guru: ${esc(session?.indicatorAssessment?.feedback||row.reason)}</p>`:''}${session?.indicatorHistory?.some(a=>a.source==='teacher')?`<details><summary>Riwayat tinjauan guru</summary>${session.indicatorHistory.filter(a=>a.source==='teacher').map(a=>`<p>${esc(a.indicators?.find(i=>i.id===row.id)?.reason||a.feedback||'Ditinjau guru.')}</p>`).join('')}</details>`:''}</details>`;
}
