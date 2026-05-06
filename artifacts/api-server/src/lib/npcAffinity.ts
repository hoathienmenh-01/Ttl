import { getNextDailyResetAt, isSameDailyResetWindow } from "./dailyReset";

export const NPC_AFFINITY_TALK_GAIN = 2;
export const NPC_AFFINITY_MAX = 100;

export function applyNpcTalkAffinity(current: number, gain = NPC_AFFINITY_TALK_GAIN): number {
  return Math.min(NPC_AFFINITY_MAX, Math.max(0, current) + Math.max(0, gain));
}

export function getNpcAffinityRank(affinity: number): string {
  if (affinity >= 80) return "tri_ky";
  if (affinity >= 50) return "than_thiet";
  if (affinity >= 20) return "quen_biet";
  return "xa_la";
}

export function getNpcAffinityRankForRequirement(requiredAffinity: number): string {
  if (requiredAffinity >= 80) return "tri_ky";
  if (requiredAffinity >= 50) return "than_thiet";
  if (requiredAffinity >= 20) return "quen_biet";
  return "xa_la";
}

export function isNpcAffinityRequirementMet(currentAffinity: number, requiredAffinity: number): boolean {
  return Math.max(0, currentAffinity) >= Math.max(0, requiredAffinity);
}

export function getNpcRankDialogue(dialogue: Record<string, string> | null | undefined, rank: string): string {
  if (!dialogue) return "";
  return dialogue[`greet_${rank}`] ?? dialogue[rank] ?? dialogue.greet ?? "";
}

export function getNpcTalkCooldownState(lastTalkedAt: Date | null | undefined, now = new Date()): {
  canTalk: boolean;
  nextTalkAt: Date | null;
} {
  if (!lastTalkedAt || !isSameDailyResetWindow(lastTalkedAt, now)) {
    return { canTalk: true, nextTalkAt: null };
  }

  return { canTalk: false, nextTalkAt: getNextDailyResetAt(now) };
}
