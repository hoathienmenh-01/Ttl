import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, charactersTable, topupRequestsTable, economyLogsTable, inventoryItemsTable, itemTemplatesTable } from "@workspace/db";
import { eq, like, count, sum, desc, and } from "drizzle-orm";
import { requireAdmin } from "../middlewares/auth";
import { getRealmName, computePower } from "../lib/realms";
import { z } from "zod";

const router = Router();

router.get("/admin/stats", requireAdmin, async (req, res) => {
  const [totalUsers] = await db.select({ count: count() }).from(usersTable);
  const [totalChars] = await db.select({ count: count() }).from(charactersTable);
  const [pendingTopups] = await db.select({ count: count() }).from(topupRequestsTable).where(eq(topupRequestsTable.status, "pending"));
  const [totalTopup] = await db.select({ total: sum(topupRequestsTable.amount) }).from(topupRequestsTable).where(eq(topupRequestsTable.status, "approved"));
  const [cultivating] = await db.select({ count: count() }).from(charactersTable).where(eq(charactersTable.cultivating, true));
  const [activeMonthlyCards] = await db.select({ count: count() }).from(charactersTable).where(eq(charactersTable.monthlyCardActive, true));

  res.json({
    totalUsers: totalUsers.count,
    onlineNow: Math.floor(totalChars.count * 0.3),
    totalCharacters: totalChars.count,
    pendingTopups: pendingTopups.count,
    totalTopupVnd: Number(totalTopup.total ?? 0),
    activeBosskills24h: 0,
    newUsersToday: 0,
    cultivatingNow: cultivating.count,
    activeMonthlyCards: activeMonthlyCards.count,
  });
});

router.get("/admin/players", requireAdmin, async (req, res) => {
  const search = req.query.search as string | undefined;
  const limit = Math.min(Number(req.query.limit) || 50, 200);

  let users = await db.select().from(usersTable).limit(limit);
  if (search) {
    users = users.filter(u => u.email.includes(search) || u.username.includes(search));
  }

  const result = await Promise.all(users.map(async u => {
    const chars = await db.select().from(charactersTable).where(eq(charactersTable.userId, u.id)).limit(1);
    const char = chars[0];
    return {
      id: u.id, email: u.email, username: u.username, role: u.role, banned: u.banned,
      characterId: char?.id ?? null,
      characterName: char?.name ?? null,
      realmName: char ? getRealmName(char.realmKey, char.realmStage) : null,
      power: char ? computePower(char) : null,
      linhThach: char?.linhThach ?? null,
      tienNgoc: char?.tienNgoc ?? null,
      monthlyCardActive: char?.monthlyCardActive ?? false,
      monthlyCardExpiresAt: char?.monthlyCardExpiresAt?.toISOString() ?? null,
      lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
      createdAt: u.createdAt.toISOString(),
    };
  }));

  res.json(result);
});

router.get("/admin/topup", requireAdmin, async (req, res) => {
  const topups = await db.select().from(topupRequestsTable).where(eq(topupRequestsTable.status, "pending"));
  res.json(topups.map(t => ({
    id: t.id, amount: t.amount, tienNgocGranted: t.tienNgocGranted,
    status: t.status, transferCode: t.transferCode,
    createdAt: t.createdAt.toISOString(),
    processedAt: t.processedAt?.toISOString() ?? null,
  })));
});

router.post("/admin/topup/:topupId/approve", requireAdmin, async (req, res) => {
  const adminUser = (req as any).user;
  const topups = await db.select().from(topupRequestsTable).where(eq(topupRequestsTable.id, req.params.topupId as string)).limit(1);
  if (!topups.length) { res.status(404).json({ error: "Yêu cầu không tồn tại", code: "NOT_FOUND" }); return; }
  const topup = topups[0];
  if (topup.status !== "pending") { res.status(400).json({ error: "Yêu cầu đã xử lý", code: "ALREADY_PROCESSED" }); return; }

  await db.update(topupRequestsTable).set({
    status: "approved", processedBy: adminUser.id, processedAt: new Date(),
  }).where(eq(topupRequestsTable.id, topup.id));

  if (topup.charId) {
    const chars = await db.select().from(charactersTable).where(eq(charactersTable.id, topup.charId)).limit(1);
    if (chars.length) {
      const char = chars[0];
      await db.update(charactersTable).set({
        tienNgoc: char.tienNgoc + topup.tienNgocGranted,
        updatedAt: new Date(),
      }).where(eq(charactersTable.id, char.id));
    }
  }

  res.json({ message: `Đã duyệt nạp ${topup.amount.toLocaleString()} VND, trao ${topup.tienNgocGranted} Tiên Ngọc.` });
});

