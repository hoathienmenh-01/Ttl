import { Router } from "express";
import { db } from "@workspace/db";
import { charactersTable, sectsTable, inventoryItemsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { z } from "zod";
import { getRealmByKey, getRealmName, computePower, REALMS } from "../lib/realms";
import {
  REST_HP_PERCENT, REST_STAMINA_RESTORE, REST_COOLDOWN_SECONDS,
  STAMINA_REGEN_AMOUNT, STAMINA_REGEN_INTERVAL_MIN, ROOT_SKILL_AFFINITY,
} from "../lib/balance";
import { logEconomy } from "../lib/economyLog";
import { grantBattlePassXp } from "../lib/battlePassXp";
import { grantPassXp } from "../lib/grantPassXp";
import { getDailyResetStart, getNextDailyResetAt, getPreviousDailyResetStart } from "../lib/dailyReset";

const router = Router();

const ELEMENTS = ["kim", "moc", "thuy", "hoa", "tho", "loi", "phong", "bang", "doc", "am", "duong"];
const ROOT_GRADES = ["common", "good", "rare", "epic"];
const GRADE_WEIGHTS = [65, 25, 8, 2];

// 7-day login streak rewards
const STREAK_REWARDS = [
  { day: 1, linhThach: 50, itemId: null, itemName: null },
  { day: 2, linhThach: 100, itemId: "hoi_khi_dan", itemName: "Hồi Khí Đan" },
  { day: 3, linhThach: 150, itemId: null, itemName: null },
  { day: 4, linhThach: 200, itemId: null, itemName: null },
  { day: 5, linhThach: 300, itemId: "khai_tam_dan", itemName: "Khai Tâm Đan" },
  { day: 6, linhThach: 400, itemId: null, itemName: null },
  { day: 7, linhThach: 800, itemId: "truc_co_dan", itemName: "Trúc Cơ Đan" },
];

function rollSpiritualRoot() {
  const rnd = Math.random() * 100;
  let cumulative = 0;
  for (let i = 0; i < ROOT_GRADES.length; i++) {
    cumulative += GRADE_WEIGHTS[i];
    if (rnd < cumulative) {
      const grade = ROOT_GRADES[i];
      const element = ELEMENTS[Math.floor(Math.random() * ELEMENTS.length)];
      return { grade, element };
    }
  }
  return { grade: "common", element: "kim" };
}

function computeSkillAffinity(grade: string) {
  return ROOT_SKILL_AFFINITY[grade] ?? 0;
}

function formatCharacter(char: any, sectName?: string | null) {
  const realmName = getRealmName(char.realmKey, char.realmStage);
  const realm = getRealmByKey(char.realmKey);
  return {
    id: char.id, name: char.name, realmKey: char.realmKey, realmName,
    realmStage: char.realmStage, title: char.title ?? null,
    exp: char.exp, expRequired: realm?.expCost ?? 500,
    level: char.level, hp: char.hp, hpMax: char.hpMax,
    mp: char.mp, mpMax: char.mpMax, stamina: char.stamina, staminaMax: char.staminaMax,
    power: char.power, spirit: char.spirit, speed: char.speed,
    luck: char.luck, daoVan: char.daoVan, atk: char.atk, def: char.def, crit: char.crit,
    linhThach: char.linhThach, tienNgoc: char.tienNgoc, congHien: char.congHien,
    primaryElement: char.primaryElement ?? null,
    spiritualRootGrade: char.spiritualRootGrade ?? null,
    skillAffinity: computeSkillAffinity(char.spiritualRootGrade ?? "common"),
    cultivating: char.cultivating,
    sectId: char.sectId ?? null, sectName: sectName ?? null,
    pvpWins: char.pvpWins, pvpLosses: char.pvpLosses,
    lastRestAt: char.lastRestAt ? char.lastRestAt.toISOString() : null,
    lastDailyClaimAt: char.lastDailyClaimAt ? char.lastDailyClaimAt.toISOString() : null,
    loginStreak: char.loginStreak ?? 0,
    dungeonClears: char.dungeonClears,
    bossKills: char.bossKills,
    alchemyCrafts: char.alchemyCrafts,
    createdAt: char.createdAt.toISOString(),
  };
}

function computePassiveRegen(char: any): { ticks: number; newStaminaRegenAt: Date } {
  const intervalMs = STAMINA_REGEN_INTERVAL_MIN * 60 * 1000;
  const ref: Date = char.lastStaminaRegenAt ?? char.createdAt;
  const elapsed = Date.now() - ref.getTime();
  const ticks = Math.floor(elapsed / intervalMs);
  const newStaminaRegenAt = ticks > 0 ? new Date(ref.getTime() + ticks * intervalMs) : ref;
  return { ticks, newStaminaRegenAt };
}

router.get("/character", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const chars = await db.select().from(charactersTable).where(eq(charactersTable.userId, user.id)).limit(1);
  if (!chars.length) {
    res.status(404).json({ error: "Chưa tạo nhân vật", code: "NO_CHARACTER" });
    return;
  }
  let char = chars[0];

  if (char.stamina < char.staminaMax) {
    const { ticks, newStaminaRegenAt } = computePassiveRegen(char);
    if (ticks > 0) {
      const regenAmount = Math.min(ticks * STAMINA_REGEN_AMOUNT, char.staminaMax - char.stamina);
      const newStamina = Math.min(char.staminaMax, char.stamina + regenAmount);
      await db.update(charactersTable).set({
        stamina: newStamina,
        lastStaminaRegenAt: newStaminaRegenAt,
        updatedAt: new Date(),
      }).where(eq(charactersTable.id, char.id));
      char = { ...char, stamina: newStamina, lastStaminaRegenAt: newStaminaRegenAt };
    }
  }

  let sectName: string | null = null;
  if (char.sectId) {
    const sects = await db.select().from(sectsTable).where(eq(sectsTable.id, char.sectId)).limit(1);
    sectName = sects[0]?.name ?? null;
  }
  res.json(formatCharacter(char, sectName));
});

