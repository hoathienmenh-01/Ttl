import { Router } from "express";
import { db } from "@workspace/db";
import { npcsTable, missionTemplatesTable, missionProgressTable, charactersTable } from "@workspace/db";
import { eq, inArray, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router = Router();

router.get("/npc", async (req, res) => {
  const npcs = await db.select().from(npcsTable);
  res.json(npcs);
});

router.get("/npc/:npcId", async (req, res) => {
  const npcs = await db.select().from(npcsTable).where(eq(npcsTable.id, String(req.params.npcId))).limit(1);
  if (!npcs.length) { res.status(404).json({ error: "NPC không tồn tại" }); return; }
  const npc = npcs[0];

  const questIds = (npc.questIds as string[]) ?? [];
  const quests = questIds.length
    ? await db.select().from(missionTemplatesTable).where(inArray(missionTemplatesTable.id, questIds))
    : [];

  res.json({ ...npc, quests });
});

router.get("/npc/:npcId/quests", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const chars = await db.select().from(charactersTable).where(eq(charactersTable.userId, user.id)).limit(1);
  const char = chars[0];
  if (!char) { res.status(404).json({ error: "Chưa tạo nhân vật" }); return; }

  const npcs = await db.select().from(npcsTable).where(eq(npcsTable.id, String(req.params.npcId))).limit(1);
  if (!npcs.length) { res.status(404).json({ error: "NPC không tồn tại" }); return; }
  const npc = npcs[0];
  const stage = char.realmKey.startsWith("phamnhan") ? "early" : char.realmKey.startsWith("luyen_khi") ? "early" : char.realmKey.startsWith("truc_co") ? "mid" : "late";

  const questIds = (npc.questIds as string[]) ?? [];
  if (!questIds.length) { res.json([]); return; }

  const templates = await db.select().from(missionTemplatesTable).where(inArray(missionTemplatesTable.id, questIds));
  const progresses = await db.select().from(missionProgressTable).where(eq(missionProgressTable.charId, char.id));
  const progressMap = new Map(progresses.map(p => [p.templateId, p]));

  res.json(templates.map(t => {
    const prog = progressMap.get(t.id);
    const claimedToday = t.type === "grind" && prog?.claimedAt && (new Date(prog.claimedAt).toDateString() === new Date().toDateString());
    const status = t.type === "grind" && prog?.status === "claimed" && !claimedToday ? "available" : (prog?.status ?? "available");
    return {
      id: t.id, code: t.code, name: t.name, description: t.description,
      type: t.type, npcName: t.npcName,
      availableStage: t.availableStage,
      status,
      rewardExp: t.rewardExp, rewardLinhThach: t.rewardLinhThach, rewardItems: t.rewardItems,
      progress: prog?.progress ?? 0, progressMax: t.progressMax,
    };
  }).filter(q => q.availableStage === "all" || q.availableStage === stage));
});

export default router;
