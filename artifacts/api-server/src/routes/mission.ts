import { Router } from "express";
import { db } from "@workspace/db";
import { missionTemplatesTable, missionProgressTable, charactersTable, inventoryItemsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { isSameDay } from "../lib/balance";
import { logEconomy } from "../lib/economyLog";
import { grantPassXp } from "../lib/grantPassXp";

const router = Router();

async function getChar(userId: string) {
  const chars = await db.select().from(charactersTable).where(eq(charactersTable.userId, userId)).limit(1);
  return chars[0] ?? null;
}

router.get("/mission", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const char = await getChar(user.id);
  if (!char) { res.status(404).json({ error: "Chưa tạo nhân vật", code: "NO_CHARACTER" }); return; }

  const templates = await db.select().from(missionTemplatesTable);
  const progresses = await db.select().from(missionProgressTable)
    .where(eq(missionProgressTable.charId, char.id));

  const progressMap = new Map(progresses.map(p => [p.templateId, p]));
  const now = new Date();

  res.json(templates.map(t => {
    const prog = progressMap.get(t.id);
    let status = prog?.status ?? "available";

    if (t.type === "grind" && status === "claimed" && prog?.claimedAt) {
      if (!isSameDay(prog.claimedAt, now)) {
        status = "available";
      }
    }

    return {
      id: t.id, code: t.code, name: t.name, description: t.description,
      type: t.type, npcName: t.npcName ?? null, realmRequired: t.realmRequired ?? null,
      objectiveType: t.objectiveType ?? null,
      status,
      rewardExp: t.rewardExp, rewardLinhThach: t.rewardLinhThach, rewardItems: t.rewardItems,
      progress: prog?.progress ?? 0, progressMax: t.progressMax,
      claimedAt: prog?.claimedAt?.toISOString() ?? null,
    };
  }));
});

router.post("/mission/:missionId/accept", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const char = await getChar(user.id);
  if (!char) { res.status(404).json({ error: "Chưa tạo nhân vật", code: "NO_CHARACTER" }); return; }

  const acceptMissionId = String(req.params.missionId);
  const templates = await db.select().from(missionTemplatesTable)
    .where(eq(missionTemplatesTable.id, acceptMissionId)).limit(1);
  if (!templates.length) { res.status(404).json({ error: "Nhiệm vụ không tồn tại", code: "NOT_FOUND" }); return; }

  const existing = await db.select().from(missionProgressTable)
    .where(and(
      eq(missionProgressTable.charId, char.id),
      eq(missionProgressTable.templateId, acceptMissionId),
    )).limit(1);

  if (existing.length) {
    res.json({ message: "Đã nhận nhiệm vụ này rồi." });
    return;
  }

  await db.insert(missionProgressTable).values({
    charId: char.id, templateId: acceptMissionId,
    status: "accepted", progress: 0, acceptedAt: new Date(),
  });

  res.json({ message: `Đã nhận nhiệm vụ ${templates[0].name}.` });
});

router.post("/mission/:missionId/complete", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const char = await getChar(user.id);
  if (!char) { res.status(404).json({ error: "Chưa tạo nhân vật", code: "NO_CHARACTER" }); return; }

  const missionId = String(req.params.missionId);
  const templates = await db.select().from(missionTemplatesTable)
    .where(eq(missionTemplatesTable.id, missionId)).limit(1);
  if (!templates.length) { res.status(404).json({ error: "Nhiệm vụ không tồn tại", code: "NOT_FOUND" }); return; }

  const t = templates[0];
  const progresses = await db.select().from(missionProgressTable)
    .where(and(
      eq(missionProgressTable.charId, char.id),
      eq(missionProgressTable.templateId, missionId),
    )).limit(1);

  const prog = progresses[0];
  const now  = new Date();

  if (prog?.status === "claimed") {
    if (t.type === "grind" && prog.claimedAt && !isSameDay(prog.claimedAt, now)) {
      // Daily reset — fall through
    } else {
      res.status(400).json({ error: "Nhiệm vụ đã nhận thưởng", code: "ALREADY_CLAIMED" });
      return;
    }
  }

  if (t.objectiveType) {
    if (!prog) {
      res.status(400).json({
        error: `Hãy thực hiện hoạt động yêu cầu trước: ${t.description}`,
        code: "PROGRESS_INSUFFICIENT",
      });
      return;
    }
    const isGrindReset = t.type === "grind" && prog.status === "claimed" && prog.claimedAt && !isSameDay(prog.claimedAt, now);
    if (!isGrindReset && prog.status !== "completed") {
      const remaining = t.progressMax - (prog.progress ?? 0);
      res.status(400).json({
        error: `Tiến độ chưa đủ. Còn ${remaining}/${t.progressMax} để hoàn thành.`,
        code: "PROGRESS_INSUFFICIENT",
        current: prog.progress ?? 0,
        required: t.progressMax,
      });
      return;
    }
    if (isGrindReset && prog.status !== "completed") {
      res.status(400).json({
        error: "Hãy thực hiện hoạt động hôm nay trước khi nhận thưởng.",
        code: "PROGRESS_INSUFFICIENT",
      });
      return;
    }
  }

  if (!prog) {
    await db.insert(missionProgressTable).values({
      charId: char.id, templateId: missionId,
      status: "claimed", progress: t.progressMax,
      acceptedAt: now, completedAt: now, claimedAt: now,
    });
  } else {
    await db.update(missionProgressTable).set({
      status: "claimed", progress: t.progressMax,
      completedAt: now, claimedAt: now,
    }).where(eq(missionProgressTable.id, prog.id));
  }

  const newLinhThach = char.linhThach + t.rewardLinhThach;
  await db.update(charactersTable).set({
    exp:       char.exp + t.rewardExp,
    linhThach: newLinhThach,
    updatedAt: now,
  }).where(eq(charactersTable.id, char.id));

  // Grant reward items
  const rewardItemsList = (t.rewardItems as string[]) ?? [];
  const grantedItems: string[] = [];
  for (const templateId of rewardItemsList) {
    if (!templateId) continue;
    const existing = await db.select().from(inventoryItemsTable)
      .where(and(eq(inventoryItemsTable.charId, char.id), eq(inventoryItemsTable.templateId, templateId)))
      .limit(1);
    if (existing.length) {
      await db.update(inventoryItemsTable).set({ qty: existing[0].qty + 1 })
        .where(eq(inventoryItemsTable.id, existing[0].id));
    } else {
      await db.insert(inventoryItemsTable).values({ charId: char.id, templateId, qty: 1 });
    }
    grantedItems.push(templateId);
  }

  await Promise.allSettled([
    t.rewardExp > 0 ? logEconomy({ charId: char.id, type: "exp_gain", amount: t.rewardExp, source: `mission:${t.code}`, balanceAfter: char.exp + t.rewardExp, meta: { missionName: t.name } }) : Promise.resolve(),
    t.rewardLinhThach > 0 ? logEconomy({ charId: char.id, type: "linh_thach_gain", amount: t.rewardLinhThach, source: `mission:${t.code}`, balanceAfter: char.linhThach + t.rewardLinhThach, meta: { missionName: t.name } }) : Promise.resolve(),
    grantPassXp(char.id, 30),
  ]);

  res.json({
    expGained: t.rewardExp,
    linhThachGained: t.rewardLinhThach,
    itemsGranted: grantedItems,
    isDaily: t.type === "grind",
    message: `Hoàn thành ${t.name}! Nhận ${t.rewardExp} EXP và ${t.rewardLinhThach} Linh Thạch.`,
  });
});

export default router;
