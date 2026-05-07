/**
 * Dungeon Modifiers — Server-side logic for floor and boss modifiers
 * Modifiers affect combat calculations and may have hard caps to prevent one-shots
 */

export const MODIFIER_DAMAGE_CAP = 0.25; // Max 25% damage per round from single modifier
export const MODIFIER_DRAIN_CAP = 0.15; // Max 15% MP drain per round
export const MODIFIER_ARMOR_CAP = 0.4; // Max 40% damage reduction from armor
export const MODIFIER_REGEN_CAP = 0.08; // Max 8% HP regen per round
export const MODIFIER_FREEZE_CAP = 0.3; // Max 30% attack reduction from freeze

interface ModifierApplyResult {
  damageReduction: number; // From armor
  extraDamage: number; // From fire, poison, freeze attack reduction
  mpDrain: number; // From MP drain
  hpRegen: number; // From regen
  damagePerRound: number; // Additional per-round damage
  log: string | null;
}

/**
 * Apply floor/room modifiers during combat round
 * @param modifiers Object with modifier keys and strength values (0.0-1.0)
 * @param playerHp Current player HP
 * @param playerMaxHp Max player HP
 * @param playerMp Current player MP
 * @param playerAtk Current player attack
 * @param baseDmgTaken Base damage taken this round
 * @param round Combat round number
 * @returns Modifier adjustments and log message
 */
export function applyFloorModifiers(
  modifiers: Record<string, number>,
  playerHp: number,
  playerMaxHp: number,
  playerMp: number,
  playerAtk: number,
  baseDmgTaken: number,
  round: number,
): ModifierApplyResult {
  const result: ModifierApplyResult = {
    damageReduction: 0,
    extraDamage: 0,
    mpDrain: 0,
    hpRegen: 0,
    damagePerRound: 0,
    log: null,
  };

  const logs: string[] = [];

  // ── Poison (damage over time) ──
  if (modifiers.poison && modifiers.poison > 0) {
    // Always apply poison damage, but at a reduced rate based on round
    const poisonDmg = Math.min(Math.round(playerMaxHp * modifiers.poison * MODIFIER_DAMAGE_CAP * 0.5), 40);
    if (poisonDmg > 0) {
      result.damagePerRound += poisonDmg;
      logs.push(`☠ Độc chất hoàn hành — mất ${poisonDmg} HP`);
    }
  }

  // ── Fire damage (each round) ──
  if (modifiers.fire_damage && modifiers.fire_damage > 0) {
    const fireDmg = Math.min(Math.round(playerMaxHp * modifiers.fire_damage * MODIFIER_DAMAGE_CAP), 60);
    result.damagePerRound += fireDmg;
    logs.push(`🔥 Lửa thiêu đốt — mất ${fireDmg} HP`);
  }

  // ── Freeze (slow/reduce attack) ──
  if (modifiers.freeze && modifiers.freeze > 0) {
    const atkReduction = Math.round(playerAtk * modifiers.freeze * MODIFIER_FREEZE_CAP);
    result.extraDamage -= atkReduction; // Negative means we attack less
    logs.push(`❄ Băng phong buộc chân — ATK giảm ${atkReduction}`);
  }

  // ── Armor (reduce damage taken) ──
  if (modifiers.armor && modifiers.armor > 0) {
    const dmgReduction = Math.round(baseDmgTaken * modifiers.armor * MODIFIER_ARMOR_CAP);
    result.damageReduction = dmgReduction;
    logs.push(`🛡 Giáp thạch kỳ lạ — mất ${dmgReduction} ít hơn`);
  }

  // ── MP Drain ──
  if (modifiers.mp_drain && modifiers.mp_drain > 0) {
    const mpDrain = Math.min(Math.round(playerMp * modifiers.mp_drain * MODIFIER_DRAIN_CAP), 40);
    if (mpDrain > 0) {
      result.mpDrain = mpDrain;
      logs.push(`⚡ Âm khí hút MP — mất ${mpDrain} MP`);
    }
  }

  // ── Regen (enemy healing) ──
  if (modifiers.regen && modifiers.regen > 0) {
    const regen = Math.round(playerMaxHp * modifiers.regen * MODIFIER_REGEN_CAP);
    result.hpRegen = regen;
    logs.push(`🌿 Quái vật hồi máu — hồi ${regen} HP`);
  }

  if (logs.length > 0) {
    result.log = logs.join(". ") + ".";
  }

  return result;
}

