import { db } from "@workspace/db";
import { battlePassSeasonsTable, battlePassProgressTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

export async function grantPassXp(charId: string, amount: number): Promise<void> {
  const seasons = await db
    .select()
    .from(battlePassSeasonsTable)
    .where(eq(battlePassSeasonsTable.isActive, true))
    .limit(1);
  if (!seasons.length) return;
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
    await db
      .update(battlePassProgressTable)
      .set({ passXp: existing[0].passXp + amount, updatedAt: new Date() })
      .where(eq(battlePassProgressTable.id, existing[0].id));
  } else {
    await db.insert(battlePassProgressTable).values({
      charId,
      seasonId: season.id,
      passXp: amount,
      claimedTiers: [],
    });
  }
}
