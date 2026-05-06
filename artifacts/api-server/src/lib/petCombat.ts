import type { PetBonusStats } from "@workspace/db";

export const PET_ATK_BONUS_CAP = 0.08;
export const PET_DEF_BONUS_CAP = 0.06;
export const PET_PROC_CHANCE_CAP = 0.08;
export const PET_PROC_DAMAGE_CAP = 0.12;

export type CombatPet = {
  id: string;
  name: string;
  bonusStats?: PetBonusStats | null;
  procChance?: number | null;
  procDamagePct?: number | null;
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

  const atkPct = clampPct(pet.bonusStats?.atkPct, PET_ATK_BONUS_CAP);
  const defPct = clampPct(pet.bonusStats?.defPct, PET_DEF_BONUS_CAP);
  const procChance = clampPct(pet.procChance, PET_PROC_CHANCE_CAP);
  const procDamagePct = clampPct(pet.procDamagePct, PET_PROC_DAMAGE_CAP);
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
