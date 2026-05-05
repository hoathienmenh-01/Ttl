import { db } from "@workspace/db";
import { missionTemplatesTable, missionProgressTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { isStaleDailyGrindClaim } from "./dailyMission";

/**
 * Auto-track mission progress by objective type.
 * Call this after any game event (dungeon_clear, boss_kill, alchemy_craft, cultivate, breakthrough).
 * Returns names of missions newly marked as "completed" (ready to claim).
 */
export async function trackMissionProgress(
  charId: string,
  objectiveType: string,
  delta: number = 1,
): Promise<string[]> {
  const templates = await db
    .select()
    .from(missionTemplatesTable)
    .where(eq(missionTemplatesTable.objectiveType, objectiveType));

  if (!templates.length) return [];

  const now = new Date();
  const completedNames: string[] = [];

  for (const t of templates) {
    const progRows = await db
      .select()
      .from(missionProgressTable)
      .where(
        and(
          eq(missionProgressTable.charId, charId),
          eq(missionProgressTable.templateId, t.id),
        ),
      )
      .limit(1);

    const prog = progRows[0];
    if (!prog) continue;

    let currentProgress = prog.progress;
    let currentStatus = prog.status;

    const wasStaleDailyGrind = isStaleDailyGrindClaim(t, prog, now);
    if (currentStatus === "claimed") {
      if (!wasStaleDailyGrind) continue;
      currentProgress = 0;
      currentStatus = "accepted";
    }

    if (currentStatus !== "accepted" && currentStatus !== "completed") continue;

    const wasAlreadyComplete = currentStatus === "completed";
    const newProgress = Math.min(t.progressMax, currentProgress + delta);
    const isNowComplete = newProgress >= t.progressMax;
    const newStatus = isNowComplete ? "completed" : "accepted";

    await db
      .update(missionProgressTable)
      .set({
        progress: newProgress,
        status: newStatus,
        ...(wasStaleDailyGrind ? { claimedAt: null } : {}),
        ...(wasStaleDailyGrind && !isNowComplete ? { completedAt: null } : {}),
        ...(isNowComplete && !wasAlreadyComplete ? { completedAt: now } : {}),
      })
      .where(eq(missionProgressTable.id, prog.id));

    if (isNowComplete && !wasAlreadyComplete) {
      completedNames.push(t.name);
    }
  }

  return completedNames;
}
