import { isSameDailyResetWindow } from "./dailyReset";

export type DailyMissionTemplate = {
  type: string;
};

export type DailyMissionProgress = {
  status: "available" | "accepted" | "completed" | "claimed" | "locked";
  progress: number;
  claimedAt: Date | null;
};

export function isStaleDailyGrindClaim(
  template: DailyMissionTemplate,
  progress: Pick<DailyMissionProgress, "status" | "claimedAt"> | undefined | null,
  now = new Date(),
): boolean {
  return template.type === "grind"
    && progress?.status === "claimed"
    && !!progress.claimedAt
    && !isSameDailyResetWindow(progress.claimedAt, now);
}

export function getDailyGrindAwareStatus(
  template: DailyMissionTemplate,
  progress: Pick<DailyMissionProgress, "status" | "claimedAt"> | undefined | null,
  now = new Date(),
): DailyMissionProgress["status"] | "available" {
  if (!progress) return "available";
  return isStaleDailyGrindClaim(template, progress, now) ? "available" : progress.status;
}

export function getDailyGrindAwareProgress(
  template: DailyMissionTemplate,
  progress: Pick<DailyMissionProgress, "status" | "progress" | "claimedAt"> | undefined | null,
  now = new Date(),
): number {
  if (!progress) return 0;
  return isStaleDailyGrindClaim(template, progress, now) ? 0 : progress.progress;
}

export function dailyGrindResetPatch(now = new Date()) {
  return {
    status: "accepted" as const,
    progress: 0,
    acceptedAt: now,
    completedAt: null,
    claimedAt: null,
  };
}