router.post("/character", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const schema = z.object({ name: z.string().min(2).max(20) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Tên không hợp lệ", code: "INVALID_NAME" });
    return;
  }
  const existing = await db.select().from(charactersTable).where(eq(charactersTable.userId, user.id)).limit(1);
  if (existing.length) {
    res.status(400).json({ error: "Đã có nhân vật", code: "CHARACTER_EXISTS" });
    return;
  }
  const existingName = await db.select().from(charactersTable).where(eq(charactersTable.name, parsed.data.name)).limit(1);
  if (existingName.length) {
    res.status(400).json({ error: "Đạo hiệu đã có người sử dụng", code: "NAME_TAKEN" });
    return;
  }
  const { grade, element } = rollSpiritualRoot();
  const [char] = await db.insert(charactersTable).values({
    userId: user.id, name: parsed.data.name,
    spiritualRootGrade: grade, primaryElement: element,
    lastStaminaRegenAt: new Date(),
  }).returning();
  res.status(201).json(formatCharacter(char));
});

router.get("/character/stats", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const chars = await db.select().from(charactersTable).where(eq(charactersTable.userId, user.id)).limit(1);
  if (!chars.length) {
    res.status(404).json({ error: "Chưa tạo nhân vật", code: "NO_CHARACTER" });
    return;
  }
  const char = chars[0];
  const realm = getRealmByKey(char.realmKey);
  res.json({
    totalPower: computePower(char),
    atk: char.atk, magicAtk: char.spirit * 2,
    def: char.def, crit: char.crit, critDmg: 1.5,
    pierce: 0.05, speed: char.speed,
    hpMax: char.hpMax, mpMax: char.mpMax,
    elementalResist: 0.1, realmMultiplier: realm?.realmMultiplier ?? 1.0,
  });
});

router.get("/character/online", async (req, res) => {
  const chars = await db.select().from(charactersTable).limit(50);
  res.json(chars.map(c => ({
    id: c.id, name: c.name,
    realmName: getRealmName(c.realmKey, c.realmStage),
    realmStage: c.realmStage,
    power: computePower(c),
    primaryElement: c.primaryElement ?? null,
    cultivating: c.cultivating,
    sectName: null,
  })));
});

