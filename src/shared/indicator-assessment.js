import { MISSIONS } from "./missions.js";
import { getIndicatorRubric } from './indicator-rubrics.js';
import { evaluateV2 } from './v2-evaluator.js';
import { missionMasteryCheck } from './mastery-checks.js';
export const INDICATOR_POLICY = 'indicator-v1';
export const isUnknown = value => !String(value || '').trim() || /^(?:tidak|nggak|gak|ga|belum)\s*(?:ta[hu]+|tau+|paham|mengerti)[.!?\s]*$/i.test(String(value).trim());
export function limitNaraFeedback(value) {
 const chars=Array.from(String(value||'').trim());
 if(chars.length<=400)return chars.join('');
 const prefix=chars.slice(0,399).join('');
 return prefix.match(/^[\s\S]*[.!?](?=\s|$)/)?.[0] || prefix.replace(/\s+\S*$/,'').trimEnd()+'…';
}
export function buildAssessmentEvidence(mission,session) {
 const check=session.masteryCheck;
 const result=evaluateV2(mission,session.state,session.assessmentRevision);
 return {answers:check?{response:check.answer}:session.state.answers,
   mode:check && !check.hints && !session.scoringConfig?.previousCheckExposure ? 'independent_check' : !check && !(session.hints || session.scoringConfig?.previousExposure || session.events?.some(e=>e.type==='run')) ? 'independent_submission' : 'practice',
   check:check?missionMasteryCheck(mission.id):null,
   assistance:{hints:session.hints||0,checkHints:check?.hints||0},
   fieldResults:check?{}:Object.fromEntries(mission.rules.fields.map(f=>[f.key,session.state.answers[f.key]===mission.rules.answers[f.key]])),
   runs:check?[]:result.runs||[]};
}
export function fallbackNara(rubric,evidence,priorityId) {
 const i=rubric.indicators.find(i=>i.id===priorityId)||rubric.indicators.find(i=>i.fields.some(k=>isUnknown(evidence.answers[k])))||rubric.indicators.find(i=>i.fields.some(k=>evidence.fieldResults?.[k]===false))||rubric.indicators[0];
 if(evidence.check) return limitNaraFeedback(`Kita mulai dari satu bagian pada kasus baru ini. Pilih satu data yang masuk, lalu tulis aturan yang perlu diperiksa sebelum menghasilkan jawaban. Kamu boleh memakai kalimat biasa. Setelah itu, coba satu contoh dari soal dan jelaskan mengapa hasilnya sesuai aturan. Jika belum yakin, tulis bagian yang membuatmu bingung agar guru dapat membantumu.`);
 const allUnknown=Object.values(evidence.answers).every(isUnknown);
 if(i.id==='v2p05m04.reason'&&!allUnknown) return 'Kita periksa satu batas dulu. Aturannya, berat kargo paling banyak 10 kg. Jika berat tepat 10 kg dan syarat lain terpenuhi, apakah pesawat boleh berangkat? Bandingkan dengan berat 11 kg. Coba jelaskan perbedaannya dengan kalimatmu sendiri. Dari contoh itu, kamu bisa mulai menulis alasan mengapa langkah programmu sesuai aturan.';
 if(i.id==='v2p05m04.tests'&&!allUnknown) return 'Mulai dari data A saja: 6 paket, berat 10 kg, energi 12 unit, dan disetujui. Setiap paket memerlukan 2 unit energi. Coba hitung kebutuhan energinya dahulu, lalu bandingkan dengan energi yang tersedia. Setelah itu, periksa berat dan persetujuannya. Menurutmu, apakah semua syarat terpenuhi? Tulis keputusan dan satu alasannya.';
 if(rubric.indicators[0].id.startsWith('v2p05m04')) return 'Kita mulai dari contoh kecil. Kalau berat kargo diisi −2 kg, apakah berat itu masuk akal? Sebelum menghitung energi, program perlu memastikan datanya bisa digunakan. Coba tulis: jika berat kurang dari 0, program harus menampilkan pesan apa? Kamu boleh menjawab dengan kalimat biasa, lalu kita lanjutkan langkah berikutnya.';
 return limitNaraFeedback(`Kita periksa satu bagian dulu: ${i.label.toLowerCase()}. ${missionMasteryCheck(i.id.split('.')[0]).prompt} Tulis satu langkah yang kamu pahami; kamu boleh memakai kalimat sendiri.`);
}
export function validateIndicatorGrade(rubric,evidence,proposal) {
 if(!Array.isArray(proposal?.indicators)||proposal.indicators.length!==rubric.indicators.length)throw Error('Rubrik indikator tidak lengkap');
 const ids=new Set();
 const indicators=rubric.indicators.map(i=>{
  const p=proposal.indicators.find(p=>p.id===i.id);
  if(!p||ids.has(p.id)||proposal.indicators.filter(p=>p.id===i.id).length!==1)throw Error('ID indikator tidak sesuai');
  ids.add(p.id);
  if(!['present','insufficient'].includes(p.evidenceStatus)|| !(p.level===null||Number.isInteger(p.level)&&p.level>=1&&p.level<=4))throw Error('Tingkat indikator tidak valid');
  if(typeof p.reason!=='string'||!p.reason.trim()||p.reason.length>1000||!Array.isArray(p.references))throw Error('Alasan indikator tidak lengkap');
  const keys=evidence.check?['response']:i.fields;
  const references=p.references.map(ref=>{
   if(!keys.includes(ref.key)||typeof ref.quote!=='string'||!ref.quote.trim()||ref.quote.length>1000||!String(evidence.answers[ref.key]||'').includes(ref.quote))throw Error('Bukti indikator tidak sesuai jawaban');
   return {key:ref.key,quote:ref.quote};
  });
  const unknown=keys.every(k=>isUnknown(evidence.answers[k]));
  if(!unknown && p.evidenceStatus==='present' && (!references.length||p.level===null))throw Error('Bukti indikator belum dirujuk');
  let level=p.level,evidenceStatus=p.evidenceStatus;
  if(unknown||p.evidenceStatus==='insufficient'){level=null;evidenceStatus='insufficient';}
  const deterministic=i.fields.filter(k=>Object.hasOwn(evidence.fieldResults||{},k));
  if(level!==null&&deterministic.length){
   const correct=deterministic.filter(k=>evidence.fieldResults[k]).length;
   level=Math.min(level,correct===deterministic.length?3:correct?2:1);
  }
  if(level!==null&&i.fields.includes('code')&&evidence.runs?.length){
   const ok=evidence.runs.filter(r=>r.ok&&JSON.stringify(r.outputs.at(-1))===JSON.stringify(r.expected)).length;
   level=Math.min(level,ok===evidence.runs.length?3:ok?2:1);
  }
  if(level===4 && evidence.mode!=='independent_check')level=3;
  return {id:i.id,level,evidenceStatus,references:unknown?[]:references,reason:unknown?'Belum ada penjelasan yang cukup untuk menilai kemampuan ini.':p.reason.trim()};
 });
 if(typeof proposal.feedback!=='string'||!proposal.feedback.trim()||Array.from(proposal.feedback).length>2000)throw Error('Umpan balik indikator tidak valid');
 const allChoicesCorrect=!evidence.check && rubric.indicators.every(i=>i.fields.every(key=>evidence.fieldResults?.[key]===true)) && indicators.every(i=>i.level>=3);
 let feedback=indicators.some(i=>i.level===null)?fallbackNara(rubric,evidence,indicators.find(i=>i.level===null).id):limitNaraFeedback(proposal.feedback);
 if(allChoicesCorrect){
   const missionId=rubric.indicators[0].id.split('.')[0];
   const lead=missionId==='v2p01m01'?'Nomor teleponmu String, berat Float, jumlah paket 3, dan persetujuan True: semuanya sesuai.':'Jawabanmu sesuai pada kasus misi ini.';
   feedback=limitNaraFeedback(`${lead} Sekarang tekan Uji Mandiri untuk mencoba kasus baru. ${missionMasteryCheck(missionId).prompt} Jelaskan pilihanmu dengan kalimat sendiri; kamu boleh mencoba lagi tanpa kehilangan XP.`);
 }
 return {indicators,feedback};
}
export function combineIndicatorReviews(rubric,evidence,providerReviews,expectedReviewers=3) {
 const valid=providerReviews.filter(r=>r.status==='complete');
 const geminiOnly=expectedReviewers===2&&valid.length===1&&valid[0].provider==='google'&&providerReviews.some(r=>r.provider==='groq'&&r.status==='unavailable'&&r.error==='HTTP_429');
 const indicators=rubric.indicators.map(i=>{
  const rows=valid.map(r=>r.result.indicators.find(x=>x.id===i.id));
  const levels=rows.map(x=>x.level).filter(x=>x!==null).sort((a,b)=>a-b);
  const conflicting=rows.some(x=>x.evidenceStatus!==rows[0]?.evidenceStatus)||levels.length>0&&levels.at(-1)-levels[0]>=2;
  const level=levels.length?levels[Math.floor(levels.length/2)]:null;
  const status=!valid.length?'unavailable':conflicting?'needs_review':geminiOnly?'single':valid.length<expectedReviewers?'partial':new Set(levels).size>1?'provisional':'agreed';
  const representative=rows.find(r=>r.level===level)||rows[0];
  return {id:i.id,level,evidenceStatus:level===null?'insufficient':'present',references:representative?.references||[],reason:representative?.reason||'Penilaian belum tersedia.',status,reviewerCount:valid.length};
 });
 const priority=['needs_review','unavailable','partial','provisional','single','agreed'];
 const status=priority.find(s=>indicators.some(i=>i.status===s));
 const candidate=valid.find(r=>r.result.indicators.every(i=>i.level===indicators.find(x=>x.id===i.id).level));
 const feedback=limitNaraFeedback(candidate?.result.feedback||fallbackNara(rubric,evidence));
 return {providerReviews,indicators,status,feedback,...(geminiOnly?{gradingMode:'gemini_only',fallbackReason:'groq_rate_limit'}:{})};
}

