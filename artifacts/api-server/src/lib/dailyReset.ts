export const DAILY_RESET_HOUR = 4;
const DAY_MS = 24 * 60 * 60 * 1000;

export function getDailyResetStart(now = new Date()): Date {
  const resetStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), DAILY_RESET_HOUR, 0, 0, 0);
  if (now < resetStart) {
    return new Date(resetStart.getTime() - DAY_MS);
  }
  return resetStart;
}

export function getPreviousDailyResetStart(now = new Date()): Date {
  return new Date(getDailyResetStart(now).getTime() - DAY_MS);
}

export function getNextDailyResetAt(now = new Date()): Date {
  return new Date(getDailyResetStart(now).getTime() + DAY_MS);
}

export function isSameDailyResetWindow(a: Date, b: Date): boolean {
  return getDailyResetStart(a).getTime() === getDailyResetStart(b).getTime();
}