/**
 * Apply boss-specific mechanic
 * Each element has a signature mechanic that scales with boss difficulty
 * @param bossModifiers Object with boss mechanic keys and strength values
 * @param playerHp Current player HP
 * @param playerMaxHp Max player HP
 * @param playerMp Current player MP
 * @param round Combat round number
 * @returns Boss mechanic effects
 */
export function applyBossMechanic(
  bossModifiers: Record<string, number>,
  playerHp: number,
  playerMaxHp: number,
  playerMp: number,
  round: number,
): ModifierApplyResult {
  const result: ModifierApplyResult = {
    damageReduction: 0,
    extraDamage: 0,
    mpDrain: 0,
    hpRegen: 0,
    damagePerRound: 0,
    log: null,
  };

  const logs: string[] = [];

  // ── Boss poison damage ──
  if (bossModifiers.poison_damage && bossModifiers.poison_damage > 0) {
    const bossPoisonDmg = Math.min(Math.round(playerMaxHp * bossModifiers.poison_damage * 0.15), 60);
    if (bossPoisonDmg > 0) {
      result.damagePerRound += bossPoisonDmg;
      logs.push(`★ Độc hơi quái vật — mất ${bossPoisonDmg} HP`);
    }
  }

  // ── Boss fire breath ──
  if (bossModifiers.fire_damage && bossModifiers.fire_damage > 0) {
    const bossFireDmg = Math.min(Math.round(playerMaxHp * bossModifiers.fire_damage * 0.2), 80);
    if (bossFireDmg > 0) {
      result.damagePerRound += bossFireDmg;
      logs.push(`★ Hơi lửa quái vật — mất ${bossFireDmg} HP`);
    }
  }

  // ── Boss freeze/stun ──
  if (bossModifiers.freeze && bossModifiers.freeze > 0) {
    const freezeStunMsg = `★ Quái vật sắp sửa phóng ngã lạnh buốt — chuẩn bị phòng thủ!`;
    logs.push(freezeStunMsg);
  }

  // ── Boss armor ──
  if (bossModifiers.armor && bossModifiers.armor > 0) {
    // This is cosmetic log; actual reduction is in monster defense calculation
    logs.push(`★ Quái vật mặc giáp thạch vô cùng cứng — khó đâm thủng!`);
  }

  // ── Boss regen ──
  if (bossModifiers.regen && bossModifiers.regen > 0) {
    const bossRegen = Math.round(playerMaxHp * bossModifiers.regen * 0.25);
    if (bossRegen > 0) {
      result.hpRegen = bossRegen;
      logs.push(`★ Quái vật tự chữa lành — hồi ${bossRegen} HP`);
    }
  }

  // ── Boss MP drain ──
  if (bossModifiers.mp_drain && bossModifiers.mp_drain > 0) {
    const bossMpDrain = Math.min(Math.round(playerMp * bossModifiers.mp_drain * 0.25), 50);
    if (bossMpDrain > 0) {
      result.mpDrain = bossMpDrain;
      logs.push(`★ Quái vật hút linh khí — mất ${bossMpDrain} MP`);
    }
  }

  if (logs.length > 0) {
    result.log = logs.join(". ") + ".";
  }

  return result;
}

/**
 * Get modifier warning message for player before entering dungeon
 */
export function getModifierWarning(modifiers: Record<string, number> | undefined): string | null {
  if (!modifiers || Object.keys(modifiers).length === 0) {
    return null;
  }

  const warnings: string[] = [];
  if (modifiers.poison) warnings.push("độc chất");
  if (modifiers.fire_damage) warnings.push("lửa thiêu đốt");
  if (modifiers.freeze) warnings.push("băng phong");
  if (modifiers.armor) warnings.push("giáp cứng");
  if (modifiers.regen) warnings.push("quái vật tự hồi");
  if (modifiers.mp_drain) warnings.push("hút MP");

  if (warnings.length === 0) return null;

  return `⚠ Cảnh báo: Bí cảnh này có ${warnings.join(", ")}. Chuẩn bị kỹ càng!`;
}

/**
 * Cap damage per round to prevent one-shot kills
 * Total modifier damage should not exceed ~15% of player HP
 */
export function capModifierDamagePerRound(damagePerRound: number, playerMaxHp: number): number {
  const cap = Math.round(playerMaxHp * 0.15);
  return Math.min(damagePerRound, cap);
}
