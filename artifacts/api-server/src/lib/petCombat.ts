import type { PetBonusStats } from "@workspace/db";

export const PET_ATK_BONUS_CAP = 0.08;
export const PET_DEF_BONUS_CAP = 0.06;
export const PET_PROC_CHANCE_CAP = 0.08;
export const PET_PROC_DAMAGE_CAP = 0.12;
export const PET_LEVEL_BONUS_STEP = 0.005;
export const PET_LEVEL_CAP = 5;
export const PET_EXP_PER_LEVEL = 100;
export const PET_EXP_GRANT_CAP = 25;

export type CombatPet = {
  id: string;
  name: string;
  bonusStats?: PetBonusStats | null;
  procChance?: number | null;
  procDamagePct?: number | null;
  level?: number | null;
};

export type PetCombatBonus = {
  pet: CombatPet | null;
  atkPct: number;
  defPct: number;
  procChance: number;
  procDamagePct: number;
  atkMultiplier: number;
  defMultiplier: number;
  log: string | null;
};

function clampPct(value: number | null | undefined, cap: number): number {
  return Math.max(0, Math.min(cap, Number(value ?? 0)));
}

export function normalizePetXpGrant(amount: number): number {
  return Math.max(0, Math.min(PET_EXP_GRANT_CAP, Math.floor(amount)));
}

export function applyPetExp(currentLevel: number, currentExp: number, rawGain: number) {
  let level = Math.max(1, Math.min(PET_LEVEL_CAP, currentLevel));
  let exp = Math.max(0, currentExp);
  const gained = normalizePetXpGrant(rawGain);
  if (level >= PET_LEVEL_CAP) return { level: PET_LEVEL_CAP, exp: 0, gained };

  exp += gained;
  while (level < PET_LEVEL_CAP && exp >= PET_EXP_PER_LEVEL) {
    level += 1;
    exp -= PET_EXP_PER_LEVEL;
  }
  if (level >= PET_LEVEL_CAP) exp = 0;
  return { level, exp, gained };
}

export function resolvePetCombatBonus(pet: CombatPet | null | undefined): PetCombatBonus {
  if (!pet) {
    return {
      pet: null,
      atkPct: 0,
      defPct: 0,
      procChance: 0,
      procDamagePct: 0,
      atkMultiplier: 1,
      defMultiplier: 1,
      log: null,
    };
  }

  const levelBonus = Math.max(0, (Math.min(5, Math.max(1, pet.level ?? 1)) - 1) * PET_LEVEL_BONUS_STEP);
  const atkPct = clampPct((pet.bonusStats?.atkPct ?? 0) + levelBonus, PET_ATK_BONUS_CAP);
  const defPct = clampPct((pet.bonusStats?.defPct ?? 0) + levelBonus, PET_DEF_BONUS_CAP);
  const procChance = clampPct((pet.procChance ?? 0) + levelBonus * 0.5, PET_PROC_CHANCE_CAP);
  const procDamagePct = clampPct((pet.procDamagePct ?? 0) + levelBonus, PET_PROC_DAMAGE_CAP);
  const parts = [
    atkPct > 0 ? `ATK +${Math.round(atkPct * 100)}%` : null,
    defPct > 0 ? `DEF +${Math.round(defPct * 100)}%` : null,
    procChance > 0 && procDamagePct > 0 ? `proc ${Math.round(procChance * 100)}%` : null,
  ].filter(Boolean).join(", ");

  return {
    pet,
    atkPct,
    defPct,
    procChance,
    procDamagePct,
    atkMultiplier: 1 + atkPct,
    defMultiplier: 1 + defPct,
    log: `Đồng hành ${pet.name} hỗ trợ: ${parts || "hiện diện cổ vũ"}.`,
  };
}

export function rollPetProc(bonus: PetCombatBonus, random = Math.random()): boolean {
  return !!bonus.pet && bonus.procChance > 0 && bonus.procDamagePct > 0 && random < bonus.procChance;
}
