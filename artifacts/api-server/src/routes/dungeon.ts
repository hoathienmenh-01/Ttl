import { Router } from "express";
import { db } from "@workspace/db";
import {
  dungeonTemplatesTable, charactersTable, inventoryItemsTable, itemTemplatesTable,
  characterSkillsTable, skillTemplatesTable,
} from "@workspace/db";
import { eq } from "drizzle-orm";
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

const router = Router();

async function getChar(userId: string) {
  const rows = await db.select().from(charactersTable).where(eq(charactersTable.userId, userId)).limit(1);
  return rows[0] ?? null;
}

async function getCharSkills(charId: string) {
  const rows = await db
    .select({ skill: skillTemplatesTable })
    .from(characterSkillsTable)
    .innerJoin(skillTemplatesTable, eq(characterSkillsTable.skillId, skillTemplatesTable.id))
    .where(eq(characterSkillsTable.charId, charId));
  return rows.map(r => r.skill);
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
  const attackSkillNames = skills
    .filter(s => s.type === "attack" && (s.damageMultiplier ?? 1) > 1)
    .map(s => s.name);

  // ── Combat simulation ─────────────────────────────────────────────────────
  const stages = dungeon.stages ?? 3;
  const logs: string[] = [`Vào bí cảnh: ${dungeon.name}. ${elementMsg}`];
  if (rootCombatMsg) logs.push(rootCombatMsg);
  if (attackSkillNames.length) logs.push(`Pháp thuật sẵn sàng: ${attackSkillNames.join(", ")}.`);

  let charHp = char.hp;
  let charMp = char.mp;
  let combatRound = 0;
  let nextSkillRound = 1;
  let totalExpGained = 0;
  let totalLinhThach = 0;
  let victory = true;

  function fightStage(
    label: string, monHp: number, monAtk: number, monDef: number,
    isBoss: boolean,
  ): { survived: boolean; expBonus: number; lsBonus: number } {
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
        if (skillCast.log) logs.push(skillCast.log);
      }
      const effectiveAtk = Math.round(char.atk * rootCombatMod);
      const baseDmg = Math.max(1, effectiveAtk - Math.floor(monDef * 0.3));
      const playerDmg = Math.round(baseDmg * skillCast.damageMultiplier * elementMod * (0.85 + Math.random() * 0.3));
      currentMonHp = Math.max(0, currentMonHp - playerDmg);
      if (currentMonHp > 0) {
        const monDmg = Math.max(1, Math.round(monAtk * (0.8 + Math.random() * 0.4) - char.def * 0.4));
        charHp = Math.max(0, charHp - monDmg);
      }
    }
    if (charHp <= 0) {
      logs.push(`Ngươi đã bại trận trước ${label}!`);
      return { survived: false, expBonus: 0, lsBonus: 0 };
    }
    const expBonus = isBoss
      ? Math.round((dungeon.expReward ?? 200) * 1.5)
      : Math.round((dungeon.expReward ?? 200) * stages * 0.4);
    const lsBonus = isBoss
      ? Math.round((dungeon.linhThachReward ?? 100) * 1.5)
      : Math.round((dungeon.linhThachReward ?? 100) * stages * 0.3);
    logs.push(
      isBoss
        ? `★ Đã tiêu diệt ${label}! +${expBonus} EXP, +${lsBonus} Linh Thạch.`
        : `Tiêu diệt ${label}! +${expBonus} EXP`,
    );
    return { survived: true, expBonus, lsBonus };
  }

  for (let s = 1; s <= stages; s++) {
    const monHp  = Math.round((dungeon.monsterHp  ?? 500) * (1 + (s - 1) * 0.3));
    const monAtk = Math.round((dungeon.monsterAtk ?? 50)  * (1 + (s - 1) * 0.2));
    const monDef = dungeon.monsterDef ?? 10;
    const label  = `Tầng ${s}: ${dungeon.monsterName}`;
    const result = fightStage(label, monHp, monAtk, monDef, false);
    if (!result.survived) { victory = false; break; }
    totalExpGained += result.expBonus;
    totalLinhThach += result.lsBonus;
  }

  // ── Final Boss Floor ───────────────────────────────────────────────────────
  let bossDefeated = false;
  if (victory) {
    const bossHp  = Math.round((dungeon.monsterHp  ?? 500) * 2.0);
    const bossAtk = Math.round((dungeon.monsterAtk ?? 50)  * 1.5);
    const bossDef = Math.round((dungeon.monsterDef ?? 10)  * 1.5);
    const bossName = `${dungeon.monsterName} Thủ Hộ`;
    logs.push(`\n⚔ Tầng Cuối — Thủ Hộ Giả xuất hiện!`);
    const bossResult = fightStage(bossName, bossHp, bossAtk, bossDef, true);
    if (!bossResult.survived) {
      victory = false;
    } else {
      bossDefeated = true;
      totalExpGained += bossResult.expBonus;
      totalLinhThach += bossResult.lsBonus;
    }
  }

  // ── Loot ──────────────────────────────────────────────────────────────────
  const drops: string[] = [];
  if (victory) {
    totalExpGained += dungeon.expReward ?? 200;
    totalLinhThach += dungeon.linhThachReward ?? 100;
    logs.push(`Hoàn thành bí cảnh! Tổng: +${totalExpGained} EXP, +${totalLinhThach} Linh Thạch.`);
    const dropItems = (dungeon.dropItems as string[]) ?? [];

    for (let i = 0; i < dropItems.length; i++) {
      const itemId = dropItems[i];
      const guaranteed = bossDefeated && i === 0;
      if (guaranteed || Math.random() < 0.4) {
        const tmpl = await db.select().from(itemTemplatesTable)
          .where(eq(itemTemplatesTable.id, itemId)).limit(1);
        if (tmpl.length) {
          drops.push(tmpl[0].name);
          await db.insert(inventoryItemsTable).values({ charId: char.id, templateId: itemId, qty: 1 });
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
    hpRemaining: finalHp,
    mpRemaining: charMp,
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
