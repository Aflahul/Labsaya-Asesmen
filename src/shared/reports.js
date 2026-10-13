import { summarizeIndicators } from "./indicator-assessment.js";
import { getIndicatorRubric } from "./indicator-rubrics.js";
import { MISSION_EVIDENCE } from "./mission-evidence.js";
import { MISSION_ALIGNMENT } from "./mission-alignment.js";
import { upgradeScoring } from "./assessment.js";
import { MISSIONS, getMission } from "./missions.js";
import { summarizeProgress } from "./progress.js";
export const buildReport = (progress) => {
  const summary = summarizeProgress(progress);
  return {
    ...summary,
    indicatorRows: summarizeIndicators(progress.sessions || [],progress.indicatorThreshold?.threshold),
    rows: [
      ...MISSIONS,
      ...Array.from(
        new Set(
          progress.sessions
            .filter((s) => s.missionVersion === 1)
            .map((s) => s.missionId),
        ),
      ).map(getMission),
    ].map((m) => {
      const ss = progress.sessions
        .map(upgradeScoring)
        .filter((s) => s.missionId === m.id);
      const s =
        ss.find((s) => s.id === summary.bestByMission[m.id]?.id) || ss.at(-1);
      const gameSession =
        ss.find((s) => s.id === summary.gameBestByMission[m.id]?.id) || s;
      return {
        Misi: m.title,
        Versi: m.missionVersion,
        RevisiUji: s ? (s.assessmentRevision ?? 1) : "",
        Bloom: m.bloom || "Arsip",
        AKM: m.akm || "",
        Kompetensi: m.competency,
        Indikator: m.indicators.join(" "),
        "Bukti yang diperiksa": MISSION_EVIDENCE[m.id] || "",
        "TP terkait": MISSION_ALIGNMENT[m.id]?.tp || "",
        "Indikator terkait": MISSION_ALIGNMENT[m.id]?.indicators || "",
        "Batas bukti": MISSION_ALIGNMENT[m.id]?.limit || "",
        Jenis: m.enrichment ? "Pengayaan" : "Inti",
        Status:
          s?.status === "complete"
            ? "Selesai"
            : s?.status === "pending_review"
              ? "Menunggu penilaian"
              : "Belum selesai",
        Nilai: summary.missionGrades[m.id]?.score ?? "",
        SkorGame: summary.gameMissionGrades[m.id]?.score ?? "",
        NilaiSesiTerbaik: gameSession?.score ?? "",
        Pengulangan: summary.gameMissionGrades[m.id]?.replayCount ?? 0,
        PotonganUlang: summary.gameMissionGrades[m.id]?.replayPenalty ?? 0,
        SesiKompetensi: s?.id ?? "",
        SesiGame: gameSession?.id ?? "",
        K: summary.missionGrades[m.id]?.score ?? "",
        W: gameSession?.components?.W ?? "",
        P: gameSession?.components?.P ?? "",
        H: gameSession?.components?.H ?? "",
        E: gameSession?.components?.E ?? "",
        Detik: Math.round((gameSession?.activeMs || 0) / 1000),
        Percobaan: gameSession?.attempts || 0,
        Kesalahan: gameSession?.errors || 0,
        Ulang: gameSession?.resets || 0,
        Petunjuk: gameSession?.hints || 0,
      };
    }),
  };
};
export function toCsv(rows) {
  if (!rows.length) return "\uFEFF";
  const keys = Object.keys(rows[0]);
  const cell = (value) => {
    let s = String(value ?? "");
    if (typeof value === "string" && /^[\s]*[=+\-@]/.test(s)) s = "'" + s;
    return '"' + s.replaceAll('"', '""') + '"';
  };
  return (
    "\uFEFF" +
    [
      keys.map(cell).join(","),
      ...rows.map((r) => keys.map((k) => cell(r[k])).join(",")),
    ].join("\r\n")
  );
}
export const exportJson = (progress) =>
  JSON.stringify(
    { schemaVersion: 1, exportedAt: new Date().toISOString(), ...progress },
    null,
    2,
  );

