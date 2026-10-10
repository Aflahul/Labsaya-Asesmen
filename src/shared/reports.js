import { MISSIONS, getMission } from "./missions.js";
import { summarizeProgress } from "./progress.js";
export const buildReport = (progress) => ({
  ...summarizeProgress(progress),
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
    const ss = progress.sessions.filter((s) => s.missionId === m.id);
    const s =
      ss
        .filter((s) => s.status === "complete")
        .sort((a, b) => b.score - a.score)[0] || ss.at(-1);
    return {
      Misi: m.title,
      Versi: m.missionVersion,
      Bloom: m.bloom || "Arsip",
      AKM: m.akm || "",
      Kompetensi: m.competency,
      Indikator: m.indicators.join(" "),
      Jenis: m.enrichment ? "Pengayaan" : "Inti",
      Status:
        s?.status === "complete"
          ? "Selesai"
          : s?.status === "pending_review"
            ? "Menunggu penilaian"
            : "Belum selesai",
      Nilai: s?.score ?? "",
      K: s?.components?.K ?? "",
      W: s?.components?.W ?? "",
      P: s?.components?.P ?? "",
      H: s?.components?.H ?? "",
      Detik: Math.round((s?.activeMs || 0) / 1000),
      Percobaan: s?.attempts || 0,
      Kesalahan: s?.errors || 0,
      Ulang: s?.resets || 0,
      Petunjuk: s?.hints || 0,
    };
  }),
});
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
