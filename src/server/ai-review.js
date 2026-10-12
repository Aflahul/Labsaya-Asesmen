import { getMission } from "../shared/missions.js";
import { upgradeScoring } from "../shared/assessment.js";
import { gradeReview } from "../shared/v2-evaluator.js";
import { gradeWithGemini, validateAiGrade, aiFailureDetails } from "./ai-grader.js";

export async function gradePendingSession(db, sessionId, grader = gradeWithGemini) {
  const current = (await db.query("SELECT document FROM mission_sessions WHERE id=$1", [sessionId])).rows[0]?.document;
  if (!current) return null;
  if (current.status !== "pending_review") return upgradeScoring(current);
  const mission = getMission(current.missionId);
  if (!mission.written || !["C5", "C6"].includes(mission.bloom)) return upgradeScoring(current);
  let result;
  try {
    const proposal = await grader(mission, current.state.answers);
    result = { ...validateAiGrade(mission, proposal), model: proposal.model };
  } catch (error) {
    console.error("[AI_GRADING_FAILURE]", { missionId: mission.id, ...aiFailureDetails(error) });
    const client = await db.connect();
    try {
      await client.query("BEGIN");
      const row = (await client.query("SELECT document FROM mission_sessions WHERE id=$1 FOR UPDATE", [sessionId])).rows[0]?.document;
      if (!row || row.status !== "pending_review") {
        await client.query("ROLLBACK");
        return row ? upgradeScoring(row) : null;
      }
      row.aiGrade = { status: "unavailable", at: new Date().toISOString() };
      await client.query("UPDATE mission_sessions SET document=$1,updated_at=$2 WHERE id=$3", [JSON.stringify(row), new Date(), sessionId]);
      await client.query("COMMIT");
      return upgradeScoring(row);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const row = (await client.query("SELECT document FROM mission_sessions WHERE id=$1 FOR UPDATE", [sessionId])).rows[0]?.document;
    if (!row || row.status !== "pending_review") {
      await client.query("ROLLBACK");
      return row ? upgradeScoring(row) : null;
    }
    const graded = gradeReview(upgradeScoring(row), mission, result.marks, result.feedback, null, {
      source: "ai",
      model: result.model || "gemini",
      reasons: result.reasons,
    });
    graded.aiGrade = { status: "complete", at: graded.completedAt };
    await client.query("UPDATE mission_sessions SET document=$1,updated_at=$2 WHERE id=$3", [JSON.stringify(graded), new Date(), sessionId]);
    await client.query("COMMIT");
    return graded;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
