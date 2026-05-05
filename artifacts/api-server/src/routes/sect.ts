import { Router } from "express";
import { db } from "@workspace/db";
import { sectsTable, charactersTable } from "@workspace/db";
import { eq, count } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router = Router();

async function getChar(userId: string) {
  const chars = await db.select().from(charactersTable).where(eq(charactersTable.userId, userId)).limit(1);
  return chars[0] ?? null;
}

async function formatSect(sect: any) {
  const members = await db.select({ count: count() }).from(charactersTable).where(eq(charactersTable.sectId, sect.id));
  return {
    id: sect.id, name: sect.name, level: sect.level,
    memberCount: members[0]?.count ?? 0,
    maxMembers: sect.maxMembers,
    treasuryLinhThach: sect.treasuryLinhThach,
    description: sect.description,
    leaderId: sect.leaderId ?? null,
    leaderName: sect.leaderName ?? null,
  };
}

router.get("/sect", requireAuth, async (req, res) => {
  const sects = await db.select().from(sectsTable);
  const result = await Promise.all(sects.map(formatSect));
  res.json(result);
});

router.get("/sect/mine", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const char = await getChar(user.id);
  if (!char || !char.sectId) {
    res.status(404).json({ error: "Chưa gia nhập tông môn", code: "NO_SECT" });
    return;
  }
  const sects = await db.select().from(sectsTable).where(eq(sectsTable.id, char.sectId)).limit(1);
  if (!sects.length) { res.status(404).json({ error: "Tông môn không tồn tại", code: "NOT_FOUND" }); return; }
  res.json(await formatSect(sects[0]));
});

router.post("/sect/:sectId/join", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const char = await getChar(user.id);
  if (!char) { res.status(404).json({ error: "Chưa tạo nhân vật", code: "NO_CHARACTER" }); return; }

  const sectId = String(req.params.sectId);
  const sects = await db.select().from(sectsTable).where(eq(sectsTable.id, sectId)).limit(1);
  if (!sects.length) { res.status(404).json({ error: "Tông môn không tồn tại", code: "NOT_FOUND" }); return; }

  await db.update(charactersTable).set({ sectId, updatedAt: new Date() }).where(eq(charactersTable.id, char.id));
  res.json({ message: `Đã gia nhập ${sects[0].name}!` });
});

export default router;
