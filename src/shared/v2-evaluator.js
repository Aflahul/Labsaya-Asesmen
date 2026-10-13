import { scoreMission } from "./mission-scoring.js";
import { runPython } from "./python.js";
export function initialV2(m) {
  return {
    answers: { ...(m.code ? { code: m.code } : {}) },
    tested: false,
    trace: null,
  };
}
export function actionV2(m, state, a) {
  if (
    a.op !== "answer" ||
    typeof a.key !== "string" ||
    typeof a.value !== "string"
  )
    return { state, errors: ["Tindakan tidak sesuai misi"] };
  const f = m.rules.fields.find((f) => f.key === a.key),
    written = m.written?.some(([k]) => k === a.key),
    code = a.key === "code" && m.code;
  if (
    (!f && !written && !code) ||
    a.value.length > (code ? 6000 : written ? 5000 : 300) ||
    (f?.options && !f.options.includes(a.value))
  )
    return { state, errors: ["Pilihan tidak sesuai misi"] };
  return {
    state: {
      ...state,
      answers: { ...state.answers, [a.key]: a.value },
      tested: false,
      trace: null,
    },
    errors: [],
  };
}
export function evaluateV2(m, state, assessmentRevision = 1) {
  const a = state.answers || {};
  if (m.written) {
    const ready = m.written.every(
      ([k]) => typeof a[k] === "string" && a[k].trim().length > 0,
    );
    return {
      ready,
      pending: true,
      accuracy: null,
      feedback: ready
        ? "Jawabanmu tersimpan. Saat tersinkron, Nara akan menilainya dengan rubrik; guru dapat membantu jika layanan belum tersedia."
        : "Lengkapi bagian: " +
          m.written
            .filter(([k]) => !a[k]?.trim())
            .map(([, label]) => label)
            .join("; ") +
          ".",
    };
  }
  const fields = m.rules.fields;
  const ready =
    fields.every((f) => a[f.key] !== undefined) &&
    (!m.code || !!a.code?.trim());
  let total = fields.reduce((sum, f) => sum + f.weight, 0),
    correct = fields.reduce(
      (sum, f) => sum + (a[f.key] === m.rules.answers[f.key] ? f.weight : 0),
      0,
    ),
    runs = [];
  if (m.kind === "python") {
    const samples =
      assessmentRevision >= 2
        ? [
            [70, 80, 90, 60, 100],
            [60, 80, 100],
            [30, 50, 70, 90],
          ]
        : [
            [70, 80, 90, 60, 100],
            [50, 70, 60, 80, 90],
            [20, 40, 60, 80, 100],
          ];
    runs = samples.map((nilai) => ({
      input: nilai,
      expected: nilai.reduce((a, b) => a + b) / nilai.length,
      ...runPython(a.code || "", { nilai }),
    }));
    total = 100;
    correct = runs.reduce(
      (sum, r) =>
        sum +
        (r.ok && r.outputs.length === 1 && r.outputs[0] === r.expected
          ? 100 / 3
          : 0),
      0,
    );
  } else if (m.kind === "python-debug") {
    const inputs =
      assessmentRevision >= 2
        ? [
            ["Pangan", "Kayu", "Batu"],
            ["Beras", "Kayu", "Batu", "Minyak"],
          ]
        : [
            ["Pangan", "Kayu", "Batu"],
            ["Beras", "Kayu", "Batu"],
          ];
    runs = inputs.map((kargo) => ({
      input: kargo,
      expected: [kargo[0], "Air", ...kargo.slice(3), "Obat"],
      ...runPython(a.code || "", { kargo }),
    }));
    total += 40;
    correct += runs.reduce(
      (sum, r) =>
        sum +
        (r.ok && JSON.stringify(r.outputs.at(-1)) === JSON.stringify(r.expected)
          ? 20
          : 0),
      0,
    );
  }
  const accuracy = total ? Math.round((100 * correct) / total) : 0;
  return {
    ready,
    accuracy,
    runs,
    feedback: !ready
      ? "Lengkapi bagian: " +
        [
          ...fields.filter((f) => a[f.key] === undefined).map((f) => f.label),
          ...(m.code && !a.code?.trim() ? ["Editor program"] : []),
        ].join("; ") +
        "."
      : accuracy === 100
        ? "Semua hasil sesuai syarat. Jalur siap dipulihkan."
        : `${accuracy}% jawaban sesuai syarat. Periksa kembali pilihan atau hasil uji yang belum sesuai. Kamu boleh memperbaiki jawaban sebelum mengirim.`,
  };
}
export function reduceV2(old, e, m) {
  if (old.events.some((x) => x.id === e.id) || old.status !== "active")
    return old;
  const s = structuredClone(old);
  s.events.push(e);
  s.activeMs = Math.max(s.activeMs, e.activeMs);
  s.feedback = "";
  if (e.type === "action") {
    const r = actionV2(m, s.state, e.payload);
    s.state = r.state;
    if (r.errors.length) {
      s.errors++;
      s.feedback = r.errors.join(" ");
    }
  }
  if (e.type === "hint") s.hints++;
  if (e.type === "reset") {
    s.resets++;
    s.state = initialV2(m);
  }
  if (["run", "submit"].includes(e.type)) {
    const r = evaluateV2(m, s.state, s.assessmentRevision);
    const newAttempt = e.type === "run" || !s.state.tested;
    if (newAttempt) {
      s.attempts++;
      if (!r.ready || (!r.pending && r.accuracy < 100)) s.errors++;
    }
    s.feedback = r.feedback;
    s.state.trace = r.runs || null;
    s.state.tested = true;
    if (e.type === "submit" && r.ready) {
      s.firstAccuracy = r.accuracy;
      s.status = r.pending ? "pending_review" : "complete";
      s.submittedAt = new Date().toISOString();
      s.completedAt = r.pending ? null : s.submittedAt;
      if (!r.pending) {
        const { score, ...components } = scoreMission(s, r.accuracy);
        s.score = score;
        s.components = components;
      }
    }
  }
  return s;
}
export function gradeReview(session, m, marks, comment, teacherId, metadata = {}) {
  const correction = session.status === "complete" && session.review?.source === "ai" && metadata.source !== "ai";
  if (!m.written || (session.status !== "pending_review" && !correction))
    throw Error("Karya tidak menunggu penilaian");
  if (typeof comment !== "string" || !comment.trim() || comment.length > 3000)
    throw Error("Tuliskan umpan balik guru");
  if (!marks || Object.keys(marks).length !== m.rubric.length)
    throw Error("Rubrik belum lengkap");
  for (const [key, , max] of m.rubric)
    if (!Number.isFinite(marks[key]) || marks[key] < 0 || marks[key] > max)
      throw Error("Skor rubrik di luar rentang");
  const accuracy = m.rubric.reduce((n, [key]) => n + marks[key], 0);
  const { score, ...components } = scoreMission(session, accuracy);
  return {
    ...session,
    status: "complete",
    score,
    firstAccuracy: accuracy,
    components,
    completedAt: new Date().toISOString(),
    ...(correction ? { reviewHistory: [...(session.reviewHistory || []), session.review] } : {}),
    review: {
      teacherId,
      marks,
      comment: comment.trim(),
      at: new Date().toISOString(),
      source: metadata.source || "teacher",
      ...(metadata.model ? { model: metadata.model } : {}),
      ...(metadata.provider ? { provider: metadata.provider } : {}),
      ...(metadata.reasons ? { reasons: metadata.reasons } : {}),
    },
    feedback: metadata.source === "ai" ? comment.trim() : "Karya sudah dinilai guru. " + comment.trim(),
  };
}
