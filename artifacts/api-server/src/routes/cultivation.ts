import { Router } from "express";
import { db } from "@workspace/db";
import { charactersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { getRealmByKey, getRealmName, getNextRealm, REALMS, computePower } from "../lib/realms";
import {
  ROOT_EXP_MULTIPLIER, CULTIVATION_TICK_SECONDS,
  breakthroughLSCost, MIN_LINH_THACH,
} from "../lib/balance";
import { checkAndAwardAchievements } from "../lib/achievements";
import { trackMissionProgress } from "../lib/missionProgress";

const router = Router();

async function getChar(userId: string) {
  const chars = await db.select().from(charactersTable).where(eq(charactersTable.userId, userId)).limit(1);
  return chars[0] ?? null;
}

function rootMultiplier(grade: string | null): number {
  return ROOT_EXP_MULTIPLIER[grade ?? "common"] ?? 1.0;
}

router.post("/cultivation/start", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const char = await getChar(user.id);
  if (!char) { res.status(404).json({ error: "Chưa tạo nhân vật", code: "NO_CHARACTER" }); return; }
  if (char.cultivating) {
    const realm = getRealmByKey(char.realmKey);
    const mult = rootMultiplier(char.spiritualRootGrade);
    const expPerTick = Math.round((realm?.baseExpPerTick ?? 8) * mult);
    res.json({ cultivating: true, expPerTick, message: "Đang nhập định tu luyện." });
    return;
  }
  await db.update(charactersTable).set({
    cultivating: true, lastCultivationTick: new Date(), updatedAt: new Date(),
  }).where(eq(charactersTable.id, char.id));
  const realm = getRealmByKey(char.realmKey);
  const mult = rootMultiplier(char.spiritualRootGrade);
  const expPerTick = Math.round((realm?.baseExpPerTick ?? 8) * mult);
  res.json({ cultivating: true, expPerTick, message: "Bắt đầu nhập định tu luyện, linh khí dồi dào." });
});

router.post("/cultivation/stop", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const char = await getChar(user.id);
  if (!char) { res.status(404).json({ error: "Chưa tạo nhân vật", code: "NO_CHARACTER" }); return; }
  if (char.cultivating && char.lastCultivationTick) {
    const elapsed = (Date.now() - char.lastCultivationTick.getTime()) / 1000;
    const ticks = Math.floor(elapsed / CULTIVATION_TICK_SECONDS);
    const realm = getRealmByKey(char.realmKey);
    const mult = rootMultiplier(char.spiritualRootGrade);
    const expGain = Math.round(ticks * (realm?.baseExpPerTick ?? 8) * mult);
    await db.update(charactersTable).set({
      cultivating: false, exp: char.exp + expGain,
      lastCultivationTick: null, updatedAt: new Date(),
    }).where(eq(charactersTable.id, char.id));
    const completedMissions = expGain > 0 ? await trackMissionProgress(char.id, "cultivate") : [];
    res.json({ cultivating: false, expPerTick: 0, expGained: expGain, completedMissions, message: `Xuất định. Nhận ${expGain} EXP tu luyện.` });
  } else {
    await db.update(charactersTable).set({ cultivating: false, updatedAt: new Date() }).where(eq(charactersTable.id, char.id));
    res.json({ cultivating: false, expPerTick: 0, expGained: 0, message: "Xuất định, ngưng tu luyện." });
  }
});

router.post("/cultivation/breakthrough", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const char = await getChar(user.id);
  if (!char) { res.status(404).json({ error: "Chưa tạo nhân vật", code: "NO_CHARACTER" }); return; }
  const realm = getRealmByKey(char.realmKey);
  if (!realm) { res.status(400).json({ error: "Cảnh giới không hợp lệ", code: "INVALID_REALM" }); return; }

  if (char.exp < realm.expCost) {
    res.status(400).json({
      error: `Tu vi chưa đủ. Cần ${realm.expCost} EXP để đột phá.`,
      code: "INSUFFICIENT_EXP",
    });
    return;
  }

  const lsCost = breakthroughLSCost(char.realmKey);
  if (char.linhThach < lsCost) {
    res.status(400).json({
      error: `Linh Thạch không đủ. Cần ${lsCost} Linh Thạch để đột phá.`,
      code: "INSUFFICIENT_LINH_THACH",
      required: lsCost,
      current: char.linhThach,
    });
    return;
  }

  const next = getNextRealm(char.realmKey, char.realmStage);
  if (!next) {
    res.json({ success: false, message: "Đã đạt đỉnh cao tuyệt đối. Không thể đột phá thêm." });
    return;
  }

  const newHpMax = char.hpMax + 50;
  const newAtk   = char.atk + 10;
  const newDef   = char.def + 5;
  const newPower = computePower({ ...char, realmKey: next.key, realmStage: next.stage, hpMax: newHpMax, atk: newAtk, def: newDef });

  await db.update(charactersTable).set({
    realmKey: next.key, realmStage: next.stage, exp: 0,
    hpMax: newHpMax, hp: newHpMax,
    atk: newAtk, def: newDef, power: newPower,
    level: char.level + 1,
    linhThach: Math.max(MIN_LINH_THACH, char.linhThach - lsCost),
    updatedAt: new Date(),
  }).where(eq(charactersTable.id, char.id));

  const newName = getRealmName(next.key, next.stage);
  const [newlyEarned, completedMissions] = await Promise.all([
    checkAndAwardAchievements(char.id),
    trackMissionProgress(char.id, "breakthrough"),
  ]);
  res.json({
    success: true,
    message: `Đột phá thành công! Đã tiến vào ${newName}!${lsCost > 0 ? ` Tiêu hao ${lsCost} Linh Thạch.` : ""}`,
    newRealmKey: next.key,
    newRealmName: newName,
    newRealmStage: next.stage,
    linhThachCost: lsCost,
    newlyEarned,
    completedMissions,
  });
});

router.get("/cultivation/realms", (req, res) => {
  res.json(REALMS.map(r => ({
    key: r.key, name: r.name, tier: r.tier, order: r.order,
    stages: r.stages, expCost: r.expCost, description: r.description,
    lsBreakthroughCost: breakthroughLSCost(r.key),
  })));
});

export async function applyCultivationTick(charId: string) {
  const chars = await db.select().from(charactersTable).where(eq(charactersTable.id, charId)).limit(1);
  const char = chars[0];
  if (!char || !char.cultivating || !char.lastCultivationTick) return;
  const elapsed = (Date.now() - char.lastCultivationTick.getTime()) / 1000;
  const ticks = Math.floor(elapsed / CULTIVATION_TICK_SECONDS);
  if (ticks < 1) return;
  const realm = getRealmByKey(char.realmKey);
  const mult = rootMultiplier(char.spiritualRootGrade);
  const expGain = Math.round(ticks * (realm?.baseExpPerTick ?? 8) * mult);
  await db.update(charactersTable).set({
    exp: char.exp + expGain,
    lastCultivationTick: new Date(),
    updatedAt: new Date(),
  }).where(eq(charactersTable.id, charId));
}

export default router;