router.post("/character/rest", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const chars = await db.select().from(charactersTable).where(eq(charactersTable.userId, user.id)).limit(1);
  if (!chars.length) { res.status(404).json({ error: "Chưa tạo nhân vật", code: "NO_CHARACTER" }); return; }
  const char = chars[0];

  if (char.lastRestAt) {
    const elapsedSec = (Date.now() - char.lastRestAt.getTime()) / 1000;
    if (elapsedSec < REST_COOLDOWN_SECONDS) {
      const remaining = Math.ceil(REST_COOLDOWN_SECONDS - elapsedSec);
      res.status(429).json({
        error: `Cần nghỉ thêm ${remaining} giây nữa mới có thể tu dưỡng tiếp.`,
        code: "REST_COOLDOWN",
        cooldownSecondsRemaining: remaining,
      });
      return;
    }
  }

  const newHp      = Math.min(char.hpMax, char.hp + Math.floor(char.hpMax * REST_HP_PERCENT));
  const newStamina = Math.min(char.staminaMax, char.stamina + REST_STAMINA_RESTORE);

  if (newHp === char.hp && newStamina === char.stamina) {
    res.json({ message: "Ngươi đang trong trạng thái sung mãn, không cần nghỉ ngơi.", hpRestored: 0, staminaRestored: 0 });
    return;
  }

  const now = new Date();
  await db.update(charactersTable).set({
    hp: newHp, stamina: newStamina,
    lastRestAt: now,
    lastStaminaRegenAt: now,
    updatedAt: now,
  }).where(eq(charactersTable.id, char.id));

  res.json({
    message: `Nghỉ ngơi hoàn tất. Hồi phục ${newHp - char.hp} HP và ${newStamina - char.stamina} thể lực.`,
    hpRestored:      newHp - char.hp,
    staminaRestored: newStamina - char.stamina,
    hp:    newHp,
    stamina: newStamina,
    cooldownSecondsRemaining: REST_COOLDOWN_SECONDS,
  });
});

router.get("/character/inspect/:characterId", requireAuth, async (req, res) => {
  const chars = await db.select().from(charactersTable).where(eq(charactersTable.id, req.params.characterId as string)).limit(1);
  if (!chars.length) {
    res.status(404).json({ error: "Không tìm thấy nhân vật", code: "NOT_FOUND" });
    return;
  }
  res.json(formatCharacter(chars[0]));
});

// Expose streak reward table to frontend
router.get("/character/streak-rewards", async (_req, res) => {
  res.json(STREAK_REWARDS);
});

