import { Router } from "express";
import { db } from "@workspace/db";
import { marketListingsTable, inventoryItemsTable, itemTemplatesTable, charactersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { z } from "zod";

const router = Router();

async function getChar(userId: string) {
  const chars = await db.select().from(charactersTable).where(eq(charactersTable.userId, userId)).limit(1);
  return chars[0] ?? null;
}

router.get("/market", requireAuth, async (req, res) => {
  const listings = await db.select().from(marketListingsTable)
    .where(eq(marketListingsTable.status, "active"));

  const typeFilter = req.query.type as string | undefined;
  const search = req.query.search as string | undefined;
  let filtered = listings;
  if (typeFilter) filtered = filtered.filter(l => l.itemType === typeFilter);
  if (search) filtered = filtered.filter(l => l.itemName.toLowerCase().includes(search.toLowerCase()));

  res.json(filtered.map(l => ({
    id: l.id, sellerName: l.sellerName, itemName: l.itemName,
    itemType: l.itemType, quality: l.quality, price: l.price,
    qty: l.qty, enhanceLv: l.enhanceLv, description: l.description,
    createdAt: l.createdAt.toISOString(),
  })));
});

router.post("/market/list", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const char = await getChar(user.id);
  if (!char) { res.status(404).json({ error: "Chưa tạo nhân vật", code: "NO_CHARACTER" }); return; }

  const schema = z.object({
    inventoryItemId: z.string(),
    price: z.number().int().min(1),
    qty: z.number().int().min(1),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Dữ liệu không hợp lệ", code: "VALIDATION_ERROR" }); return; }

  const items = await db
    .select({ item: inventoryItemsTable, template: itemTemplatesTable })
    .from(inventoryItemsTable)
    .innerJoin(itemTemplatesTable, eq(inventoryItemsTable.templateId, itemTemplatesTable.id))
    .where(and(eq(inventoryItemsTable.id, parsed.data.inventoryItemId), eq(inventoryItemsTable.charId, char.id)))
    .limit(1);

  if (!items.length) { res.status(404).json({ error: "Vật phẩm không tồn tại", code: "ITEM_NOT_FOUND" }); return; }
  const { item, template } = items[0];
  const qty = Math.min(parsed.data.qty, item.qty);

  const [listing] = await db.insert(marketListingsTable).values({
    sellerId: char.id, sellerName: char.name,
    inventoryItemId: item.id, itemTemplateId: template.id,
    itemName: template.name, itemType: template.type,
    quality: template.quality, enhanceLv: item.enhanceLv,
    description: template.description, price: parsed.data.price, qty,
  }).returning();

  if (item.qty <= qty) {
    await db.delete(inventoryItemsTable).where(eq(inventoryItemsTable.id, item.id));
  } else {
    await db.update(inventoryItemsTable).set({ qty: item.qty - qty }).where(eq(inventoryItemsTable.id, item.id));
  }

  res.status(201).json({
    id: listing.id, sellerName: listing.sellerName, itemName: listing.itemName,
    itemType: listing.itemType, quality: listing.quality, price: listing.price,
    qty: listing.qty, enhanceLv: listing.enhanceLv, description: listing.description,
    createdAt: listing.createdAt.toISOString(),
  });
});

router.post("/market/:listingId/buy", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const char = await getChar(user.id);
  if (!char) { res.status(404).json({ error: "Chưa tạo nhân vật", code: "NO_CHARACTER" }); return; }

  const listings = await db.select().from(marketListingsTable)
    .where(and(eq(marketListingsTable.id, req.params.listingId as string), eq(marketListingsTable.status, "active")))
    .limit(1);

  if (!listings.length) { res.status(404).json({ error: "Sản phẩm không còn trên chợ", code: "LISTING_GONE" }); return; }
  const listing = listings[0];

  if (listing.sellerId === char.id) { res.status(400).json({ error: "Không thể mua vật phẩm của chính mình", code: "SELF_BUY" }); return; }
  if (char.linhThach < listing.price) { res.status(400).json({ error: "Linh thạch không đủ", code: "INSUFFICIENT_FUNDS" }); return; }

  await db.update(charactersTable).set({ linhThach: char.linhThach - listing.price, updatedAt: new Date() }).where(eq(charactersTable.id, char.id));
  await db.insert(inventoryItemsTable).values({ charId: char.id, templateId: listing.itemTemplateId, qty: listing.qty, enhanceLv: listing.enhanceLv });
  await db.update(marketListingsTable).set({ status: "sold", buyerId: char.id, soldAt: new Date() }).where(eq(marketListingsTable.id, listing.id));

  res.json({ message: `Đã mua ${listing.itemName} với giá ${listing.price} Linh Thạch.` });
});

export default router;
