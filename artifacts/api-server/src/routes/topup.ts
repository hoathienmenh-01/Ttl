import { Router } from "express";
import { db } from "@workspace/db";
import { topupRequestsTable, charactersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { z } from "zod";

const router = Router();

function calcTienNgoc(amountVnd: number): number {
  // 10,000 VND = 1 Tiên Ngọc
  return Math.floor(amountVnd / 10000);
}

async function getChar(userId: string) {
  const chars = await db.select().from(charactersTable).where(eq(charactersTable.userId, userId)).limit(1);
  return chars[0] ?? null;
}

router.post("/topup/request", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const schema = z.object({
    amount: z.number().int().min(10000),
    transferCode: z.string().min(1),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Dữ liệu không hợp lệ", code: "VALIDATION_ERROR" }); return; }

  const char = await getChar(user.id);
  const tienNgoc = calcTienNgoc(parsed.data.amount);

  const [req_] = await db.insert(topupRequestsTable).values({
    userId: user.id, charId: char?.id,
    amount: parsed.data.amount, tienNgocGranted: tienNgoc,
    transferCode: parsed.data.transferCode, status: "pending",
  }).returning();

  res.status(201).json({
    id: req_.id, amount: req_.amount, tienNgocGranted: req_.tienNgocGranted,
    status: req_.status, transferCode: req_.transferCode,
    createdAt: req_.createdAt.toISOString(), processedAt: null,
  });
});

router.get("/topup/history", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const requests = await db.select().from(topupRequestsTable).where(eq(topupRequestsTable.userId, user.id));
  res.json(requests.map(r => ({
    id: r.id, amount: r.amount, tienNgocGranted: r.tienNgocGranted,
    status: r.status, transferCode: r.transferCode,
    createdAt: r.createdAt.toISOString(),
    processedAt: r.processedAt?.toISOString() ?? null,
  })));
});

export default router;