export const INDICATOR_GROUPS = {independent:'Memenuhi mandiri',needs_support:'Perlu penguatan',assisted:'Berhasil dengan bantuan',insufficient:'Belum cukup bukti',pending:'Menunggu penilaian/tinjauan'};
export function buildIndicatorClassReport(participants,{className='',threshold=3,thresholdVersion=1}={}) {
 const roster=participants.filter(p=>!className||p.class_name===className);
 const results=roster.map(p=>({participant:p,results:p.sessions?summarizeIndicators(p.sessions,threshold):(p.summary?.indicatorResults||[])}));
 const rows=MISSIONS.flatMap(m=>getIndicatorRubric(m.id).indicators.map(i=>{
  const groups=Object.fromEntries(Object.keys(INDICATOR_GROUPS).map(k=>[k,[]]));
  for(const {participant:p,results:r} of results){
   const result=r.find(x=>x.id===i.id);
   let group=result?.group||'insufficient';
   if(result?.level!==null&&result?.level!==undefined&&['independent','assisted','needs_support'].includes(group))group=result.level<threshold?'needs_support':result.evidenceMode==='practice'?'assisted':'independent';
   groups[group].push({id:p.id,name:p.real_name||p.realName||p.alias||p.id,className:p.class_name,level:result?.level??null,sessionId:result?.sessionId});
  }
  return {...i,missionId:m.id,missionTitle:m.title,enrichment:Boolean(m.enrichment),groups};
 }));
 const tpMap=new Map();
 for(const row of rows)for(const link of row.tpLinks){
   const id=`${link.tp}:${link.indicator||'prasyarat'}:${row.enrichment?'pengayaan':'inti'}`;
   if(!tpMap.has(id))tpMap.set(id,{id,label:link.indicator||`${link.tp} · Prasyarat`,indicator:link.indicator,missionTitle:'Gabungan bukti misi',enrichment:row.enrichment,tpLinks:[link],members:[]});
   tpMap.get(id).members.push(row);
 }
 const tpRows=[...tpMap.values()].map(row=>{
   const groups=Object.fromEntries(Object.keys(INDICATOR_GROUPS).map(k=>[k,[]]));
   for(const p of roster){
     const classified=row.members.map(r=>Object.entries(r.groups).find(([,people])=>people.some(x=>x.id===p.id)));
     const labels=classified.map(([key])=>key);
     const group=['needs_support','pending','insufficient','assisted','independent'].find(key=>labels.includes(key));
     const levels=classified.flatMap(([,people])=>people.filter(x=>x.id===p.id&&x.level!==null).map(x=>x.level));
     groups[group].push({id:p.id,name:p.real_name||p.realName||p.alias||p.id,level:levels.length?Math.min(...levels):null});
   }
   return {...row,groups,fullCoverage:row.members.every(r=>r.tpLinks.every(l=>l.coverage==='direct')),mappedIndicatorIds:row.members.map(r=>r.id)};
 });
 return {denominator:roster.length,className,threshold,thresholdVersion,rows,tpRows};
}
export function indicatorExportRows(report) {
 return [...(report.tpRows||[]),...report.rows].map(r=>({'Lingkup':r.members?'Gabungan indikator TP':'Indikator misi',Misi:r.missionTitle,Indikator:r.id,Kemampuan:r.label,TP:r.tpLinks.map(x=>x.tp).join('; '),'Indikator TP':r.tpLinks.map(x=>x.indicator||'Prasyarat').join('; '),'Cakupan bukti':r.tpLinks.map(x=>x.coverage).join('; '),'Jumlah murid':report.denominator,'Ambang tingkat':report.threshold,'Versi ambang':report.thresholdVersion,...Object.fromEntries(Object.entries(INDICATOR_GROUPS).flatMap(([key,label])=>[[label,r.groups[key].length],[`${label}: murid`,r.groups[key].map(p=>p.name).join('; ')]]))}));
}
