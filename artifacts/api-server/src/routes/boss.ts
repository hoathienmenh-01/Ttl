import { Router } from "express";
import { db } from "@workspace/db";
import {
  bossTemplatesTable, bossSpawnsTable, bossAttackLogsTable, charactersTable,
  inventoryItemsTable, itemTemplatesTable, characterSkillsTable, skillTemplatesTable,
  characterPetsTable, petTemplatesTable,
} from "@workspace/db";
import { eq, isNull, and, gt } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { getRealmByKey, computePower } from "../lib/realms";
import { ROOT_COMBAT_MULTIPLIER } from "../lib/balance";
import { checkAndAwardAchievements } from "../lib/achievements";
import { trackMissionProgress } from "../lib/missionProgress";
import { logEconomy } from "../lib/economyLog";
import { grantBattlePassXp } from "../lib/battlePassXp";
import { resolveSkillCast } from "../lib/skillCombat";
import { resolvePetCombatBonus, rollPetProc } from "../lib/petCombat";

const router = Router();

async function getChar(userId: string) {
  const chars = await db.select().from(charactersTable).where(eq(charactersTable.userId, userId)).limit(1);
  return chars[0] ?? null;
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

async function ensureBossSpawns() {
  const templates = await db.select().from(bossTemplatesTable);
  for (const tmpl of templates) {
    const alive = await db.select().from(bossSpawnsTable)
      .where(and(eq(bossSpawnsTable.templateId, tmpl.id), isNull(bossSpawnsTable.deadAt)))
      .limit(1);
    if (!alive.length) {
      await db.insert(bossSpawnsTable).values({
        templateId: tmpl.id,
        hpCurrent: tmpl.hpMax,
      });
    }
  }
}

router.get("/boss", requireAuth, async (req, res) => {
  await ensureBossSpawns();
  const spawns = await db
    .select({ spawn: bossSpawnsTable, template: bossTemplatesTable })
    .from(bossSpawnsTable)
    .innerJoin(bossTemplatesTable, eq(bossSpawnsTable.templateId, bossTemplatesTable.id))
    .where(isNull(bossSpawnsTable.deadAt));

  res.json(spawns.map(({ spawn, template }) => ({
    id: spawn.id, name: template.name, description: template.description,
    element: template.element ?? null, hpCurrent: spawn.hpCurrent, hpMax: template.hpMax,
    power: template.power, minRealm: template.minRealm, zone: template.zone,
    isWorldBoss: template.isWorldBoss,
    spawnedAt: spawn.spawnedAt.toISOString(),
    deadAt: spawn.deadAt?.toISOString() ?? null,
  })));
});

router.post("/boss/:bossId/attack", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const char = await getChar(user.id);
  if (!char) { res.status(404).json({ error: "Chưa tạo nhân vật", code: "NO_CHARACTER" }); return; }

  const spawns = await db
    .select({ spawn: bossSpawnsTable, template: bossTemplatesTable })
    .from(bossSpawnsTable)
    .innerJoin(bossTemplatesTable, eq(bossSpawnsTable.templateId, bossTemplatesTable.id))
    .where(and(eq(bossSpawnsTable.id, req.params.bossId as string), isNull(bossSpawnsTable.deadAt)))
    .limit(1);

  if (!spawns.length) { res.status(404).json({ error: "Quái vật không tồn tại hoặc đã bị tiêu diệt", code: "BOSS_DEAD" }); return; }
  const { spawn, template } = spawns[0];

  const charPower = computePower(char);
  const critChance = char.crit;
  const isCrit = Math.random() < critChance;
  const rootCombatMod = ROOT_COMBAT_MULTIPLIER[char.spiritualRootGrade ?? "common"] ?? 1.0;
  const skills = await getCharSkills(char.id);
  const activePet = await getActivePet(char.id);
  const petBonus = resolvePetCombatBonus(activePet);
  const skillCast = resolveSkillCast({
    learnedSkills: skills,
    playerElement: char.primaryElement ?? "kim",
    targetElement: template.element ?? "kim",
    spiritualRootGrade: char.spiritualRootGrade,
    mpRemaining: char.mp,
    round: 1,
    nextAvailableRound: 1,
  });
  const effectiveAtk = Math.round(char.atk * rootCombatMod * petBonus.atkMultiplier);
  const effectiveDef = Math.round(char.def * petBonus.defMultiplier);
  const baseDmg = Math.max(1, effectiveAtk - Math.floor(template.def * 0.3));
  let playerDmg = Math.round(baseDmg * skillCast.damageMultiplier * (isCrit ? 1.5 : 1) * (0.9 + Math.random() * 0.2));
  const petProc = rollPetProc(petBonus);
  const petProcDmg = petProc ? Math.max(1, Math.round(baseDmg * petBonus.procDamagePct)) : 0;
  playerDmg += petProcDmg;
  const bossDmg = Math.max(1, Math.round(template.atk * (0.8 + Math.random() * 0.4) - effectiveDef * 0.5));

  const newHp = Math.max(0, spawn.hpCurrent - playerDmg);
  const bossKilled = newHp === 0;

  const rootBonusPct = Math.round((rootCombatMod - 1) * 100);
  const logs: string[] = [
    `${char.name} công kích ${template.name}!`,
    ...(rootBonusPct > 0 ? [`Linh căn kích hoạt — ATK +${rootBonusPct}%.`] : []),
    isCrit ? `Trọng kích! Gây ${playerDmg} sát thương!` : `Gây ${playerDmg} sát thương.`,
  ];

  if (skillCast.log) logs.splice(rootBonusPct > 0 ? 2 : 1, 0, skillCast.log);
  if (petBonus.log) logs.splice(rootBonusPct > 0 || skillCast.log ? 2 : 1, 0, petBonus.log);
  if (petProcDmg > 0) logs.push(`${petBonus.pet?.name} hỗ trợ thêm ${petProcDmg} sát thương.`);

  if (!bossKilled) {
    logs.push(`${template.name} phản công gây ${bossDmg} sát thương!`);
    await db.update(charactersTable).set({
      hp: Math.max(1, char.hp - bossDmg),
      mp: Math.max(0, char.mp - skillCast.mpCost),
      updatedAt: new Date(),
    }).where(eq(charactersTable.id, char.id));
  }

  const expGained = bossKilled ? template.expDrop : Math.floor(template.expDrop * 0.1);
  const linhThachGained = bossKilled ? template.linhThachDrop : Math.floor(template.linhThachDrop * 0.1);

  await db.update(charactersTable).set({
    exp: char.exp + expGained,
    linhThach: char.linhThach + linhThachGained,
    mp: Math.max(0, char.mp - skillCast.mpCost),
    bossKills: bossKilled ? char.bossKills + 1 : char.bossKills,
    updatedAt: new Date(),
  }).where(eq(charactersTable.id, char.id));

  await db.insert(bossAttackLogsTable).values({ spawnId: spawn.id, charId: char.id, dmgDealt: playerDmg });

  const drops: string[] = [];
  if (bossKilled) {
    logs.push(`${template.name} đã bị tiêu diệt!`);
    await db.update(bossSpawnsTable).set({ deadAt: new Date(), killedBy: char.id }).where(eq(bossSpawnsTable.id, spawn.id));
    if (template.dropItems.length) {
      for (const itemId of template.dropItems) {
        const tmplRows = await db.select().from(itemTemplatesTable).where(eq(itemTemplatesTable.id, itemId)).limit(1);
        if (tmplRows.length) {
          drops.push(tmplRows[0].name);
          await db.insert(inventoryItemsTable).values({ charId: char.id, templateId: itemId, qty: 1 });
        }
      }
    }
  }

  const newLinhThach = char.linhThach + linhThachGained;
  if (bossKilled) {
    await Promise.all([
      logEconomy({ charId: char.id, type: "exp_gain", amount: expGained, source: "boss", meta: { boss: template.name } }),
      logEconomy({ charId: char.id, type: "linh_thach_gain", amount: linhThachGained, source: "boss", balanceAfter: newLinhThach, meta: { boss: template.name } }),
      grantBattlePassXp(char.id, 20),
    ]);
  }

  const [newlyEarned, completedMissions] = bossKilled
    ? await Promise.all([
        checkAndAwardAchievements(char.id),
        trackMissionProgress(char.id, "boss_kill"),
      ])
    : [[], []];

  res.json({
    playerDmg, bossDmg: bossKilled ? 0 : bossDmg, bossKilled, drops,
    skillUsed: skillCast.skill ? {
      id: skillCast.skill.id,
      name: skillCast.skill.name,
      mpCost: skillCast.mpCost,
      mpConsumed: skillCast.mpCost,
      cooldownRounds: skillCast.cooldownRounds,
      log: skillCast.log,
    } : null,
    petUsed: petBonus.pet ? {
      id: petBonus.pet.id,
      name: petBonus.pet.name,
      atkPct: petBonus.atkPct,
      defPct: petBonus.defPct,
      procChance: petBonus.procChance,
      procDamagePct: petBonus.procDamagePct,
      procDamage: petProcDmg,
      log: petBonus.log,
    } : null,
    mpRemaining: Math.max(0, char.mp - skillCast.mpCost),
    expGained, linhThachGained, newlyEarned, completedMissions,
    message: bossKilled ? `Đã hạ ${template.name}! Nhận ${expGained} EXP và ${linhThachGained} Linh Thạch.`
      : `Tấn công ${template.name} gây ${playerDmg} sát thương.`,
    logs,
  });
});

export default router;
