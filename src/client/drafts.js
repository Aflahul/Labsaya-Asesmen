// Text drafts are snapshots, not one full assessment event per keystroke.
export function updateDraft(session, mission, key, value) {
  if (session.status !== "active") throw Error("Karya sudah dikirim");
  const code = key === "code" && mission.code;
  const written = mission.written?.some(([name]) => name === key) || (session.masteryCheck && key === "response");
  if (
    (!code && !written) ||
    typeof value !== "string" ||
    value.length > (code ? 6000 : 5000)
  )
    throw Error("Draf tidak sesuai misi");
  session.draftAnswers = { ...session.draftAnswers, [key]: value };
}
export function drainDrafts(session) {
  const answers = session.draftAnswers || {};
  delete session.draftAnswers;
  return Object.entries(answers).map(([key, value]) => ({
    op: "answer",
    key,
    value,
  }));
}
export function draftState(session) {
  return session.status === "active" && session.draftAnswers
    ? {
        ...session.state,
        answers: { ...session.state.answers, ...session.draftAnswers },
        tested: false,
        trace: null,
      }
    : session.state;
}
