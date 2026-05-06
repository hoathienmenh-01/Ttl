import {
  ELEMENT_GENERATION,
  ELEMENT_RELATIONS,
  ROOT_SKILL_AFFINITY,
  SKILL_COOLDOWN_ROUND_SECONDS,
  SKILL_DAMAGE_MULTIPLIER_CAP,
} from "./balance";

export type CombatSkill = {
  id: string;
  name: string;
  element: string;
  type: string;
  mpCost: number | null;
  cooldownSeconds: number | null;
  damageMultiplier: number | null;
  activeSlot?: number | null;
};

export type SkillCastResult = {
  skill: CombatSkill | null;
  damageMultiplier: number;
  mpCost: number;
  cooldownRounds: number;
  log: string | null;
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function skillElementBonus(skillElement: string, playerElement: string, targetElement: string): number {
  let bonus = 0;
  if (skillElement === playerElement) bonus += 0.05;

  const relation = ELEMENT_RELATIONS[skillElement];
  if (relation?.strong === targetElement) bonus += 0.10;
  if (relation?.weak === targetElement) bonus -= 0.10;
  if (ELEMENT_GENERATION[skillElement] === targetElement) bonus += 0.04;

  return bonus;
}

export function resolveSkillCast(input: {
  learnedSkills: CombatSkill[];
  playerElement: string;
  targetElement: string;
  spiritualRootGrade: string | null | undefined;
  mpRemaining: number;
  round: number;
  nextAvailableRound: number;
}): SkillCastResult {
  if (input.round < input.nextAvailableRound) {
    return { skill: null, damageMultiplier: 1, mpCost: 0, cooldownRounds: 0, log: null };
  }

  const learnedCandidates = input.learnedSkills
    .filter(s => s.type === "attack")
    .filter(s => (s.damageMultiplier ?? 1) > 1)
    .filter(s => Math.max(0, s.mpCost ?? 0) <= input.mpRemaining);
  const activeCandidates = learnedCandidates.filter(s => s.activeSlot != null);
  const candidates = activeCandidates.length ? activeCandidates : learnedCandidates;

  if (!candidates.length) {
    return { skill: null, damageMultiplier: 1, mpCost: 0, cooldownRounds: 0, log: null };
  }

  const rootAffinity = ROOT_SKILL_AFFINITY[input.spiritualRootGrade ?? "common"] ?? 0;
  const ranked = candidates
    .map(skill => {
      const rawMultiplier = (skill.damageMultiplier ?? 1)
        + rootAffinity
        + skillElementBonus(skill.element, input.playerElement, input.targetElement);
      return {
        skill,
        damageMultiplier: clamp(rawMultiplier, 1, SKILL_DAMAGE_MULTIPLIER_CAP),
      };
    })
    .sort((a, b) => {
      const slotA = a.skill.activeSlot ?? Number.MAX_SAFE_INTEGER;
      const slotB = b.skill.activeSlot ?? Number.MAX_SAFE_INTEGER;
      if (slotA !== slotB) return slotA - slotB;
      return b.damageMultiplier - a.damageMultiplier;
    });

  const best = ranked[0];
  const mpCost = Math.max(0, best.skill.mpCost ?? 0);
  const cooldownRounds = Math.max(
    1,
    Math.ceil((best.skill.cooldownSeconds ?? 0) / SKILL_COOLDOWN_ROUND_SECONDS),
  );
  const bonusPct = Math.round((best.damageMultiplier - 1) * 100);

  return {
    skill: best.skill,
    damageMultiplier: best.damageMultiplier,
    mpCost,
    cooldownRounds,
    log: `Thi triển ${best.skill.name}: -${mpCost} MP, sát thương kỹ năng +${bonusPct}%.`,
  };
}
