import { db } from "@workspace/db";
import { battlePassSeasonsTable, battlePassProgressTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

export async function grantBattlePassXp(charId: string, xp: number): Promise<number> {
  const seasons = await db
    .select()
    .from(battlePassSeasonsTable)
    .where(eq(battlePassSeasonsTable.isActive, true))
    .limit(1);

  if (!seasons.length) return 0;
  const season = seasons[0];

  const existing = await db
    .select()
    .from(battlePassProgressTable)
    .where(
      and(
        eq(battlePassProgressTable.charId, charId),
        eq(battlePassProgressTable.seasonId, season.id),
      ),
    )
    .limit(1);

  if (existing.length) {
    const newXp = existing[0].passXp + xp;
    await db
      .update(battlePassProgressTable)
      .set({ passXp: newXp, updatedAt: new Date() })
      .where(eq(battlePassProgressTable.id, existing[0].id));
    return newXp;
  } else {
    await db.insert(battlePassProgressTable).values({
      charId,
      seasonId: season.id,
      passXp: xp,
      claimedTiers: [],
    });
    return xp;
  }
}
