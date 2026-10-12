// Shared by local play, server replay and teacher review.
export const SCORE_WEIGHTS = { K: 0.6, H: 0.1, P: 0.1, E: 0.1, W: 0.1 };
const clamp = (n) => Math.max(0, Math.min(100, n));
export function scoreMission(
  session,
  accuracy,
  config = session.scoringConfig || {},
) {
  const baseline = config.timeBudgetSeconds || 300;
  const K = clamp(accuracy ?? 0);
  const freeHints = config.formulaVersion >= 4 ? 1 : 0;
  const H = clamp(100 - 25 * Math.max(0, (session.hints || 0) - freeHints));
  const P = clamp(
    100 -
      10 * Math.max(0, (session.attempts || 0) - 1) -
      10 * Math.max(0, (session.resets || 0) - 1),
  );
  const E = clamp(100 - 20 * (session.errors || 0));
  const W = clamp(
    100 *
      (1 -
        Math.max(0, (session.activeMs || 0) / 1000 - baseline) /
          (2 * baseline)),
  );
  const components = { K, H, P, E, W: Math.round(W * 100) / 100 };
  const score =
    Math.round(
      Object.entries(SCORE_WEIGHTS).reduce(
        (sum, [key, weight]) => sum + components[key] * weight,
        0,
      ) * 100,
    ) / 100;
  return { ...components, score };
}
