import { Router } from "express";
import { db } from "@workspace/db";
import { inventoryItemsTable, itemTemplatesTable, charactersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { z } from "zod";
import { computePower } from "../lib/realms";

/**
 * Maps item baseStats keys to character table column names for equipment bonuses.
 * Note: equipment 'hp' bonus → hpMax, 'mp' bonus → mpMax (not current hp/mp).
 */
const EQUIP_STAT_MAP: Record<string, string> = {
  atk: "atk", def: "def", spirit: "spirit",
  hp: "hpMax", mp: "mpMax",
  speed: "speed", luck: "luck", power: "power",
};

/** Equipment types that can be placed in a slot */
const EQUIP_TYPES = ["weapon", "armor", "belt", "boots", "hat", "accessory"];

/** Consumable types */
const CONSUMABLE_TYPES = ["pill", "herb"];

/**
 * Compute updated character column values by applying stat delta from equipment.
 * sign = +1 for equip, -1 for unequip.
 * Returns only the columns that change, with values already clamped ≥ 0.
 */
function buildStatUpdates(char: any, itemStats: Record<string, number>, sign: 1 | -1): Record<string, number> {
  const updates: Record<string, number> = {};
  for (const [key, val] of Object.entries(itemStats)) {
    const col = EQUIP_STAT_MAP[key];
    if (col && typeof char[col] === "number") {
      updates[col] = Math.max(0, char[col] + sign * val);
    }
  }
  // Clamp current hp/mp to (possibly changed) max values
  if (updates.hpMax !== undefined) {
    updates.hp = Math.min(char.hp, updates.hpMax);
  }
  if (updates.mpMax !== undefined) {
    updates.mp = Math.min(char.mp, updates.mpMax);
  }
  return updates;
}

const router = Router();

async function getChar(userId: string) {
  const chars = await db.select().from(charactersTable).where(eq(charactersTable.userId, userId)).limit(1);
  return chars[0] ?? null;
}

router.get("/inventory", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const char = await getChar(user.id);
  if (!char) { res.status(404).json({ error: "Chưa tạo nhân vật", code: "NO_CHARACTER" }); return; }

  const items = await db
    .select({ item: inventoryItemsTable, template: itemTemplatesTable })
    .from(inventoryItemsTable)
    .innerJoin(itemTemplatesTable, eq(inventoryItemsTable.templateId, itemTemplatesTable.id))
    .where(eq(inventoryItemsTable.charId, char.id));

  const typeFilter = req.query.type as string | undefined;
  const search = req.query.search as string | undefined;

  let filtered = items;
  if (typeFilter) filtered = filtered.filter(i => i.template.type === typeFilter);
  if (search) filtered = filtered.filter(i => i.template.name.toLowerCase().includes(search.toLowerCase()));

  res.json(filtered.map(({ item, template }) => ({
    id: item.id, templateId: template.id, name: template.name,
    type: template.type, quality: template.quality, qty: item.qty,
    enhanceLv: item.enhanceLv, equipped: item.equipped, slot: item.slot ?? null,
    iconUrl: template.iconUrl ?? null, description: template.description,
    baseStats: template.baseStats,
    sellPrice: template.sellPrice,
  })));
});

router.post("/inventory/:itemId/use", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const char = await getChar(user.id);
  if (!char) { res.status(404).json({ error: "Chưa tạo nhân vật", code: "NO_CHARACTER" }); return; }

  const items = await db
    .select({ item: inventoryItemsTable, template: itemTemplatesTable })
    .from(inventoryItemsTable)
    .innerJoin(itemTemplatesTable, eq(inventoryItemsTable.templateId, itemTemplatesTable.id))
    .where(and(eq(inventoryItemsTable.id, req.params.itemId as string), eq(inventoryItemsTable.charId, char.id)))
    .limit(1);

  if (!items.length) { res.status(404).json({ error: "Vật phẩm không tồn tại", code: "ITEM_NOT_FOUND" }); return; }
  const { item, template } = items[0];

  if (!CONSUMABLE_TYPES.includes(template.type)) {
    res.status(400).json({ error: "Vật phẩm này không thể sử dụng trực tiếp", code: "CANNOT_USE" });
    return;
  }

  const stats: any = template.baseStats ?? {};
  const updates: any = { updatedAt: new Date() };
  const effects: string[] = [];

  if (stats.hp) {
    const gained = Math.min(stats.hp, char.hpMax - char.hp);
    updates.hp = char.hp + gained;
    effects.push(`Hồi ${gained} HP`);
  }
  if (stats.mp) {
    const gained = Math.min(stats.mp, char.mpMax - char.mp);
    updates.mp = char.mp + gained;
    effects.push(`Hồi ${gained} MP`);
  }
  if (stats.exp) { updates.exp = char.exp + stats.exp; effects.push(`+${stats.exp} EXP`); }

  if (effects.length === 0) {
    effects.push("Không có hiệu ứng ngay lập tức");
  }

  await db.update(charactersTable).set(updates).where(eq(charactersTable.id, char.id));

  // Consume qty (never go negative)
  if (item.qty <= 1) {
    await db.delete(inventoryItemsTable).where(eq(inventoryItemsTable.id, item.id));
  } else {
    await db.update(inventoryItemsTable)
      .set({ qty: Math.max(0, item.qty - 1) })
      .where(eq(inventoryItemsTable.id, item.id));
  }

  res.json({ message: `Đã sử dụng ${template.name}.`, effects, effectsSummary: effects.join(", ") });
});

