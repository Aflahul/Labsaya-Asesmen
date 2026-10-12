import { MISSION_EVIDENCE } from "./mission-evidence.js";
import { MISSION_ALIGNMENT } from "./mission-alignment.js";
import { upgradeScoring } from "./assessment.js";
import { MISSIONS, getMission } from "./missions.js";
import { summarizeProgress } from "./progress.js";
export const buildReport = (progress) => {
  const summary = summarizeProgress(progress);
  return {
    ...summary,
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
