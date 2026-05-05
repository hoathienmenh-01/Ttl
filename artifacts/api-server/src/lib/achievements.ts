import { db } from "@workspace/db";
import {
  achievementTemplatesTable, characterAchievementsTable,
  characterSkillsTable, missionProgressTable, charactersTable,
} from "@workspace/db";
import { eq, and } from "drizzle-orm";

export async function checkAndAwardAchievements(charId: string): Promise<string[]> {
  const chars = await db.select().from(charactersTable).where(eq(charactersTable.id, charId)).limit(1);
  const char = chars[0];
  if (!char) return [];

  const [templates, alreadyEarned, skills, quests] = await Promise.all([
    db.select().from(achievementTemplatesTable),
    db.select().from(characterAchievementsTable).where(eq(characterAchievementsTable.charId, charId)),
    db.select().from(characterSkillsTable).where(eq(characterSkillsTable.charId, charId)),
    db.select().from(missionProgressTable).where(
      and(eq(missionProgressTable.charId, charId), eq(missionProgressTable.status, "claimed"))
    ),
  ]);

  const earnedIds = new Set(alreadyEarned.map(e => e.achievementId));
  const newlyEarned: string[] = [];

  for (const t of templates) {
    if (earnedIds.has(t.id)) continue;

    let met = false;
    const condData = t.conditionData as Record<string, any> | null;

    switch (t.conditionType) {
      case "dungeon_clear":
        met = char.dungeonClears >= t.conditionValue;
        break;
      case "boss_kill":
        met = char.bossKills >= t.conditionValue;
        break;
      case "quest_complete":
        met = quests.length >= t.conditionValue;
        break;
      case "breakthrough_realm":
        met = char.realmKey.startsWith(condData?.realmKey ?? "NOMATCH");
        break;
      case "skill_learn":
        met = skills.length >= t.conditionValue;
        break;
      case "level":
        met = char.level >= t.conditionValue;
        break;
      case "alchemy_craft":
        met = char.alchemyCrafts >= t.conditionValue;
        break;
    }

    if (met) {
      await db.insert(characterAchievementsTable).values({
        charId,
        achievementId: t.id,
      });
      earnedIds.add(t.id);
      newlyEarned.push(t.name);
    }
  }

  return newlyEarned;
}
