import { Router } from "express";
import { db } from "@workspace/db";
import {
  dungeonTemplatesTable, charactersTable, inventoryItemsTable, itemTemplatesTable,
  characterSkillsTable, skillTemplatesTable,
  characterPetsTable, petTemplatesTable,
} from "@workspace/db";
import { and, eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { getRealmByKey } from "../lib/realms";
import {
  ELEMENT_RELATIONS, ELEMENT_STRONG_MOD, ELEMENT_WEAK_MOD,
  DUNGEON_STAMINA_COST, DEFAULT_DUNGEON_STAMINA_COST, MIN_HP,
  ROOT_COMBAT_MULTIPLIER, ELEMENT_GENERATION, ELEMENT_GENERATION_MOD,
} from "../lib/balance";
import { checkAndAwardAchievements } from "../lib/achievements";
import { trackMissionProgress } from "../lib/missionProgress";
import { logEconomy } from "../lib/economyLog";
import { grantPassXp } from "../lib/grantPassXp";
import { resolveSkillCast } from "../lib/skillCombat";
import { resolvePetCombatBonus, rollPetProc } from "../lib/petCombat";

const router = Router();

type FloorResult = {
  floor: number;
  name: string;
  type: "normal" | "boss";
  victory: boolean;
  rounds: number;
  monsterHpMax: number;
  monsterAtk: number;
  monsterDef: number;
  hpRemaining: number;
  expGained: number;
  linhThachGained: number;
  drops: string[];
};

type RewardSummary = {
  exp: number;
  linhThach: number;
  drops: string[];
};

async function getChar(userId: string) {
  const rows = await db.select().from(charactersTable).where(eq(charactersTable.userId, userId)).limit(1);
  return rows[0] ?? null;
}

async function getCharSkills(charId: string) {
  const rows = await db
    .select({ skill: skillTemplatesTable, activeSlot: characterSkillsTable.activeSlot })
    .from(characterSkillsTable)
    .innerJoin(skillTemplatesTable, eq(characterSkillsTable.skillId, skillTemplatesTable.id))
    .where(eq(characterSkillsTable.charId, charId));
  return rows.map(r => ({ ...r.skill, activeSlot: r.activeSlot }));
}

async function getActivePet(charId: string) {
  const rows = await db
    .select({ cp: characterPetsTable, pet: petTemplatesTable })
    .from(characterPetsTable)
    .innerJoin(petTemplatesTable, eq(characterPetsTable.petId, petTemplatesTable.id))
    .where(and(eq(characterPetsTable.charId, charId), eq(characterPetsTable.active, true)))
    .limit(1);
  return rows[0]?.pet ?? null;
}

router.get("/dungeon", async (req, res) => {
  const dungeons = await db.select().from(dungeonTemplatesTable);
  res.json(dungeons.map(d => ({
    ...d,
    staminaCost: DUNGEON_STAMINA_COST[d.difficulty ?? "medium"] ?? DEFAULT_DUNGEON_STAMINA_COST,
  })));
});

router.post("/dungeon/:dungeonId/enter", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const char = await getChar(user.id);
  if (!char) { res.status(404).json({ error: "Chưa tạo nhân vật" }); return; }

  const dungeons = await db.select().from(dungeonTemplatesTable)
    .where(eq(dungeonTemplatesTable.id, String(req.params.dungeonId))).limit(1);
  if (!dungeons.length) { res.status(404).json({ error: "Bí cảnh không tồn tại" }); return; }
  const dungeon = dungeons[0];

  const playerRealm = getRealmByKey(char.realmKey);
  const minRealm    = dungeon.minRealm ? getRealmByKey(dungeon.minRealm) : null;
  if (minRealm && playerRealm && playerRealm.order < minRealm.order) {
    res.status(400).json({ error: `Cần đạt cảnh giới ${minRealm.name} để vào bí cảnh này` });
    return;
  }

  // ── Stamina gate ──────────────────────────────────────────────────────────
  const staminaCost = DUNGEON_STAMINA_COST[dungeon.difficulty ?? "medium"] ?? DEFAULT_DUNGEON_STAMINA_COST;
  if (char.stamina < staminaCost) {
    res.status(400).json({
      error: `Thể lực không đủ. Cần ${staminaCost} thể lực, hiện có ${char.stamina}. Hãy nghỉ ngơi để hồi phục.`,
      code: "INSUFFICIENT_STAMINA",
      required: staminaCost,
      current: char.stamina,
    });
    return;
  }

  // ── Element modifier ──────────────────────────────────────────────────────
  const playerEl = char.primaryElement ?? "kim";
  const dunEl    = dungeon.element ?? "kim";
  const relation = ELEMENT_RELATIONS[playerEl] ?? { strong: "", weak: "" };

  let elementMod = 1.0;
  let elementMsg = "";
  if (relation.strong === dunEl) {
    elementMod = ELEMENT_STRONG_MOD;
    elementMsg = "Ngũ hành tương khắc — công kích tăng 30%!";
  } else if (relation.weak === dunEl) {
    elementMod = ELEMENT_WEAK_MOD;
    elementMsg = "Ngũ hành tương sinh địch mạnh — công kích giảm 25%!";
  } else if (ELEMENT_GENERATION[playerEl] === dunEl) {
    elementMod = ELEMENT_GENERATION_MOD;
    elementMsg = "Ngũ hành tương sinh — công kích tăng nhẹ!";
  } else {
    elementMsg = "Ngũ hành trung lập.";
  }

  // ── Spiritual root combat modifier ────────────────────────────────────────
  const rootGrade = char.spiritualRootGrade ?? "common";
  const rootCombatMod = ROOT_COMBAT_MULTIPLIER[rootGrade] ?? 1.0;
  const rootCombatMsg = rootCombatMod > 1.0
    ? `Linh căn ${rootGrade === "epic" ? "Thiên Phú" : rootGrade === "rare" ? "Ưu Tú" : "Lương Hảo"} — ATK +${Math.round((rootCombatMod - 1) * 100)}%.`
    : "";

  // ── Learned combat skills ─────────────────────────────────────────────────
  const skills = await getCharSkills(char.id);
  const activePet = await getActivePet(char.id);
  const petBonus = resolvePetCombatBonus(activePet);
  const attackSkillNames = skills
    .filter(s => s.type === "attack" && (s.damageMultiplier ?? 1) > 1)
    .map(s => s.name);

  // ── Combat simulation ─────────────────────────────────────────────────────
  const stages = dungeon.stages ?? 3;
  const logs: string[] = [`Vào bí cảnh: ${dungeon.name}. ${elementMsg}`];
  if (rootCombatMsg) logs.push(rootCombatMsg);
  if (attackSkillNames.length) logs.push(`Pháp thuật sẵn sàng: ${attackSkillNames.join(", ")}.`);
  if (petBonus.log) logs.push(petBonus.log);

  let charHp = char.hp;
  let charMp = char.mp;
  let combatRound = 0;
  let nextSkillRound = 1;
  const skillUsage = new Map<string, { id: string; name: string; casts: number; mpConsumed: number; cooldownRounds: number; log: string | null }>();
  const floorResults: FloorResult[] = [];
  let bossResult: FloorResult | null = null;
  let totalExpGained = 0;
  let totalLinhThach = 0;
  let victory = true;

  function fightStage(
    label: string, monHp: number, monAtk: number, monDef: number,
    isBoss: boolean, floor: number,
  ): FloorResult {
    let currentMonHp = monHp;
    let round = 0;
    const maxRounds = isBoss ? 30 : 20;
    logs.push(`${isBoss ? "★ BOSS" : "—"} ${label} xuất hiện (HP: ${monHp})!`);
    while (currentMonHp > 0 && charHp > 0 && round < maxRounds) {
      round++;
      combatRound++;
      const skillCast = resolveSkillCast({
        learnedSkills: skills,
        playerElement: playerEl,
        targetElement: dunEl,
        spiritualRootGrade: rootGrade,
        mpRemaining: charMp,
        round: combatRound,
        nextAvailableRound: nextSkillRound,
      });
      if (skillCast.skill) {
        charMp = Math.max(0, charMp - skillCast.mpCost);
        nextSkillRound = combatRound + skillCast.cooldownRounds;
        const prev = skillUsage.get(skillCast.skill.id) ?? {
          id: skillCast.skill.id,
          name: skillCast.skill.name,
          casts: 0,
          mpConsumed: 0,
          cooldownRounds: skillCast.cooldownRounds,
          log: skillCast.log,
        };
        prev.casts += 1;
        prev.mpConsumed += skillCast.mpCost;
        prev.cooldownRounds = skillCast.cooldownRounds;
        prev.log = skillCast.log;
        skillUsage.set(skillCast.skill.id, prev);
        if (skillCast.log) logs.push(skillCast.log);
      }
      const effectiveAtk = Math.round(char.atk * rootCombatMod * petBonus.atkMultiplier);
      const effectiveDef = Math.round(char.def * petBonus.defMultiplier);
      const baseDmg = Math.max(1, effectiveAtk - Math.floor(monDef * 0.3));
      let playerDmg = Math.round(baseDmg * skillCast.damageMultiplier * elementMod * (0.85 + Math.random() * 0.3));
      if (rollPetProc(petBonus)) {
        const procDmg = Math.max(1, Math.round(baseDmg * petBonus.procDamagePct));
        playerDmg += procDmg;
        logs.push(`${petBonus.pet?.name} hỗ trợ thêm ${procDmg} sát thương.`);
      }
      currentMonHp = Math.max(0, currentMonHp - playerDmg);
      if (currentMonHp > 0) {
        const monDmg = Math.max(1, Math.round(monAtk * (0.8 + Math.random() * 0.4) - effectiveDef * 0.4));
        charHp = Math.max(0, charHp - monDmg);
      }
    }
    if (charHp <= 0) {
      logs.push(`Ngươi đã bại trận trước ${label}!`);
      return {
        floor,
        name: label,
        type: isBoss ? "boss" : "normal",
        victory: false,
        rounds: round,
        monsterHpMax: monHp,
        monsterAtk: monAtk,
        monsterDef: monDef,
        hpRemaining: 0,
        expGained: 0,
        linhThachGained: 0,
        drops: [],
      };
    }
    const expBase = dungeon.expReward ?? 200;
    const lsBase = dungeon.linhThachReward ?? 100;
    const expBonus = isBoss
      ? Math.round(expBase * 0.65)
      : Math.round(expBase * (0.18 + floor * 0.04));
    const lsBonus = isBoss
      ? Math.round(lsBase * 0.45)
      : Math.round(lsBase * (0.12 + floor * 0.03));
    logs.push(
      isBoss
        ? `★ Đã tiêu diệt ${label}! +${expBonus} EXP, +${lsBonus} Linh Thạch.`
        : `Tiêu diệt ${label}! +${expBonus} EXP`,
    );
    return {
      floor,
      name: label,
      type: isBoss ? "boss" : "normal",
      victory: true,
      rounds: round,
      monsterHpMax: monHp,
      monsterAtk: monAtk,
      monsterDef: monDef,
      hpRemaining: charHp,
      expGained: expBonus,
      linhThachGained: lsBonus,
      drops: [],
    };
  }

  for (let s = 1; s <= stages; s++) {
    const monHp  = Math.round((dungeon.monsterHp  ?? 500) * (1 + (s - 1) * 0.3));
    const monAtk = Math.round((dungeon.monsterAtk ?? 50)  * (1 + (s - 1) * 0.2));
    const monDef = dungeon.monsterDef ?? 10;
    const label  = `Tầng ${s}: ${dungeon.monsterName}`;
    const result = fightStage(label, monHp, monAtk, monDef, false, s);
    floorResults.push(result);
    if (!result.victory) { victory = false; break; }
    totalExpGained += result.expGained;
    totalLinhThach += result.linhThachGained;
  }

  // ── Final Boss Floor ───────────────────────────────────────────────────────
  let bossDefeated = false;
  if (victory) {
    const bossHp  = Math.round((dungeon.monsterHp  ?? 500) * 2.0);
    const bossAtk = Math.round((dungeon.monsterAtk ?? 50)  * 1.5);
    const bossDef = Math.round((dungeon.monsterDef ?? 10)  * 1.5);
    const bossName = `${dungeon.monsterName} Thủ Hộ`;
    logs.push(`\n⚔ Tầng Cuối — Thủ Hộ Giả xuất hiện!`);
    bossResult = fightStage(bossName, bossHp, bossAtk, bossDef, true, stages + 1);
    if (!bossResult.victory) {
      victory = false;
    } else {
      bossDefeated = true;
      totalExpGained += bossResult.expGained;
      totalLinhThach += bossResult.linhThachGained;
    }
  }

  // ── Loot ──────────────────────────────────────────────────────────────────
  const drops: string[] = [];
  if (victory) {
    const clearExp = Math.round((dungeon.expReward ?? 200) * 0.25);
    const clearLinhThach = Math.round((dungeon.linhThachReward ?? 100) * 0.2);
    totalExpGained += clearExp;
    totalLinhThach += clearLinhThach;
    logs.push(`Hoàn thành bí cảnh! Tổng: +${totalExpGained} EXP, +${totalLinhThach} Linh Thạch.`);
    const dropItems = (dungeon.dropItems as string[]) ?? [];
    const regularDropItems = dropItems.slice(0, Math.max(0, dropItems.length - 1));
    const bossDropItems = bossDefeated ? dropItems.slice(-1) : [];

    for (const itemId of regularDropItems) {
      if (Math.random() < 0.25) {
        const tmpl = await db.select().from(itemTemplatesTable)
          .where(eq(itemTemplatesTable.id, itemId)).limit(1);
        if (tmpl.length) {
          drops.push(tmpl[0].name);
          await db.insert(inventoryItemsTable).values({ charId: char.id, templateId: itemId, qty: 1 });
        }
      }
    }
    for (let i = 0; i < bossDropItems.length; i++) {
      const itemId = bossDropItems[i];
      const guaranteed = i === 0;
      if (guaranteed || Math.random() < 0.2) {
        const tmpl = await db.select().from(itemTemplatesTable)
          .where(eq(itemTemplatesTable.id, itemId)).limit(1);
        if (tmpl.length) {
          drops.push(tmpl[0].name);
          if (bossResult) bossResult.drops.push(tmpl[0].name);
          await db.insert(inventoryItemsTable).values({ charId: char.id, templateId: itemId, qty: 1 });
          logs.push(`Boss cuối rơi: ${tmpl[0].name}.`);
        }
      }
    }
    if (drops.length) logs.push(`Nhận vật phẩm: ${drops.join(", ")}.`);
  }

  // ── Persist ───────────────────────────────────────────────────────────────
  const finalHp      = Math.max(MIN_HP, charHp);
  const finalStamina = Math.max(0, char.stamina - staminaCost);
  const newLinhThach = char.linhThach + totalLinhThach;
  await db.update(charactersTable).set({
    exp:      char.exp + totalExpGained,
    linhThach: newLinhThach,
    hp:       finalHp,
    mp:       charMp,
    stamina:  finalStamina,
    dungeonClears: victory ? char.dungeonClears + 1 : char.dungeonClears,
    updatedAt: new Date(),
  }).where(eq(charactersTable.id, char.id));

  // ── Economy Logs + Battle Pass XP (on victory) ────────────────────────────
  if (victory) {
    await Promise.allSettled([
      logEconomy({ charId: char.id, type: "exp_gain", amount: totalExpGained, source: `dungeon:${dungeon.id}`, balanceAfter: char.exp + totalExpGained, meta: { dungeonName: dungeon.name } }),
      logEconomy({ charId: char.id, type: "linh_thach_gain", amount: totalLinhThach, source: `dungeon:${dungeon.id}`, balanceAfter: char.linhThach + totalLinhThach, meta: { dungeonName: dungeon.name } }),
      grantPassXp(char.id, 50),
    ]);
  }

  const newlyEarned: string[] = [];
  const completedMissions: string[] = [];

  res.json({
    victory, logs, drops,
    expGained: totalExpGained,
    linhThachGained: totalLinhThach,
    floorResults,
    bossResult,
    totalRewards: {
      exp: totalExpGained,
      linhThach: totalLinhThach,
      drops,
    } satisfies RewardSummary,
    hpRemaining: finalHp,
    mpRemaining: charMp,
    skillUsed: Array.from(skillUsage.values())[0] ?? null,
    skillUsage: Array.from(skillUsage.values()),
    petUsed: petBonus.pet ? {
      id: petBonus.pet.id,
      name: petBonus.pet.name,
      atkPct: petBonus.atkPct,
      defPct: petBonus.defPct,
      procChance: petBonus.procChance,
      procDamagePct: petBonus.procDamagePct,
      log: petBonus.log,
    } : null,
    staminaRemaining: finalStamina,
    staminaCost,
    elementMessage: elementMsg,
    newlyEarned,
    completedMissions,
    message: victory
      ? `Chinh phục ${dungeon.name} thành công! +${totalExpGained} EXP, +${totalLinhThach} Linh Thạch.`
      : `Bại trận tại ${dungeon.name}.`,
  });
});

export default router;