router.post("/inventory/:itemId/equip", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const char = await getChar(user.id);
  if (!char) { res.status(404).json({ error: "Chưa tạo nhân vật", code: "NO_CHARACTER" }); return; }

  const items = await db
    .select({ item: inventoryItemsTable, template: itemTemplatesTable })
    .from(inventoryItemsTable)
    .innerJoin(itemTemplatesTable, eq(inventoryItemsTable.templateId, itemTemplatesTable.id))
    .where(and(eq(inventoryItemsTable.id, req.params.itemId as string), eq(inventoryItemsTable.charId, char.id)))
    .limit(1);

  if (!items.length) { res.status(404).json({ error: "Vật phẩm không tồn tại", code: "ITEM_NOT_FOUND" }); return; }
  const { item, template } = items[0];

  if (!EQUIP_TYPES.includes(template.type)) {
    res.status(400).json({ error: "Vật phẩm không thể trang bị", code: "CANNOT_EQUIP" });
    return;
  }

  // Cannot equip if already equipped
  if (item.equipped) {
    res.status(400).json({ error: "Vật phẩm đã được trang bị rồi", code: "ALREADY_EQUIPPED" });
    return;
  }

  // Find old equipped item in same slot (to subtract its stats)
  const oldItems = await db
    .select({ item: inventoryItemsTable, template: itemTemplatesTable })
    .from(inventoryItemsTable)
    .innerJoin(itemTemplatesTable, eq(inventoryItemsTable.templateId, itemTemplatesTable.id))
    .where(and(
      eq(inventoryItemsTable.charId, char.id),
      eq(inventoryItemsTable.slot, template.type as any),
      eq(inventoryItemsTable.equipped, true),
    ))
    .limit(1);

  // Compute net stat delta: subtract old item stats, add new item stats
  let updatedChar = { ...char };
  if (oldItems.length) {
    const oldStats = (oldItems[0].template.baseStats ?? {}) as Record<string, number>;
    const removals = buildStatUpdates(updatedChar, oldStats, -1);
    updatedChar = { ...updatedChar, ...removals };
  }
  const newStats = (template.baseStats ?? {}) as Record<string, number>;
  const additions = buildStatUpdates(updatedChar, newStats, 1);
  const statUpdates = { ...additions };

  // Recompute power after stat changes
  const charAfterEquip = { ...updatedChar, ...statUpdates };
  const newPower = computePower({
    power: charAfterEquip.power ?? char.power,
    spirit: charAfterEquip.spirit ?? char.spirit,
    speed: charAfterEquip.speed ?? char.speed,
    atk: charAfterEquip.atk ?? char.atk,
    def: charAfterEquip.def ?? char.def,
    hpMax: charAfterEquip.hpMax ?? char.hpMax,
    realmKey: char.realmKey,
    realmStage: char.realmStage,
  });
  statUpdates.power = newPower;

  // Unequip old item in same slot
  if (oldItems.length) {
    await db.update(inventoryItemsTable)
      .set({ equipped: false, slot: null })
      .where(and(eq(inventoryItemsTable.charId, char.id), eq(inventoryItemsTable.slot, template.type as any)));
  }

  // Equip new item
  await db.update(inventoryItemsTable)
    .set({ equipped: true, slot: template.type as any })
    .where(eq(inventoryItemsTable.id, item.id));

  // Apply stat changes (including refreshed power) to character
  await db.update(charactersTable)
    .set({ ...statUpdates, updatedAt: new Date() })
    .where(eq(charactersTable.id, char.id));

  res.json({
    message: `Đã trang bị ${template.name}.`,
    statsApplied: statUpdates,
    newPower,
  });
});