router.post("/character/daily-reward", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const chars = await db.select().from(charactersTable).where(eq(charactersTable.userId, user.id)).limit(1);
  if (!chars.length) { res.status(404).json({ error: "Chưa tạo nhân vật", code: "NO_CHARACTER" }); return; }
  const char = chars[0];

  const now = new Date();
  const resetStart = getDailyResetStart(now);

  // Anti-double-claim
  if (char.lastDailyClaimAt && char.lastDailyClaimAt >= resetStart) {
    const nextClaim = getNextDailyResetAt(now);
    const msRemaining = nextClaim.getTime() - now.getTime();
    const hoursLeft = Math.floor(msRemaining / 3600000);
    const minsLeft = Math.floor((msRemaining % 3600000) / 60000);
    res.status(400).json({
      error: `Đã nhận thưởng hôm nay. Còn ${hoursLeft}h ${minsLeft}m đến lần tiếp theo.`,
      code: "ALREADY_CLAIMED_TODAY",
      nextClaimAt: nextClaim.toISOString(),
      loginStreak: char.loginStreak,
    });
    return;
  }

  // Check monthly card status — auto-expire if past expiry date
  let cardActive = char.monthlyCardActive;
  if (cardActive && char.monthlyCardExpiresAt && char.monthlyCardExpiresAt < now) {
    cardActive = false;
    await db.update(charactersTable).set({ monthlyCardActive: false, updatedAt: now }).where(eq(charactersTable.id, char.id));
  }
  const CARD_BONUS_LS = cardActive ? 100 : 0;

  // Compute streak
  const yesterday = getPreviousDailyResetStart(now);
  let newStreak: number;
  if (char.lastDailyClaimAt && char.lastDailyClaimAt >= yesterday && char.lastDailyClaimAt < resetStart) {
    newStreak = Math.min((char.loginStreak ?? 0) + 1, 7);
  } else {
    newStreak = 1;
  }
  if (newStreak > 7) newStreak = 1;

  const streakDay = newStreak;
  const reward = STREAK_REWARDS[streakDay - 1];
  const linhThachGained = reward.linhThach + CARD_BONUS_LS;
  const newLinhThach = char.linhThach + linhThachGained;

  await db.update(charactersTable).set({
    linhThach: newLinhThach,
    lastDailyClaimAt: now,
    loginStreak: newStreak,
    loginStreakUpdatedAt: now,
    updatedAt: now,
  }).where(eq(charactersTable.id, char.id));

  // Grant item if any
  let itemGranted: { id: string; name: string; qty: number } | null = null;
  if (reward.itemId) {
    const existing = await db.select().from(inventoryItemsTable)
      .where(and(eq(inventoryItemsTable.charId, char.id), eq(inventoryItemsTable.templateId, reward.itemId))).limit(1);
    if (existing.length) {
      await db.update(inventoryItemsTable).set({ qty: existing[0].qty + 1 }).where(eq(inventoryItemsTable.id, existing[0].id));
    } else {
      await db.insert(inventoryItemsTable).values({ charId: char.id, templateId: reward.itemId, qty: 1 });
    }
    itemGranted = { id: reward.itemId, name: reward.itemName!, qty: 1 };
    await logEconomy({
      charId: char.id, type: "item_grant", amount: 1, source: "daily_login",
      meta: { itemId: reward.itemId, itemName: reward.itemName, streakDay },
    });
  }

  // Economy log + battle pass XP
  await Promise.all([
    logEconomy({ charId: char.id, type: "linh_thach_gain", amount: linhThachGained, source: "daily_login", balanceAfter: newLinhThach, meta: { streakDay } }),
    grantBattlePassXp(char.id, 10),
  ]);

  const nextClaim = getNextDailyResetAt(now);
  const itemMsg = itemGranted ? ` và 1x ${itemGranted.name}` : "";
  res.json({
    message: cardActive
      ? `Điểm danh ngày ${streakDay} (Nguyệt Đạo Thẻ)! +${linhThachGained} Linh Thạch${itemMsg}.`
      : `Điểm danh ngày ${streakDay}! +${linhThachGained} Linh Thạch${itemMsg}.`,
    linhThachGained,
    monthlyCardBonus: CARD_BONUS_LS,
    itemGranted,
    loginStreak: newStreak,
    streakDay,
    nextStreakDay: newStreak >= 7 ? 1 : newStreak + 1,
    allRewards: STREAK_REWARDS,
    nextClaimAt: nextClaim.toISOString(),
  });
});

router.post("/monthly-card/activate", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const chars = await db.select().from(charactersTable).where(eq(charactersTable.userId, user.id)).limit(1);
  if (!chars.length) { res.status(404).json({ error: "Chưa tạo nhân vật", code: "NO_CHARACTER" }); return; }
  const char = chars[0];

  const COST_TIEN_NGOC = 30;
  const DURATION_DAYS  = 30;

  if (char.tienNgoc < COST_TIEN_NGOC) {
    res.status(400).json({
      error: `Không đủ Tiên Ngọc. Cần ${COST_TIEN_NGOC} TN, hiện có ${char.tienNgoc} TN.`,
      code: "INSUFFICIENT_TIEN_NGOC",
      required: COST_TIEN_NGOC, current: char.tienNgoc,
    }); return;
  }

  const now  = new Date();
  const base = char.monthlyCardActive && char.monthlyCardExpiresAt && char.monthlyCardExpiresAt > now
    ? char.monthlyCardExpiresAt
    : now;
  const expiresAt = new Date(base.getTime() + DURATION_DAYS * 86400000);

  await db.update(charactersTable).set({
    tienNgoc: char.tienNgoc - COST_TIEN_NGOC,
    monthlyCardActive: true,
    monthlyCardExpiresAt: expiresAt,
    updatedAt: now,
  }).where(eq(charactersTable.id, char.id));

  res.json({
    message: `Nguyệt Đạo Thẻ đã kích hoạt! Hết hạn ${expiresAt.toLocaleDateString("vi-VN")}.`,
    tienNgocSpent: COST_TIEN_NGOC,
    expiresAt: expiresAt.toISOString(),
  });
});

export default router;
