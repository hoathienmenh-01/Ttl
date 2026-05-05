import { Router } from "express";
import { db } from "@workspace/db";
import {
  achievementTemplatesTable, characterAchievementsTable,
  charactersTable,
} from "@workspace/db";
import { eq, and, isNull } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { checkAndAwardAchievements } from "../lib/achievements";

const router = Router();

async function getChar(userId: string) {
  const rows = await db.select().from(charactersTable).where(eq(charactersTable.userId, userId)).limit(1);
  return rows[0] ?? null;
}

router.get("/achievement", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const char = await getChar(user.id);
  if (!char) { res.status(404).json({ error: "Chưa tạo nhân vật", code: "NO_CHARACTER" }); return; }

  // Auto-check achievements on every list call
  const newlyEarned = await checkAndAwardAchievements(char.id);

  const [templates, earned] = await Promise.all([
    db.select().from(achievementTemplatesTable),
    db.select().from(characterAchievementsTable).where(eq(characterAchievementsTable.charId, char.id)),
  ]);

  const earnedMap = new Map(earned.map(e => [e.achievementId, e]));

  res.json({
    achievements: templates
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(t => {
        const e = earnedMap.get(t.id);
        return {
          id: t.id, name: t.name, description: t.description,
          category: t.category, icon: t.icon,
          rewardLinhThach: t.rewardLinhThach,
          rewardTitle: t.rewardTitle ?? null,
          isHidden: t.isHidden,
          status: e ? (e.claimedAt ? "claimed" : "earned") : "locked",
          earnedAt: e?.earnedAt?.toISOString() ?? null,
          claimedAt: e?.claimedAt?.toISOString() ?? null,
        };
      }),
    newlyEarned,
  });
});

router.post("/achievement/:achievementId/claim", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const char = await getChar(user.id);
  if (!char) { res.status(404).json({ error: "Chưa tạo nhân vật", code: "NO_CHARACTER" }); return; }

  const templates = await db.select().from(achievementTemplatesTable)
    .where(eq(achievementTemplatesTable.id, String(req.params.achievementId))).limit(1);
  if (!templates.length) { res.status(404).json({ error: "Thành tựu không tồn tại", code: "NOT_FOUND" }); return; }
  const t = templates[0];

  const records = await db.select().from(characterAchievementsTable)
    .where(and(
      eq(characterAchievementsTable.charId, char.id),
      eq(characterAchievementsTable.achievementId, t.id),
    )).limit(1);

  if (!records.length) {
    res.status(400).json({ error: "Thành tựu chưa đạt được", code: "NOT_EARNED" });
    return;
  }
  if (records[0].claimedAt) {
    res.status(400).json({ error: "Thành tựu đã nhận thưởng", code: "ALREADY_CLAIMED" });
    return;
  }

  const now = new Date();
  await db.update(characterAchievementsTable).set({ claimedAt: now })
    .where(eq(characterAchievementsTable.id, records[0].id));

  const updates: Record<string, any> = {
    linhThach: char.linhThach + t.rewardLinhThach,
    updatedAt: now,
  };
  if (t.rewardTitle) updates.title = t.rewardTitle;

  await db.update(charactersTable).set(updates).where(eq(charactersTable.id, char.id));

  res.json({
    message: `Nhận thưởng thành tựu "${t.name}" thành công!`,
    linhThachGained: t.rewardLinhThach,
    titleGranted: t.rewardTitle ?? null,
  });
});

export default router;