router.post("/inventory/:itemId/unequip", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const char = await getChar(user.id);
  if (!char) { res.status(404).json({ error: "Chưa tạo nhân vật", code: "NO_CHARACTER" }); return; }

  const items = await db
    .select({ item: inventoryItemsTable, template: itemTemplatesTable })
    .from(inventoryItemsTable)
    .innerJoin(itemTemplatesTable, eq(inventoryItemsTable.templateId, itemTemplatesTable.id))
    .where(and(eq(inventoryItemsTable.id, req.params.itemId as string), eq(inventoryItemsTable.charId, char.id)))
    .limit(1);

  if (!items.length) { res.status(404).json({ error: "Vật phẩm không tồn tại", code: "ITEM_NOT_FOUND" }); return; }
  const { item, template } = items[0];

  if (!item.equipped) {
    res.status(400).json({ error: "Vật phẩm chưa được trang bị", code: "NOT_EQUIPPED" });
    return;
  }

  // Subtract item stats from character
  const itemStats = (template.baseStats ?? {}) as Record<string, number>;
  const statUpdates = buildStatUpdates(char, itemStats, -1);

  // Recompute power after unequip
  const charAfterUnequip = { ...char, ...statUpdates };
  const newPower = computePower({
    power: charAfterUnequip.power ?? char.power,
    spirit: charAfterUnequip.spirit ?? char.spirit,
    speed: charAfterUnequip.speed ?? char.speed,
    atk: charAfterUnequip.atk ?? char.atk,
    def: charAfterUnequip.def ?? char.def,
    hpMax: charAfterUnequip.hpMax ?? char.hpMax,
    realmKey: char.realmKey,
    realmStage: char.realmStage,
  });
  statUpdates.power = newPower;

  await db.update(inventoryItemsTable)
    .set({ equipped: false, slot: null })
    .where(and(eq(inventoryItemsTable.id, req.params.itemId as string), eq(inventoryItemsTable.charId, char.id)));

  await db.update(charactersTable)
    .set({ ...statUpdates, updatedAt: new Date() })
    .where(eq(charactersTable.id, char.id));

  res.json({ message: "Đã tháo trang bị.", statsRemoved: statUpdates, newPower });
});

router.post("/inventory/:itemId/sell", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const char = await getChar(user.id);
  if (!char) { res.status(404).json({ error: "Chưa tạo nhân vật", code: "NO_CHARACTER" }); return; }

  const schema = z.object({ qty: z.number().int().min(1) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Số lượng không hợp lệ", code: "INVALID_QTY" }); return; }

  const items = await db
    .select({ item: inventoryItemsTable, template: itemTemplatesTable })
    .from(inventoryItemsTable)
    .innerJoin(itemTemplatesTable, eq(inventoryItemsTable.templateId, itemTemplatesTable.id))
    .where(and(eq(inventoryItemsTable.id, req.params.itemId as string), eq(inventoryItemsTable.charId, char.id)))
    .limit(1);

  if (!items.length) { res.status(404).json({ error: "Vật phẩm không tồn tại", code: "ITEM_NOT_FOUND" }); return; }
  const { item, template } = items[0];

  if (item.equipped) {
    res.status(400).json({ error: "Không thể bán trang bị đang mặc. Hãy tháo ra trước.", code: "ITEM_EQUIPPED" });
    return;
  }

  // Clamp qty to what player actually has (never go negative)
  const qty = Math.min(Math.max(1, parsed.data.qty), item.qty);
  const earned = qty * template.sellPrice;

  await db.update(charactersTable)
    .set({ linhThach: char.linhThach + earned, updatedAt: new Date() })
    .where(eq(charactersTable.id, char.id));

  const newQty = item.qty - qty;
  if (newQty <= 0) {
    await db.delete(inventoryItemsTable).where(eq(inventoryItemsTable.id, item.id));
  } else {
    await db.update(inventoryItemsTable)
      .set({ qty: newQty })
      .where(eq(inventoryItemsTable.id, item.id));
  }

  res.json({ message: `Đã bán ${qty} ${template.name} được ${earned} linh thạch.`, earned, newLinhThach: char.linhThach + earned });
});

export default router;