export function summarizeIndicators(sessions, threshold=3) {
 return MISSIONS.flatMap(m=>getIndicatorRubric(m.id).indicators.map(i=>{
  const candidates=sessions.filter(s=>s.missionId===m.id&&s.assessmentPolicy===INDICATOR_POLICY&&s.activityCompletedAt).sort((a,b)=>(b.submittedAt||b.activityCompletedAt||b.completedAt||'').localeCompare(a.submittedAt||a.activityCompletedAt||a.completedAt||''));
  const valid=s=>s.indicatorAssessment?.indicators?.find(x=>x.id===i.id&&['agreed','provisional','single','teacher'].includes(x.status||s.indicatorAssessment.status));
  const independent=candidates.find(s=>['independent_check','independent_submission','teacher_observation'].includes(s.indicatorAssessment?.evidenceMode)&&valid(s));
  const selected=independent||candidates.find(valid);
  const result=selected&&valid(selected);
  const latest=candidates[0];
  const newestResult=latest?.indicatorAssessment?.indicators?.find(x=>x.id===i.id);
  const unresolved=latest&&!valid(latest)&&(!independent||['independent_check','independent_submission'].includes(latest.indicatorAssessment?.evidenceMode));
  let group=unresolved?'pending':!result||result.level===null?'insufficient':result.level<threshold?'needs_support':independent?'independent':'assisted';
  return {...i,evidenceMode:selected?.indicatorAssessment?.evidenceMode||"practice",missionId:m.id,missionTitle:m.title,enrichment:Boolean(m.enrichment),level:result?.level??null,evidenceStatus:result?.evidenceStatus||'insufficient',group,sessionId:selected?.id||latest?.id,references:result?.references||[],reason:result?.reason||'Belum ada bukti penilaian indikator.',status:unresolved?newestResult?.status||latest.indicatorAssessment?.status:result?.status||'insufficient',pendingStatus:latest?.indicatorAssessment?.status,threshold};
 }));
}
