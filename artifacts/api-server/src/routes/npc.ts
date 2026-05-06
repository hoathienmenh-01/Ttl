import { Router } from "express";
import { db } from "@workspace/db";
import { npcsTable, missionTemplatesTable, missionProgressTable, charactersTable, characterNpcAffinityTable } from "@workspace/db";
import { eq, inArray, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { getDailyGrindAwareProgress, getDailyGrindAwareStatus } from "../lib/dailyMission";
import { applyNpcTalkAffinity, getNpcAffinityRank, getNpcTalkCooldownState } from "../lib/npcAffinity";

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
  const now = new Date();

  res.json(templates.map(t => {
    const prog = progressMap.get(t.id);
    const status = getDailyGrindAwareStatus(t, prog, now);
    return {
      id: t.id, code: t.code, name: t.name, description: t.description,
      type: t.type, npcName: t.npcName,
      availableStage: t.availableStage,
      status,
      rewardExp: t.rewardExp, rewardLinhThach: t.rewardLinhThach, rewardItems: t.rewardItems,
      progress: getDailyGrindAwareProgress(t, prog, now), progressMax: t.progressMax,
    };
  }).filter(q => q.availableStage === "all" || q.availableStage === stage));
});

router.get("/npc/:npcId/affinity", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const chars = await db.select().from(charactersTable).where(eq(charactersTable.userId, user.id)).limit(1);
  const char = chars[0];
  if (!char) { res.status(404).json({ error: "Chưa tạo nhân vật", code: "NO_CHARACTER" }); return; }

  const npcId = String(req.params.npcId);
  const npcs = await db.select().from(npcsTable).where(eq(npcsTable.id, npcId)).limit(1);
  if (!npcs.length) { res.status(404).json({ error: "NPC không tồn tại", code: "NOT_FOUND" }); return; }

  const rows = await db.select().from(characterNpcAffinityTable)
    .where(and(eq(characterNpcAffinityTable.charId, char.id), eq(characterNpcAffinityTable.npcId, npcId)))
    .limit(1);
  const affinity = rows[0]?.affinity ?? 0;
  const cooldown = getNpcTalkCooldownState(rows[0]?.lastTalkedAt ?? null);

  res.json({
    npcId,
    affinity,
    rank: getNpcAffinityRank(affinity),
    lastTalkedAt: rows[0]?.lastTalkedAt?.toISOString() ?? null,
    canTalk: cooldown.canTalk,
    nextTalkAt: cooldown.nextTalkAt?.toISOString() ?? null,
  });
});

router.post("/npc/:npcId/talk", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const chars = await db.select().from(charactersTable).where(eq(charactersTable.userId, user.id)).limit(1);
  const char = chars[0];
  if (!char) { res.status(404).json({ error: "Chưa tạo nhân vật", code: "NO_CHARACTER" }); return; }

  const npcId = String(req.params.npcId);
  const npcs = await db.select().from(npcsTable).where(eq(npcsTable.id, npcId)).limit(1);
  const npc = npcs[0];
  if (!npc) { res.status(404).json({ error: "NPC không tồn tại", code: "NOT_FOUND" }); return; }

  const now = new Date();
  const rows = await db.select().from(characterNpcAffinityTable)
    .where(and(eq(characterNpcAffinityTable.charId, char.id), eq(characterNpcAffinityTable.npcId, npcId)))
    .limit(1);
  const existing = rows[0];
  const cooldown = getNpcTalkCooldownState(existing?.lastTalkedAt ?? null, now);
  if (!cooldown.canTalk) {
    const affinity = existing?.affinity ?? 0;
    res.status(429).json({
      error: "Hôm nay đã trò chuyện với NPC này rồi.",
      code: "TALK_COOLDOWN",
      npcId,
      affinity,
      rank: getNpcAffinityRank(affinity),
      affinityGained: 0,
      lastTalkedAt: existing?.lastTalkedAt?.toISOString() ?? null,
      canTalk: false,
      nextTalkAt: cooldown.nextTalkAt?.toISOString() ?? null,
    });
    return;
  }
  const newAffinity = applyNpcTalkAffinity(existing?.affinity ?? 0);
  const nextTalkAt = getNpcTalkCooldownState(now, now).nextTalkAt;

  if (existing) {
    await db.update(characterNpcAffinityTable).set({
      affinity: newAffinity,
      lastTalkedAt: now,
      updatedAt: now,
    }).where(eq(characterNpcAffinityTable.id, existing.id));
  } else {
    await db.insert(characterNpcAffinityTable).values({
      charId: char.id,
      npcId,
      affinity: newAffinity,
      lastTalkedAt: now,
    });
  }

  res.json({
    message: `${npc.name} đã chú ý đến ngươi hơn.`,
    npcId,
    affinity: newAffinity,
    rank: getNpcAffinityRank(newAffinity),
    affinityGained: newAffinity - (existing?.affinity ?? 0),
    lastTalkedAt: now.toISOString(),
    canTalk: false,
    nextTalkAt: nextTalkAt?.toISOString() ?? null,
  });
});

export default router;
