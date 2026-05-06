import { Router } from "express";
import { db } from "@workspace/db";
import { missionTemplatesTable, missionProgressTable, charactersTable, inventoryItemsTable, npcsTable, characterNpcAffinityTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { logEconomy } from "../lib/economyLog";
import { grantPassXp } from "../lib/grantPassXp";
import {
  dailyGrindResetPatch,
  getDailyGrindAwareProgress,
  getDailyGrindAwareStatus,
  isStaleDailyGrindClaim,
} from "../lib/dailyMission";
import { getNpcAffinityRankForRequirement, isNpcAffinityRequirementMet } from "../lib/npcAffinity";

const router = Router();

async function getChar(userId: string) {
  const chars = await db.select().from(charactersTable).where(eq(charactersTable.userId, userId)).limit(1);
  return chars[0] ?? null;
}

async function getMissionAffinityState(charId: string, npcName: string | null, affinityRequired: number) {
  if (!npcName || affinityRequired <= 0) {
    return { currentAffinity: 0, affinityLocked: false, requiredRank: getNpcAffinityRankForRequirement(0) };
  }

  const npcs = await db.select().from(npcsTable).where(eq(npcsTable.name, npcName)).limit(1);
  const npc = npcs[0];
  if (!npc) {
    return { currentAffinity: 0, affinityLocked: true, requiredRank: getNpcAffinityRankForRequirement(affinityRequired) };
  }

  const rows = await db.select().from(characterNpcAffinityTable)
    .where(and(eq(characterNpcAffinityTable.charId, charId), eq(characterNpcAffinityTable.npcId, npc.id)))
    .limit(1);
  const currentAffinity = rows[0]?.affinity ?? 0;
  return {
    currentAffinity,
    affinityLocked: !isNpcAffinityRequirementMet(currentAffinity, affinityRequired),
    requiredRank: getNpcAffinityRankForRequirement(affinityRequired),
  };
}

class RouteError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: Record<string, unknown>,
  ) {
    super(String(body.error ?? "Mission error"));
  }
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
  const affinityStates = new Map<string, Awaited<ReturnType<typeof getMissionAffinityState>>>();
  for (const t of templates) {
    affinityStates.set(t.id, await getMissionAffinityState(char.id, t.npcName ?? null, t.affinityRequired ?? 0));
  }

  res.json(templates.map(t => {
    const prog = progressMap.get(t.id);
    const affinityState = affinityStates.get(t.id)!;
    const status = affinityState.affinityLocked ? "locked" : getDailyGrindAwareStatus(t, prog, now);

    return {
      id: t.id, code: t.code, name: t.name, description: t.description,
      type: t.type, npcName: t.npcName ?? null, realmRequired: t.realmRequired ?? null,
      objectiveType: t.objectiveType ?? null,
      status,
      affinityRequired: t.affinityRequired ?? 0,
      affinityLocked: affinityState.affinityLocked,
      currentAffinity: affinityState.currentAffinity,
      requiredRank: affinityState.requiredRank,
      rewardExp: t.rewardExp, rewardLinhThach: t.rewardLinhThach, rewardItems: t.rewardItems,
      progress: affinityState.affinityLocked ? 0 : getDailyGrindAwareProgress(t, prog, now), progressMax: t.progressMax,
      claimedAt: status === "available" ? null : (prog?.claimedAt?.toISOString() ?? null),
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
  const affinityState = await getMissionAffinityState(char.id, templates[0].npcName ?? null, templates[0].affinityRequired ?? 0);
  if (affinityState.affinityLocked) {
    res.status(403).json({
      error: "Thân thiết với NPC chưa đủ để nhận nhiệm vụ này.",
      code: "AFFINITY_REQUIRED",
      affinityRequired: templates[0].affinityRequired ?? 0,
      currentAffinity: affinityState.currentAffinity,
      requiredRank: affinityState.requiredRank,
    });
    return;
  }

  const existing = await db.select().from(missionProgressTable)
    .where(and(
      eq(missionProgressTable.charId, char.id),
      eq(missionProgressTable.templateId, acceptMissionId),
    )).limit(1);

  if (existing.length) {
    const existingProgress = existing[0];
    if (isStaleDailyGrindClaim(templates[0], existingProgress)) {
      await db.update(missionProgressTable).set(dailyGrindResetPatch())
        .where(eq(missionProgressTable.id, existingProgress.id));
      res.json({ message: `Đã nhận lại nhiệm vụ ${templates[0].name} cho hôm nay.` });
      return;
    }

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
  const affinityState = await getMissionAffinityState(char.id, t.npcName ?? null, t.affinityRequired ?? 0);
  if (affinityState.affinityLocked) {
    res.status(403).json({
      error: "Thân thiết với NPC chưa đủ để hoàn thành nhiệm vụ này.",
      code: "AFFINITY_REQUIRED",
      affinityRequired: t.affinityRequired ?? 0,
      currentAffinity: affinityState.currentAffinity,
      requiredRank: affinityState.requiredRank,
    });
    return;
  }

  try {
    const result = await db.transaction(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${char.id}), hashtext(${missionId}))`);

      const freshChars = await tx.select().from(charactersTable)
        .where(eq(charactersTable.id, char.id)).limit(1);
      const freshChar = freshChars[0];
      if (!freshChar) {
        throw new RouteError(404, { error: "Chưa tạo nhân vật", code: "NO_CHARACTER" });
      }

      const progresses = await tx.select().from(missionProgressTable)
        .where(and(
          eq(missionProgressTable.charId, char.id),
          eq(missionProgressTable.templateId, missionId),
        )).limit(1);

      const prog = progresses[0];
      const now = new Date();

      if (prog?.status === "claimed") {
        if (isStaleDailyGrindClaim(t, prog, now)) {
          // Daily reset — allow today's completion checks below to decide.
        } else {
          throw new RouteError(400, { error: "Nhiệm vụ đã nhận thưởng", code: "ALREADY_CLAIMED" });
        }
      }

      if (t.objectiveType) {
        if (!prog) {
          throw new RouteError(400, {
            error: `Hãy thực hiện hoạt động yêu cầu trước: ${t.description}`,
            code: "PROGRESS_INSUFFICIENT",
          });
        }
        const isGrindReset = isStaleDailyGrindClaim(t, prog, now);
        if (!isGrindReset && prog.status !== "completed") {
          const remaining = t.progressMax - (prog.progress ?? 0);
          throw new RouteError(400, {
            error: `Tiến độ chưa đủ. Còn ${remaining}/${t.progressMax} để hoàn thành.`,
            code: "PROGRESS_INSUFFICIENT",
            current: prog.progress ?? 0,
            required: t.progressMax,
          });
        }
        if (isGrindReset && prog.status !== "completed") {
          throw new RouteError(400, {
            error: "Hãy thực hiện hoạt động hôm nay trước khi nhận thưởng.",
            code: "PROGRESS_INSUFFICIENT",
          });
        }
      }

      if (!prog) {
        await tx.insert(missionProgressTable).values({
          charId: char.id, templateId: missionId,
          status: "claimed", progress: t.progressMax,
          acceptedAt: now, completedAt: now, claimedAt: now,
        });
      } else {
        await tx.update(missionProgressTable).set({
          status: "claimed", progress: t.progressMax,
          completedAt: now, claimedAt: now,
        }).where(eq(missionProgressTable.id, prog.id));
      }

      const newExp = freshChar.exp + t.rewardExp;
      const newLinhThach = freshChar.linhThach + t.rewardLinhThach;
      await tx.update(charactersTable).set({
        exp: newExp,
        linhThach: newLinhThach,
        updatedAt: now,
      }).where(eq(charactersTable.id, char.id));

      const rewardItemsList = (t.rewardItems as string[]) ?? [];
      const grantedItems: string[] = [];
      for (const templateId of rewardItemsList) {
        if (!templateId) continue;
        const existing = await tx.select().from(inventoryItemsTable)
          .where(and(eq(inventoryItemsTable.charId, char.id), eq(inventoryItemsTable.templateId, templateId)))
          .limit(1);
        if (existing.length) {
          await tx.update(inventoryItemsTable).set({ qty: existing[0].qty + 1 })
            .where(eq(inventoryItemsTable.id, existing[0].id));
        } else {
          await tx.insert(inventoryItemsTable).values({ charId: char.id, templateId, qty: 1 });
        }
        grantedItems.push(templateId);
      }

      return {
        expGained: t.rewardExp,
        linhThachGained: t.rewardLinhThach,
        itemsGranted: grantedItems,
        expBalanceAfter: newExp,
        linhThachBalanceAfter: newLinhThach,
      };
    });

    await Promise.allSettled([
      t.rewardExp > 0 ? logEconomy({ charId: char.id, type: "exp_gain", amount: t.rewardExp, source: `mission:${t.code}`, balanceAfter: result.expBalanceAfter, meta: { missionName: t.name } }) : Promise.resolve(),
      t.rewardLinhThach > 0 ? logEconomy({ charId: char.id, type: "linh_thach_gain", amount: t.rewardLinhThach, source: `mission:${t.code}`, balanceAfter: result.linhThachBalanceAfter, meta: { missionName: t.name } }) : Promise.resolve(),
      grantPassXp(char.id, 30),
    ]);

    res.json({
      expGained: result.expGained,
      linhThachGained: result.linhThachGained,
      itemsGranted: result.itemsGranted,
      isDaily: t.type === "grind",
      message: `Hoàn thành ${t.name}! Nhận ${t.rewardExp} EXP và ${t.rewardLinhThach} Linh Thạch.`,
    });
  } catch (error) {
    if (error instanceof RouteError) {
      res.status(error.status).json(error.body);
      return;
    }
    throw error;
  }
});

export default router;
