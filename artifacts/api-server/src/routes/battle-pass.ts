import { Router } from "express";
import { db } from "@workspace/db";
import {
  battlePassSeasonsTable, battlePassProgressTable,
  charactersTable, inventoryItemsTable, itemTemplatesTable,
} from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { logEconomy } from "../lib/economyLog";
import type { BattlePassTier } from "@workspace/db";

const router = Router();

async function getChar(userId: string) {
  const rows = await db.select().from(charactersTable).where(eq(charactersTable.userId, userId)).limit(1);
  return rows[0] ?? null;
}

router.get("/battle-pass", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const char = await getChar(user.id);
  if (!char) { res.status(404).json({ error: "Chưa tạo nhân vật", code: "NO_CHARACTER" }); return; }

  const seasons = await db.select().from(battlePassSeasonsTable)
    .where(eq(battlePassSeasonsTable.isActive, true)).limit(1);

  if (!seasons.length) {
    res.json({ season: null, progress: null });
    return;
  }

  const season = seasons[0];
  const progressRows = await db.select().from(battlePassProgressTable)
    .where(and(
      eq(battlePassProgressTable.charId, char.id),
      eq(battlePassProgressTable.seasonId, season.id),
    )).limit(1);

  const progress = progressRows[0] ?? null;

  res.json({
    season: {
      id: season.id,
      name: season.name,
      startDate: season.startDate.toISOString(),
      endDate: season.endDate.toISOString(),
      tiers: season.tiers,
    },
    progress: {
      passXp: progress?.passXp ?? 0,
      claimedTiers: progress?.claimedTiers ?? [],
    },
  });
});

router.post("/battle-pass/claim/:tier", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const char = await getChar(user.id);
  if (!char) { res.status(404).json({ error: "Chưa tạo nhân vật", code: "NO_CHARACTER" }); return; }

  const tierNum = parseInt(String(req.params.tier), 10);
  if (isNaN(tierNum)) { res.status(400).json({ error: "Tier không hợp lệ", code: "INVALID_TIER" }); return; }

  const seasons = await db.select().from(battlePassSeasonsTable)
    .where(eq(battlePassSeasonsTable.isActive, true)).limit(1);
  if (!seasons.length) { res.status(404).json({ error: "Không có mùa battle pass đang hoạt động", code: "NO_SEASON" }); return; }

  const season = seasons[0];
  const tiers = season.tiers as BattlePassTier[];
  const tierDef = tiers.find(t => t.tier === tierNum);
  if (!tierDef) { res.status(404).json({ error: "Tier không tồn tại", code: "TIER_NOT_FOUND" }); return; }

  const progressRows = await db.select().from(battlePassProgressTable)
    .where(and(
      eq(battlePassProgressTable.charId, char.id),
      eq(battlePassProgressTable.seasonId, season.id),
    )).limit(1);

  const progress = progressRows[0];
  const currentXp = progress?.passXp ?? 0;
  const claimedTiers: number[] = (progress?.claimedTiers as number[]) ?? [];

  if (claimedTiers.includes(tierNum)) {
    res.status(400).json({ error: "Tier này đã được nhận thưởng", code: "ALREADY_CLAIMED" });
    return;
  }

  if (currentXp < tierDef.xpRequired) {
    res.status(400).json({
      error: `Cần ${tierDef.xpRequired} Pass XP để nhận tier ${tierNum}. Hiện có ${currentXp}.`,
      code: "INSUFFICIENT_XP",
      current: currentXp,
      required: tierDef.xpRequired,
    });
    return;
  }

  const now = new Date();
  let linhThachGained = tierDef.linhThach ?? 0;
  let itemGranted: string | null = null;
  let titleGranted: string | null = null;

  const updates: Record<string, unknown> = { updatedAt: now };

  // Grant LS
  if (linhThachGained > 0) {
    updates.linhThach = char.linhThach + linhThachGained;
    await logEconomy({
      charId: char.id,
      type: "linh_thach_gain",
      amount: linhThachGained,
      source: "battle_pass",
      balanceAfter: char.linhThach + linhThachGained,
      meta: { tier: tierNum, season: season.name },
    });
  }

  // Grant item
  if (tierDef.itemId) {
    const tmpl = await db.select().from(itemTemplatesTable)
      .where(eq(itemTemplatesTable.id, tierDef.itemId)).limit(1);
    if (tmpl.length) {
      const existing = await db.select().from(inventoryItemsTable)
        .where(and(
          eq(inventoryItemsTable.charId, char.id),
          eq(inventoryItemsTable.templateId, tierDef.itemId),
        )).limit(1);
      if (existing.length) {
        await db.update(inventoryItemsTable).set({ qty: existing[0].qty + 1 })
          .where(eq(inventoryItemsTable.id, existing[0].id));
      } else {
        await db.insert(inventoryItemsTable).values({ charId: char.id, templateId: tierDef.itemId, qty: 1 });
      }
      itemGranted = tmpl[0].name;
      await logEconomy({
        charId: char.id,
        type: "item_grant",
        amount: 1,
        source: "battle_pass",
        meta: { itemId: tierDef.itemId, itemName: tmpl[0].name, tier: tierNum },
      });
    }
  }

  // Grant title
  if (tierDef.title) {
    updates.title = tierDef.title;
    titleGranted = tierDef.title;
  }

  // Update character (LS + title)
  if (linhThachGained > 0 || titleGranted) {
    await db.update(charactersTable).set(updates as any).where(eq(charactersTable.id, char.id));
  }

  // Mark tier as claimed
  const newClaimedTiers = [...claimedTiers, tierNum];
  if (progress) {
    await db.update(battlePassProgressTable)
      .set({ claimedTiers: newClaimedTiers, updatedAt: now })
      .where(eq(battlePassProgressTable.id, progress.id));
  } else {
    await db.insert(battlePassProgressTable).values({
      charId: char.id,
      seasonId: season.id,
      passXp: currentXp,
      claimedTiers: newClaimedTiers,
    });
  }

  res.json({
    tier: tierNum,
    linhThachGained,
    itemGranted,
    titleGranted,
    claimedTiers: newClaimedTiers,
    message: `Nhận thưởng Battle Pass Tier ${tierNum} thành công!`,
  });
});

export default router;
