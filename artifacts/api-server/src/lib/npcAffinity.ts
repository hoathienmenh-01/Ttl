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