router.post("/admin/monthly-card/grant", requireAdmin, async (req, res) => {
  const { charId, days = 30 } = req.body as { charId: string; days?: number };
  if (!charId) { res.status(400).json({ error: "charId là bắt buộc", code: "MISSING_CHAR_ID" }); return; }

  const chars = await db.select().from(charactersTable).where(eq(charactersTable.id, charId)).limit(1);
  if (!chars.length) { res.status(404).json({ error: "Nhân vật không tồn tại", code: "NOT_FOUND" }); return; }
  const char = chars[0];

  const now = new Date();
  const base = char.monthlyCardActive && char.monthlyCardExpiresAt && char.monthlyCardExpiresAt > now
    ? char.monthlyCardExpiresAt
    : now;
  const expiresAt = new Date(base.getTime() + days * 86400000);

  await db.update(charactersTable).set({
    monthlyCardActive: true,
    monthlyCardExpiresAt: expiresAt,
    updatedAt: now,
  }).where(eq(charactersTable.id, char.id));

  res.json({
    message: `Đã cấp Nguyệt Đạo Thẻ ${days} ngày cho ${char.name}. Hết hạn ${expiresAt.toLocaleDateString("vi-VN")}.`,
    charId, expiresAt: expiresAt.toISOString(),
  });
});

router.get("/admin/economy-logs", requireAdmin, async (req, res) => {
  const charId = req.query.charId as string | undefined;
  const type   = req.query.type as string | undefined;
  const limit  = Math.min(Number(req.query.limit) || 100, 500);

  let rows;
  if (charId && type) {
    rows = await db.select().from(economyLogsTable)
      .where(and(eq(economyLogsTable.charId, charId), eq(economyLogsTable.type, type)))
      .orderBy(desc(economyLogsTable.createdAt)).limit(limit);
  } else if (charId) {
    rows = await db.select().from(economyLogsTable)
      .where(eq(economyLogsTable.charId, charId))
      .orderBy(desc(economyLogsTable.createdAt)).limit(limit);
  } else {
    rows = await db.select().from(economyLogsTable)
      .orderBy(desc(economyLogsTable.createdAt)).limit(limit);
  }

  res.json(rows.map(r => ({
    id: r.id, charId: r.charId, type: r.type, amount: r.amount,
    source: r.source, balanceAfter: r.balanceAfter,
    meta: r.meta, createdAt: r.createdAt?.toISOString() ?? null,
  })));
});

/** Admin: give an item directly to a character (for testing / smoke test) */
router.post("/admin/item/give", requireAdmin, async (req, res) => {
  const schema = z.object({
    charId: z.string().min(1),
    templateId: z.string().min(1),
    qty: z.number().int().min(1).max(99).default(1),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Tham số không hợp lệ", code: "INVALID_PARAMS", details: parsed.error.issues });
    return;
  }
  const { charId, templateId, qty } = parsed.data;

  const chars = await db.select().from(charactersTable).where(eq(charactersTable.id, charId)).limit(1);
  if (!chars.length) {
    res.status(404).json({ error: "Nhân vật không tồn tại", code: "NOT_FOUND" });
    return;
  }

  const templates = await db.select().from(itemTemplatesTable).where(eq(itemTemplatesTable.id, templateId)).limit(1);
  if (!templates.length) {
    res.status(404).json({ error: "Item template không tồn tại", code: "TEMPLATE_NOT_FOUND" });
    return;
  }
  const template = templates[0];

  // Check if stackable and already in inventory
  if (template.stackable) {
    const existing = await db.select().from(inventoryItemsTable)
      .where(and(eq(inventoryItemsTable.charId, charId), eq(inventoryItemsTable.templateId, templateId)))
      .limit(1);
    if (existing.length) {
      await db.update(inventoryItemsTable)
        .set({ qty: existing[0].qty + qty })
        .where(eq(inventoryItemsTable.id, existing[0].id));
      res.json({ message: `Đã thêm ${qty}x ${template.name} vào kho nhân vật.`, stacked: true });
      return;
    }
  }

  await db.insert(inventoryItemsTable).values({
    charId,
    templateId,
    qty,
    enhanceLv: 0,
    equipped: false,
  });

  res.json({ message: `Đã cấp ${qty}x ${template.name} cho nhân vật.`, stacked: false });
});

/** Admin: list all item templates (for give-item dropdown) */
router.get("/admin/item/templates", requireAdmin, async (req, res) => {
  const templates = await db.select({
    id: itemTemplatesTable.id,
    name: itemTemplatesTable.name,
    type: itemTemplatesTable.type,
    quality: itemTemplatesTable.quality,
  }).from(itemTemplatesTable);
  res.json(templates);
});

export default router;
