import { db } from "@workspace/db";
import { economyLogsTable } from "@workspace/db";

export type EconomyLogType =
  | "linh_thach_gain"
  | "linh_thach_spend"
  | "exp_gain"
  | "item_grant";

export async function logEconomy(opts: {
  charId: string;
  type: EconomyLogType;
  amount: number;
  source: string;
  balanceAfter?: number;
  meta?: Record<string, unknown>;
}) {
  await db.insert(economyLogsTable).values({
    charId: opts.charId,
    type: opts.type,
    amount: opts.amount,
    source: opts.source,
    balanceAfter: opts.balanceAfter ?? null,
    meta: opts.meta ?? null,
  });
}
