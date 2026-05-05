import { Router } from "express";
import { db } from "@workspace/db";
import { economyLogsTable, charactersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router = Router();

async function getChar(userId: string) {
  const rows = await db.select().from(charactersTable).where(eq(charactersTable.userId, userId)).limit(1);
  return rows[0] ?? null;
}

// Player: own economy log (last 50)
router.get("/economy-log", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const char = await getChar(user.id);
  if (!char) { res.status(404).json({ error: "Chưa tạo nhân vật", code: "NO_CHARACTER" }); return; }

  const logs = await db.select().from(economyLogsTable)
    .where(eq(economyLogsTable.charId, char.id))
    .orderBy(desc(economyLogsTable.createdAt))
    .limit(50);

  res.json(logs.map(l => ({
    id: l.id,
    type: l.type,
    amount: l.amount,
    source: l.source,
    balanceAfter: l.balanceAfter ?? null,
    meta: l.meta ?? null,
    createdAt: l.createdAt?.toISOString() ?? null,
  })));
});

// Admin: all economy logs or filtered by charId
router.get("/economy-log/admin", requireAuth, async (req, res) => {
  const user = (req as any).user;
  if (user.role !== "admin" && user.role !== "mod") {
    res.status(403).json({ error: "Không có quyền", code: "FORBIDDEN" });
    return;
  }

  const charIdFilter = req.query.charId as string | undefined;
  const query = db.select({
    log: economyLogsTable,
    charName: charactersTable.name,
  })
    .from(economyLogsTable)
    .leftJoin(charactersTable, eq(economyLogsTable.charId, charactersTable.id))
    .orderBy(desc(economyLogsTable.createdAt))
    .limit(200);

  const logs = charIdFilter
    ? await db.select({ log: economyLogsTable, charName: charactersTable.name })
        .from(economyLogsTable)
        .leftJoin(charactersTable, eq(economyLogsTable.charId, charactersTable.id))
        .where(eq(economyLogsTable.charId, charIdFilter))
        .orderBy(desc(economyLogsTable.createdAt))
        .limit(200)
    : await query;

  res.json(logs.map(({ log, charName }) => ({
    id: log.id,
    charId: log.charId,
    charName: charName ?? "?",
    type: log.type,
    amount: log.amount,
    source: log.source,
    balanceAfter: log.balanceAfter ?? null,
    meta: log.meta ?? null,
    createdAt: log.createdAt?.toISOString() ?? null,
  })));
});

export default router;
